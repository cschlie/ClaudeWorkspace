#!/usr/bin/env python3
"""
monitor.py — Financial News Monitor daemon.

Alerts when:
  1. Any new news article appears for a watched instrument
  2. A watched instrument's price swings more than price_swing_threshold_pct
     from its previous close (intraday)

Usage:
    python monitor.py                    # Run daemon (polls on interval)
    python monitor.py --run-once         # Run a single check and exit
    python monitor.py --config path.yaml # Use a custom config file

Environment variables (set in .env or your shell):
    FINNHUB_API_KEY     — required
    SMTP_PASSWORD       — required for email alerts
"""

import argparse
import logging
import os
import sys
import time
from pathlib import Path

import schedule
import yaml
from dotenv import load_dotenv

from alerter import EmailAlerter
from analyzer import Alert, PriceChecker
from fetcher import FinnhubFetcher
from state import SeenArticleState

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------

def setup_logging(level_str: str) -> None:
    level = getattr(logging, level_str.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def load_config(config_path: str) -> dict:
    with open(config_path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def load_env() -> dict[str, str]:
    load_dotenv()
    missing = []
    keys = {}
    for var in ("FINNHUB_API_KEY", "SMTP_PASSWORD"):
        val = os.getenv(var)
        if not val:
            missing.append(var)
        else:
            keys[var] = val
    if missing:
        raise EnvironmentError(
            f"Missing required environment variables: {', '.join(missing)}\n"
            "Copy .env.example to .env and fill in your credentials."
        )
    return keys


# ---------------------------------------------------------------------------
# Core check cycle
# ---------------------------------------------------------------------------

class Monitor:
    def __init__(self, config: dict, env: dict[str, str], config_dir: Path):
        self._config = config
        self._env = env

        self._fetcher = FinnhubFetcher(api_key=env["FINNHUB_API_KEY"])
        self._price_checker = PriceChecker(
            threshold_pct=config["analysis"].get("price_swing_threshold_pct", 3.0)
        )
        self._alerter = EmailAlerter(
            email_cfg=config["email"],
            smtp_password=env["SMTP_PASSWORD"],
        )

        state_path = config_dir / config.get("state_file", ".state.json")
        self._state = SeenArticleState(state_file=state_path)

        self._max_articles = config["analysis"].get("max_articles_per_instrument", 5)

        # In-memory cooldown for price swing alerts: ticker → last alert timestamp
        # Prevents re-alerting on the same swing every cycle.
        interval_min = config.get("check_interval_minutes", 15)
        self._price_cooldown_secs = interval_min * 60 * 4  # 4 cycles cooldown
        self._last_price_alert: dict[str, float] = {}

        self._logger = logging.getLogger(self.__class__.__name__)

    def run_check(self) -> None:
        """Fetch news and quotes for one cycle across all instruments."""
        instruments = self._config.get("instruments", [])
        self._logger.info("Starting check cycle for %d instruments.", len(instruments))

        all_alerts: list[Alert] = []

        for instrument in instruments:
            ticker = instrument["ticker"]
            self._logger.info("Checking %s (%s)...", instrument["name"], ticker)

            # --- News alerts ---
            articles = self._fetcher.fetch_company_news(
                ticker=ticker,
                lookback_hours=self._lookback_hours(),
                max_articles=self._max_articles,
            )
            new_articles = self._state.filter_unseen(articles)
            self._logger.debug("  %d new article(s) for %s.", len(new_articles), ticker)

            for article in new_articles:
                all_alerts.append(Alert(
                    kind="news",
                    ticker=ticker,
                    name=instrument["name"],
                    headline=article["headline"],
                    url=article["url"],
                    source=article["source"],
                    article_datetime=article["datetime"],
                ))

            self._state.mark_seen_batch([a["id"] for a in new_articles])

            # --- Price swing alerts ---
            quote = self._fetcher.fetch_quote(ticker)
            swing = self._price_checker.check_swing(quote, instrument)
            if swing and self._price_cooldown_ok(ticker):
                all_alerts.append(swing)
                self._last_price_alert[ticker] = time.time()

        self._state.save()

        if all_alerts:
            self._logger.info("%d alert(s) this cycle. Sending email.", len(all_alerts))
            self._alerter.send_alert(all_alerts)
        else:
            self._logger.info("Nothing to report this cycle.")

    def _price_cooldown_ok(self, ticker: str) -> bool:
        last = self._last_price_alert.get(ticker, 0.0)
        return (time.time() - last) >= self._price_cooldown_secs

    def _lookback_hours(self) -> int:
        """Look back slightly longer than the check interval to avoid gaps."""
        interval_min = self._config.get("check_interval_minutes", 15)
        hours = max(1, (interval_min // 60) + 2)
        return min(hours, 24)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Financial News Monitor — watch instruments and alert on news or price swings."
    )
    parser.add_argument(
        "--config",
        default=str(Path(__file__).parent / "config.yaml"),
        help="Path to config.yaml (default: config.yaml in the same directory)",
    )
    parser.add_argument(
        "--run-once",
        action="store_true",
        help="Run a single check cycle and exit (useful for cron jobs or testing)",
    )
    args = parser.parse_args()

    config_path = Path(args.config).resolve()
    if not config_path.exists():
        print(f"ERROR: Config file not found: {config_path}", file=sys.stderr)
        sys.exit(1)

    config = load_config(str(config_path))
    setup_logging(config.get("log_level", "INFO"))
    logger = logging.getLogger("main")

    try:
        env = load_env()
    except EnvironmentError as exc:
        logger.error("%s", exc)
        sys.exit(1)

    monitor = Monitor(config=config, env=env, config_dir=config_path.parent)

    if args.run_once:
        logger.info("Running single check cycle (--run-once).")
        monitor.run_check()
        logger.info("Done.")
        return

    interval = config.get("check_interval_minutes", 15)
    logger.info(
        "Starting daemon. Will check every %d minute(s). "
        "Watching %d instrument(s). Press Ctrl-C to stop.",
        interval,
        len(config.get("instruments", [])),
    )

    monitor.run_check()

    schedule.every(interval).minutes.do(monitor.run_check)

    try:
        while True:
            schedule.run_pending()
            time.sleep(30)
    except KeyboardInterrupt:
        logger.info("Shutting down.")


if __name__ == "__main__":
    main()
