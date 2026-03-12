import feedparser
from config import SOFTWARE_JOBS_FEEDS


def fetch_software_jobs(max_per_feed=5):
    """Fetch software job listings from RSS feeds."""
    jobs = []
    for url in SOFTWARE_JOBS_FEEDS:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:max_per_feed]:
                title = entry.get("title", "")
                apply_url = entry.get("link", "#")

                # Extract tags/location from title where possible
                tags = []
                for keyword in ["Remote", "Python", "JavaScript", "TypeScript", "React",
                                "Node", "Go", "Rust", "Full Stack", "Frontend", "Backend",
                                "Senior", "Junior", "Staff", "Engineer", "Developer"]:
                    if keyword.lower() in title.lower():
                        tags.append(keyword)

                summary = entry.get("summary", "") or entry.get("description", "") or ""
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
                clean = s.get_data()[:200].strip()

                jobs.append({
                    "title": title,
                    "url": apply_url,
                    "summary": clean,
                    "tags": tags[:4],
                    "source": feed.feed.get("title", "Jobs"),
                })
        except Exception as e:
            print(f"[jobs] Error fetching {url}: {e}")

    return jobs[:15]
