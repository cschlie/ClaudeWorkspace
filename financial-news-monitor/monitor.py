#!/usr/bin/env python3
"""
monitor.py — Financial News Monitor daemon.

Usage:
    python monitor.py                    # Run daemon (polls on interval)
    python monitor.py --run-once         # Run a single check and exit
    python monitor.py --config path.yaml # Use a custom config file

Environment variables (set in .env or your shell):
    FINNHUB_API_KEY     — required
    ANTHROPIC_API_KEY   — required
    SMTP_PASSWORD       — required for email alerts

See config.yaml and .env.example for configuration details.
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
from analyzer import NewsAnalyzer
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
    for var in ("FINNHUB_API_KEY", "ANTHROPIC_API_KEY", "SMTP_PASSWORD"):
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
        self._analyzer = NewsAnalyzer(
            api_key=env["ANTHROPIC_API_KEY"],
            min_confidence=config["analysis"]["min_confidence"],
        )
        self._alerter = EmailAlerter(
            email_cfg=config["email"],
            smtp_password=env["SMTP_PASSWORD"],
        )

        state_path = config_dir / config.get("state_file", ".state.json")
        self._state = SeenArticleState(state_file=state_path)

        self._alert_on = config["analysis"].get("alert_on", "both")
        self._max_articles = config["analysis"].get("max_articles_per_instrument", 5)

        self._logger = logging.getLogger(self.__class__.__name__)

    def run_check(self) -> None:
        """Fetch, analyse, and alert for one cycle across all instruments."""
        instruments = self._config.get("instruments", [])
        self._logger.info("Starting check cycle for %d instruments.", len(instruments))

        all_significant: list = []

        for instrument in instruments:
            ticker = instrument["ticker"]
            self._logger.info("Checking %s (%s)...", instrument["name"], ticker)

            # Fetch news
            articles = self._fetcher.fetch_company_news(
                ticker=ticker,
                lookback_hours=self._lookback_hours(),
                max_articles=self._max_articles,
            )
            self._logger.debug("  %d articles fetched for %s.", len(articles), ticker)

            # Filter already-seen articles
            new_articles = self._state.filter_unseen(articles)
            self._logger.debug("  %d new (unseen) articles.", len(new_articles))

            if not new_articles:
                continue

            # Analyse with Claude
            significant = self._analyzer.analyze_articles(new_articles, instrument)

            # Apply sentiment filter
            if self._alert_on != "both":
                significant = [r for r in significant if r.sentiment == self._alert_on]

            all_significant.extend(significant)

            # Mark all fetched articles as seen (even non-significant ones)
            self._state.mark_seen_batch([a["id"] for a in new_articles])

        # Persist state regardless of whether we have alerts
        self._state.save()

        # Send a single bundled email if anything significant was found
        if all_significant:
            self._logger.info(
                "Found %d significant article(s). Sending alert email.", len(all_significant)
            )
            self._alerter.send_alert(all_significant)
        else:
            self._logger.info("No significant news found this cycle.")

    def _lookback_hours(self) -> int:
        """
        Look back slightly longer than the check interval to avoid gaps,
        but cap at 24 hours to keep API responses manageable.
        """
        interval_min = self._config.get("check_interval_minutes", 15)
        hours = max(1, (interval_min // 60) + 2)
        return min(hours, 24)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Financial News Monitor — watch instruments and alert on big news."
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

    # Daemon mode — run immediately, then on the configured schedule
    interval = config.get("check_interval_minutes", 15)
    logger.info(
        "Starting daemon. Will check every %d minute(s). "
        "Watching %d instrument(s). Press Ctrl-C to stop.",
        interval,
        len(config.get("instruments", [])),
    )

    # Run once immediately on startup
    monitor.run_check()

    # Then schedule recurring runs
    schedule.every(interval).minutes.do(monitor.run_check)

    try:
        while True:
            schedule.run_pending()
            time.sleep(30)  # Poll the scheduler every 30 s
    except KeyboardInterrupt:
        logger.info("Shutting down.")


if __name__ == "__main__":
    main()
