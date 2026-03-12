"""
fetcher.py — Fetches news for financial instruments.

Two sources:
  FinnhubFetcher  — company news + price quotes for exchange-listed tickers
  NewsAPIFetcher  — keyword-based headline search for private/unlisted instruments
                    (requires a NewsAPI.org key; free tier: 100 req/day)

Finnhub docs: https://finnhub.io/docs/api/company-news  (free: 60 req/min)
NewsAPI docs:  https://newsapi.org/docs/endpoints/everything
"""

import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any

import requests

logger = logging.getLogger(__name__)

FINNHUB_BASE = "https://finnhub.io/api/v1"
NEWSAPI_BASE  = "https://newsapi.org/v2"

# Finnhub general market news categories
MARKET_NEWS_CATEGORIES = ["general", "forex", "crypto", "merger"]

# Max chars for a single NewsAPI `q` parameter (leave headroom below 500)
_NEWSAPI_QUERY_LIMIT = 450


class FinnhubFetcher:
    def __init__(self, api_key: str):
        self._api_key = api_key
        self._session = requests.Session()
        self._session.headers.update({"X-Finnhub-Token": api_key})

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def fetch_company_news(
        self,
        ticker: str,
        lookback_hours: int = 24,
        max_articles: int = 5,
    ) -> list[dict[str, Any]]:
        """
        Return up to *max_articles* recent news articles for *ticker*.
        Each article dict has keys: id, headline, summary, url, datetime, source.
        """
        to_dt = datetime.now(tz=timezone.utc)
        from_dt = to_dt - timedelta(hours=lookback_hours)

        params = {
            "symbol": ticker.upper(),
            "from": from_dt.strftime("%Y-%m-%d"),
            "to": to_dt.strftime("%Y-%m-%d"),
        }

        data = self._get("/company-news", params)
        if not isinstance(data, list):
            logger.warning("Unexpected response for %s: %s", ticker, data)
            return []

        articles = [self._normalize(a) for a in data]
        # Sort newest-first and cap
        articles.sort(key=lambda a: a["datetime"], reverse=True)
        return articles[:max_articles]

    def fetch_quote(self, ticker: str) -> dict:
        """
        Return the latest quote for *ticker* from Finnhub.
        Relevant fields: c (current price), dp (% change from prev close),
        d (absolute change), h (high), l (low), o (open), pc (prev close).
        Returns an empty dict if the request fails.
        """
        data = self._get("/quote", {"symbol": ticker.upper()})
        if not isinstance(data, dict):
            logger.warning("Unexpected quote response for %s: %s", ticker, data)
            return {}
        return data

    def fetch_market_news(
        self,
        category: str = "general",
        max_articles: int = 10,
    ) -> list[dict[str, Any]]:
        """
        Return recent market-wide news for a given category.
        Useful as a fallback for non-stock instruments (ETFs, bonds, indices).
        """
        if category not in MARKET_NEWS_CATEGORIES:
            raise ValueError(f"category must be one of {MARKET_NEWS_CATEGORIES}")

        data = self._get("/news", {"category": category})
        if not isinstance(data, list):
            logger.warning("Unexpected market news response: %s", data)
            return []

        articles = [self._normalize(a) for a in data]
        articles.sort(key=lambda a: a["datetime"], reverse=True)
        return articles[:max_articles]

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get(self, path: str, params: dict) -> Any:
        url = FINNHUB_BASE + path
        try:
            resp = self._session.get(url, params=params, timeout=10)
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.HTTPError as exc:
            if exc.response is not None and exc.response.status_code == 429:
                logger.warning("Finnhub rate-limit hit — sleeping 60 s")
                time.sleep(60)
            else:
                logger.error("Finnhub HTTP error for %s: %s", path, exc)
            return []
        except requests.exceptions.RequestException as exc:
            logger.error("Finnhub request failed for %s: %s", path, exc)
            return []

    @staticmethod
    def _normalize(raw: dict) -> dict[str, Any]:
        """Normalize a raw Finnhub article into a consistent shape."""
        return {
            # Finnhub uses 'id' for company news and 'id' for market news
            "id": str(raw.get("id", "") or raw.get("headline", "")),
            "headline": raw.get("headline", ""),
            "summary": raw.get("summary", ""),
            "url": raw.get("url", ""),
            "source": raw.get("source", ""),
            # Finnhub returns a Unix timestamp in 'datetime'
            "datetime": raw.get("datetime", 0),
        }


# ---------------------------------------------------------------------------
# NewsAPI fetcher — keyword-based, for private/unlisted instruments
# ---------------------------------------------------------------------------

