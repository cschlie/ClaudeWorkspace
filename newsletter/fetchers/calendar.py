import re
import requests
from datetime import datetime, timedelta, date
from config import GOOGLE_CALENDAR_ICS_URL


def _parse_ics_events(ics_text: str, days_ahead: int = 7):
    """Minimal ICS parser — extracts VEVENT blocks for the next N days."""
    events = []
    today = date.today()
    cutoff = today + timedelta(days=days_ahead)

    # Split into VEVENT blocks
    blocks = re.findall(r"BEGIN:VEVENT(.*?)END:VEVENT", ics_text, re.DOTALL)
    for block in blocks:
        def get_field(name):
            m = re.search(rf"^{name}[^:]*:(.*)", block, re.MULTILINE)
            return m.group(1).strip() if m else ""

        dtstart_raw = get_field("DTSTART")
        summary = get_field("SUMMARY")

        if not dtstart_raw or not summary:
            continue

        # Handle date-only (YYYYMMDD) and datetime (YYYYMMDDTHHmmssZ)
        try:
            if "T" in dtstart_raw:
                dt = datetime.strptime(dtstart_raw[:15], "%Y%m%dT%H%M%S")
                event_date = dt.date()
                time_str = dt.strftime("%H:%M")
            else:
                event_date = datetime.strptime(dtstart_raw[:8], "%Y%m%d").date()
                time_str = "All day"
        except ValueError:
            continue

        if today <= event_date <= cutoff:
            events.append({
                "date": event_date.strftime("%A, %b %-d"),
                "time": time_str,
                "summary": summary,
                "days_away": (event_date - today).days,
            })

    events.sort(key=lambda e: e["days_away"])
    return events


def fetch_calendar():
    """Return upcoming calendar events for the next 7 days."""
    if not GOOGLE_CALENDAR_ICS_URL:
        return []
    try:
        resp = requests.get(GOOGLE_CALENDAR_ICS_URL, timeout=10)
        resp.raise_for_status()
        return _parse_ics_events(resp.text)
    except Exception as e:
        print(f"[calendar] Error: {e}")
        return []
