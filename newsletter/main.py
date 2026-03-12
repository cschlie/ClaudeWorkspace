"""
main.py — Scheduled Email Newsletter
=====================================
Fetches content from multiple sources and sends a rich HTML email
twice a day via SendGrid.

Usage:
  python main.py           # Start the scheduler (runs continuously)
  python main.py --now     # Send one newsletter immediately and exit
"""

import argparse
import sys
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

import pytz
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

from config import SEND_TIMES, TIMEZONE, NEWSLETTER_NAME
from fetchers import (
    fetch_weather,
    fetch_finance,
    fetch_culture_arts,
    fetch_custom_feeds,
    fetch_software_jobs,
    fetch_fashion_deals,
    fetch_calendar,
)
from email_sender import send_newsletter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)


def gather_all_content():
    """Fetch all content sources concurrently."""
    log.info("Gathering content from all sources…")

    tasks = {
        "weather": fetch_weather,
        "finance": fetch_finance,
        "culture": fetch_culture_arts,
        "custom_feeds": fetch_custom_feeds,
        "jobs": fetch_software_jobs,
        "fashion": fetch_fashion_deals,
        "calendar": fetch_calendar,
    }

    results = {}
    with ThreadPoolExecutor(max_workers=7) as executor:
        future_to_key = {executor.submit(fn): key for key, fn in tasks.items()}
        for future in as_completed(future_to_key):
            key = future_to_key[future]
            try:
                results[key] = future.result()
                count = len(results[key]) if isinstance(results[key], list) else ("ok" if results[key] else "none")
                log.info(f"  [{key}] fetched → {count}")
            except Exception as e:
                log.warning(f"  [{key}] failed: {e}")
                results[key] = [] if key != "weather" else None

    return results


def run_newsletter():
    """Main job: gather content and send email."""
    tz = pytz.timezone(TIMEZONE)
    now = datetime.now(tz)
    log.info(f"=== Newsletter job starting at {now.strftime('%H:%M %Z')} ===")

    data = gather_all_content()

    try:
        status = send_newsletter(
            weather=data.get("weather"),
            finance=data.get("finance", []),
            jobs=data.get("jobs", []),
            fashion=data.get("fashion", []),
            culture=data.get("culture", []),
            custom_feeds=data.get("custom_feeds", []),
            calendar=data.get("calendar", []),
        )
        log.info(f"=== Newsletter sent successfully (HTTP {status}) ===")
    except Exception as e:
        log.error(f"Failed to send newsletter: {e}")
        raise


def start_scheduler():
    """Start APScheduler with twice-daily jobs based on SEND_TIMES."""
    scheduler = BlockingScheduler(timezone=TIMEZONE)

    for time_str in SEND_TIMES:
        try:
            hour, minute = map(int, time_str.split(":"))
        except ValueError:
            log.warning(f"Invalid time format '{time_str}', expected HH:MM. Skipping.")
            continue

        scheduler.add_job(
            run_newsletter,
            trigger=CronTrigger(hour=hour, minute=minute, timezone=TIMEZONE),
            id=f"newsletter_{hour:02d}{minute:02d}",
            name=f"Newsletter @ {time_str}",
            misfire_grace_time=300,  # 5-minute grace window
        )
        log.info(f"Scheduled newsletter at {time_str} ({TIMEZONE})")

    log.info(f"Scheduler started for '{NEWSLETTER_NAME}'. Press Ctrl+C to stop.")

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        log.info("Scheduler stopped.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scheduled Email Newsletter")
    parser.add_argument(
        "--now",
        action="store_true",
        help="Send one newsletter immediately and exit (no scheduler)",
    )
    args = parser.parse_args()

    if args.now:
        run_newsletter()
        sys.exit(0)
    else:
        start_scheduler()
