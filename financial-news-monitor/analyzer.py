"""
analyzer.py — Price swing detection for watched instruments using Finnhub quotes.

No LLM required. Alerts are generated for:
  - Any new news article mentioning a watched instrument (handled in monitor.py)
  - Intraday price/value moves exceeding a configurable % threshold
"""

import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class Alert:
    kind: str           # "news" | "price_swing"
    ticker: str
    name: str

    # News-specific
    headline: str = ""
    url: str = ""
    source: str = ""
    article_datetime: int = 0   # Unix timestamp

    # Price-swing-specific
    current_price: float = 0.0
    change_pct: float = 0.0     # Intraday % change from previous close
    direction: str = ""         # "up" | "down"


class PriceChecker:
    def __init__(self, threshold_pct: float = 3.0):
        self._threshold = threshold_pct

    def check_swing(
        self,
        quote: dict,
        instrument: dict,
    ) -> "Alert | None":
        """
        Returns an Alert if the instrument has moved more than threshold_pct
        from its previous close intraday, otherwise None.
        """
        change_pct = float(quote.get("dp", 0.0) or 0.0)
        current = float(quote.get("c", 0.0) or 0.0)

        if current == 0.0:
            # No valid quote data
            return None

        if abs(change_pct) < self._threshold:
            return None

        direction = "up" if change_pct > 0 else "down"
        logger.info(
            "[%s] Price swing: %.2f%% %s (current: %.2f)",
            instrument["ticker"], abs(change_pct), direction, current,
        )
        return Alert(
            kind="price_swing",
            ticker=instrument["ticker"],
            name=instrument["name"],
            current_price=current,
            change_pct=change_pct,
            direction=direction,
        )
