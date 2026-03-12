from .weather import fetch_weather
from .finance import fetch_finance
from .news import fetch_culture_arts, fetch_custom_feeds
from .jobs import fetch_software_jobs
from .fashion import fetch_fashion_deals
from .calendar import fetch_calendar

__all__ = [
    "fetch_weather",
    "fetch_finance",
    "fetch_culture_arts",
    "fetch_custom_feeds",
    "fetch_software_jobs",
    "fetch_fashion_deals",
    "fetch_calendar",
]