class NewsAPIFetcher:
    """
    Searches NewsAPI.org for financial news about private/unlisted instruments.

    All instruments are batched into as few API calls as possible (one per
    ~450-char query chunk) to stay well within the free-tier 100 req/day limit.

    Matching uses HEADLINE-ONLY to filter noise: an article is only attributed
    to an instrument if one of its keywords appears in the article headline.
    This prevents, e.g., every article that mentions a popular brand name in
    passing from flooding alerts.
    """

    def __init__(self, api_key: str):
        self._api_key = api_key
        self._session = requests.Session()

    def fetch_keyword_news(
        self,
        instruments: list[dict],
        lookback_hours: int = 4,
        max_per_instrument: int = 5,
    ) -> dict[str, list[dict]]:
        """
        Batch-fetch news for all instruments using OR-joined keyword queries.

        Returns a dict mapping instrument name → list of articles where at
        least one keyword appears in the article *headline* (case-insensitive).
        Articles are deduplicated by URL across instruments.
        """
        result: dict[str, list[dict]] = {i["name"]: [] for i in instruments}

        # Build per-instrument quoted terms, then chunk into ≤450-char queries
        terms_by_instrument = {
            i["name"]: [f'"{kw}"' for kw in i.get("keywords", [])]
            for i in instruments
            if i.get("keywords")
        }

        # Collect all terms flat for chunking, keeping track of which
        # instrument each term belongs to
        all_terms: list[tuple[str, str]] = []  # (term, instrument_name)
        for instr_name, terms in terms_by_instrument.items():
            for t in terms:
                all_terms.append((t, instr_name))

        if not all_terms:
            return result

        # Split into query chunks
        chunks: list[list[tuple[str, str]]] = []
        current_chunk: list[tuple[str, str]] = []
        current_len = 0
        for term, instr_name in all_terms:
            # " OR " separator = 4 chars
            needed = len(term) + (4 if current_chunk else 0)
            if current_chunk and current_len + needed > _NEWSAPI_QUERY_LIMIT:
                chunks.append(current_chunk)
                current_chunk = [(term, instr_name)]
                current_len = len(term)
            else:
                current_chunk.append((term, instr_name))
                current_len += needed
        if current_chunk:
            chunks.append(current_chunk)

        from_str = (
            datetime.now(tz=timezone.utc) - timedelta(hours=lookback_hours)
        ).strftime("%Y-%m-%dT%H:%M:%SZ")

        seen_urls: set[str] = set()

        for chunk in chunks:
            query = " OR ".join(t for t, _ in chunk)
            articles = self._search(query, from_str)

            for raw in articles:
                url = raw.get("url", "")
                if url in seen_urls:
                    continue
                seen_urls.add(url)

                headline = (raw.get("title") or "").strip()
                if not headline or headline == "[Removed]":
                    continue

                article = {
                    "id": url or headline,
                    "headline": headline,
                    "summary": (raw.get("description") or "").strip(),
                    "url": url,
                    "source": ((raw.get("source") or {}).get("name") or ""),
                    "datetime": _parse_iso(raw.get("publishedAt", "")),
                }

                # Attribute to instruments by headline match only
                headline_lower = headline.lower()
                for term, instr_name in chunk:
                    if len(result[instr_name]) >= max_per_instrument:
                        continue
                    # Strip surrounding quotes from term for matching
                    keyword = term.strip('"').lower()
                    if keyword in headline_lower:
                        result[instr_name].append(article)

        return result

    def _search(self, query: str, from_str: str) -> list[dict]:
        params = {
            "q": query,
            "language": "en",
            "sortBy": "publishedAt",
            "from": from_str,
            "pageSize": 100,
            "apiKey": self._api_key,
        }
        try:
            resp = self._session.get(
                f"{NEWSAPI_BASE}/everything", params=params, timeout=15
            )
            if resp.status_code == 426:
                logger.warning("NewsAPI requires a paid plan for this query.")
                return []
            if resp.status_code == 429:
                logger.warning("NewsAPI rate-limit hit — skipping this cycle.")
                return []
            resp.raise_for_status()
            data = resp.json()
            if data.get("status") != "ok":
                logger.warning("NewsAPI error: %s", data.get("message", data))
                return []
            return data.get("articles", [])
        except requests.exceptions.RequestException as exc:
            logger.error("NewsAPI request failed: %s", exc)
            return []


def _parse_iso(s: str) -> int:
    """Parse an ISO-8601 timestamp string to a Unix integer."""
    if not s:
        return 0
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return int(dt.timestamp())
    except (ValueError, AttributeError):
        return 0
