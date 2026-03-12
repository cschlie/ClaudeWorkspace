"""
fetcher.py — Fetches recent news for financial instruments via the Finnhub API.

Finnhub docs: https://finnhub.io/docs/api/company-news
Free tier: 60 API calls/minute.
"""

import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any

import requests

logger = logging.getLogger(__name__)

FINNHUB_BASE = "https://finnhub.io/api/v1"

# Finnhub general market news categories
MARKET_NEWS_CATEGORIES = ["general", "forex", "crypto", "merger"]


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
