"""
analyzer.py — Uses Claude Opus 4.6 to decide whether a news article is
significant for a watched instrument and what the likely price/value impact is.

Returns a structured AnalysisResult per article.
"""

import logging
from dataclasses import dataclass
from typing import Any

import anthropic

logger = logging.getLogger(__name__)

# Reuse a single client across the process lifetime
_client: anthropic.Anthropic | None = None


def get_client(api_key: str) -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


# ------------------------------------------------------------------
# Result type
# ------------------------------------------------------------------

@dataclass
class AnalysisResult:
    article_id: str
    headline: str
    url: str
    source: str
    article_datetime: int          # Unix timestamp from Finnhub

    is_significant: bool           # Should this trigger an alert?
    sentiment: str                 # "positive" | "negative" | "neutral"
    confidence: float              # 0.0 – 1.0
    impact_summary: str            # One-sentence summary of why it matters
    key_points: list[str]          # 2-4 bullet points for the email body
    instrument_ticker: str
    instrument_name: str


# ------------------------------------------------------------------
# Analyzer class
# ------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are a senior financial analyst specializing in market-moving news events.
Your job is to evaluate whether a news article is SIGNIFICANT for a specific
financial instrument and, if so, characterize its likely impact.

"Significant" means the article describes information that a reasonable
investor or trader would consider material — i.e., it could cause a
noticeable price or value movement. Examples of significant events:
  - Earnings beats or misses, revenue guidance changes
  - CEO/CFO resignation, major leadership changes
  - Mergers, acquisitions, spin-offs, IPO news
  - Product launches, recalls, safety issues
  - Regulatory approvals, lawsuits, government investigations
  - Macro news directly tied to the instrument (interest rate changes for bonds, etc.)
  - Major partnership announcements or contract wins/losses

Examples of NON-significant events:
  - Minor analyst price target adjustments within normal range
  - Routine conference participations
  - Vague market commentary not specific to the instrument
  - Duplicate coverage of an already-known story

You MUST respond with valid JSON only — no markdown, no explanation outside the JSON object.
"""

ANALYSIS_SCHEMA = """\
{
  "is_significant": <boolean>,
  "sentiment": "<positive|negative|neutral>",
  "confidence": <float between 0.0 and 1.0>,
  "impact_summary": "<one sentence explaining the potential impact>",
  "key_points": ["<point 1>", "<point 2>", "..."]
}
"""


class NewsAnalyzer:
    def __init__(self, api_key: str, min_confidence: float = 0.7):
        self._client = get_client(api_key)
        self._min_confidence = min_confidence

    def analyze_article(
        self,
        article: dict[str, Any],
        instrument: dict[str, str],
    ) -> AnalysisResult:
        """
        Ask Claude whether *article* is significant for *instrument*.
        Returns an AnalysisResult; is_significant will be False if confidence
        is below the configured threshold.
        """
        ticker = instrument["ticker"]
        name = instrument["name"]
        instr_type = instrument.get("type", "financial instrument")

        prompt = (
            f"Instrument: {name} ({ticker}), type: {instr_type}\n\n"
            f"Headline: {article['headline']}\n\n"
            f"Summary: {article['summary'] or '(no summary provided)'}\n\n"
            f"Source: {article['source']}\n\n"
            "Evaluate whether this article is significant for the instrument above.\n"
            f"Respond ONLY with a JSON object matching this schema:\n{ANALYSIS_SCHEMA}"
        )

        try:
            response = self._client.messages.create(
                model="claude-opus-4-6",
                max_tokens=1024,
                thinking={"type": "adaptive"},
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )

            raw_json = self._extract_text(response)
            parsed = self._parse_json(raw_json)
        except anthropic.APIError as exc:
            logger.error("Claude API error for article %s: %s", article["id"], exc)
            parsed = _fallback_result()
        except ValueError as exc:
            logger.warning("Could not parse Claude response for %s: %s", article["id"], exc)
            parsed = _fallback_result()

        confidence = float(parsed.get("confidence", 0.0))
        is_significant = bool(parsed.get("is_significant", False)) and confidence >= self._min_confidence

        return AnalysisResult(
            article_id=article["id"],
            headline=article["headline"],
            url=article["url"],
            source=article["source"],
            article_datetime=article["datetime"],
            is_significant=is_significant,
            sentiment=parsed.get("sentiment", "neutral"),
            confidence=confidence,
            impact_summary=parsed.get("impact_summary", ""),
            key_points=parsed.get("key_points", []),
            instrument_ticker=ticker,
            instrument_name=name,
        )

    def analyze_articles(
        self,
        articles: list[dict[str, Any]],
        instrument: dict[str, str],
    ) -> list[AnalysisResult]:
        """Analyze a batch of articles for an instrument. Returns only significant ones."""
        results = []
        for article in articles:
            result = self.analyze_article(article, instrument)
            logger.debug(
                "[%s] %s → significant=%s sentiment=%s confidence=%.2f",
                instrument["ticker"],
                article["headline"][:60],
                result.is_significant,
                result.sentiment,
                result.confidence,
            )
            if result.is_significant:
                results.append(result)
        return results

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_text(response: anthropic.types.Message) -> str:
        for block in response.content:
            if block.type == "text":
                return block.text.strip()
        raise ValueError("No text block in Claude response")

    @staticmethod
    def _parse_json(text: str) -> dict:
        import json
        # Strip optional markdown fences just in case
        cleaned = text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            cleaned = "\n".join(
                line for line in lines if not line.startswith("```")
            ).strip()
        return json.loads(cleaned)


def _fallback_result() -> dict:
    return {
        "is_significant": False,
        "sentiment": "neutral",
        "confidence": 0.0,
        "impact_summary": "Analysis unavailable.",
        "key_points": [],
    }
