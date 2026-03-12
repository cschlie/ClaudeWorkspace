import os
from dotenv import load_dotenv

load_dotenv()

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "")
TO_EMAIL = os.getenv("TO_EMAIL", "")

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
WEATHER_CITY = os.getenv("WEATHER_CITY", "London")
WEATHER_UNITS = os.getenv("WEATHER_UNITS", "metric")

FINANCE_TICKERS = [t.strip() for t in os.getenv("FINANCE_TICKERS", "AAPL,BTC-USD,SPY").split(",")]

CUSTOM_RSS_FEEDS = [u.strip() for u in os.getenv("CUSTOM_RSS_FEEDS", "").split(",") if u.strip()]

SEND_TIMES = [t.strip() for t in os.getenv("SEND_TIMES", "07:00,17:00").split(",")]
TIMEZONE = os.getenv("TIMEZONE", "UTC")

GOOGLE_CALENDAR_ICS_URL = os.getenv("GOOGLE_CALENDAR_ICS_URL", "")

NEWSLETTER_NAME = os.getenv("NEWSLETTER_NAME", "My Daily Brief")

# Built-in RSS feeds per category (user can extend via CUSTOM_RSS_FEEDS)
CULTURE_ARTS_FEEDS = [
    "https://longreads.com/feed/",
    "https://www.theparisreview.org/feed",
    "https://www.artsy.net/rss/news",
    "https://www.dezeen.com/feed/",
    "https://pitchfork.com/rss/news/feed.xml",
]

FASHION_SALE_FEEDS = [
    "https://www.reddit.com/r/malefashionadvice/.rss",
    "https://www.reddit.com/r/frugalmalefashion/.rss",
    "https://www.reddit.com/r/streetwear/.rss",
]

SOFTWARE_JOBS_FEEDS = [
    "https://remoteok.com/remote-dev-jobs.rss",
    "https://weworkremotely.com/categories/remote-programming-jobs.rss",
    "https://www.ycombinator.com/jobs.rss",
]
