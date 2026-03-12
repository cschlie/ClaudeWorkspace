import feedparser
from config import FASHION_SALE_FEEDS


# Keywords that indicate a sale/deal post (for Reddit-style feeds)
SALE_KEYWORDS = [
    "sale", "deal", "discount", "%off", "% off", "clearance", "promo",
    "code", "coupon", "markdown", "reduced", "outlet", "final sale",
    "free shipping", "limited time", "flash sale",
]

# Trusted menswear brands to highlight
MENSWEAR_BRANDS = [
    "uniqlo", "cos", "arket", "reiss", "tod's", "ralph lauren", "polo",
    "j.crew", "banana republic", "gap", "massimo dutti", "zara", "h&m",
    "nordstrom", "ssense", "mr porter", "end.", "end clothing",
    "paul smith", "hugo boss", "tommy hilfiger", "levi's", "dockers",
    "patagonia", "arc'teryx", "barbour", "charles tyrwhitt", "hawes & curtis",
    "grenson", "clarks", "adidas", "nike", "new balance", "salomon",
]


def _is_relevant(title: str, summary: str) -> bool:
    text = (title + " " + summary).lower()
    has_sale = any(kw in text for kw in SALE_KEYWORDS)
    has_brand = any(brand in text for brand in MENSWEAR_BRANDS)
    return has_sale or has_brand


def fetch_fashion_deals(max_per_feed=8):
    """Fetch menswear sale & deal posts from RSS feeds."""
    deals = []
    for url in FASHION_SALE_FEEDS:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:max_per_feed]:
                title = entry.get("title", "")
                link = entry.get("link", "#")
                summary = entry.get("summary", "") or entry.get("description", "") or ""

                if not _is_relevant(title, summary):
                    continue

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

                deals.append({
                    "title": title,
                    "url": link,
                    "summary": clean,
                    "source": feed.feed.get("title", "Fashion"),
                })
        except Exception as e:
            print(f"[fashion] Error fetching {url}: {e}")

    return deals[:10]
