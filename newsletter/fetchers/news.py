import feedparser
from config import CULTURE_ARTS_FEEDS, CUSTOM_RSS_FEEDS


def _parse_feed(url, max_items=4):
    """Parse an RSS/Atom feed, returning a list of article dicts."""
    try:
        feed = feedparser.parse(url)
        articles = []
        for entry in feed.entries[:max_items]:
            summary = entry.get("summary", "") or entry.get("description", "") or ""
            # Strip basic HTML tags from summary
            from html.parser import HTMLParser

            class _Stripper(HTMLParser):
                def __init__(self):
                    super().__init__()
                    self.fed = []
                def handle_data(self, d):
                    self.fed.append(d)
                def get_data(self):
                    return "".join(self.fed)

            s = _Stripper()
            s.feed(summary)
            clean_summary = s.get_data()[:280].strip()
            if clean_summary and not clean_summary.endswith("…"):
                clean_summary += "…" if len(clean_summary) == 280 else ""

            articles.append({
                "title": entry.get("title", "Untitled"),
                "url": entry.get("link", "#"),
                "summary": clean_summary,
                "published": entry.get("published", ""),
                "source": feed.feed.get("title", url),
            })
        return articles
    except Exception as e:
        print(f"[news] Error parsing {url}: {e}")
        return []


def fetch_culture_arts(max_per_feed=2):
    """Fetch long-read culture & arts articles."""
    articles = []
    for url in CULTURE_ARTS_FEEDS:
        articles.extend(_parse_feed(url, max_per_feed))
    return articles[:10]


def fetch_custom_feeds(max_per_feed=3):
    """Fetch articles from user-configured RSS feeds."""
    articles = []
    for url in CUSTOM_RSS_FEEDS:
        articles.extend(_parse_feed(url, max_per_feed))
    return articles
