"""
state.py — Persists a set of article IDs that have already been processed,
so the monitor never sends duplicate alerts across runs.

State is stored as a simple JSON file on disk.
"""

import json
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

# Maximum number of IDs to keep to prevent unbounded growth.
# At ~5 articles / instrument / 15-min cycle, 10 000 covers well over a month.
MAX_IDS = 10_000


class SeenArticleState:
    def __init__(self, state_file: str | Path):
        self._path = Path(state_file)
        self._seen: set[str] = set()
        self._load()

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def is_seen(self, article_id: str) -> bool:
        return article_id in self._seen

    def mark_seen(self, article_id: str) -> None:
        self._seen.add(article_id)

    def mark_seen_batch(self, article_ids: list[str]) -> None:
        self._seen.update(article_ids)

    def filter_unseen(self, articles: list[dict]) -> list[dict]:
        """Return only articles whose 'id' has not been seen before."""
        return [a for a in articles if not self.is_seen(a["id"])]

    def save(self) -> None:
        """Persist state to disk, pruning oldest entries if necessary."""
        ids_to_save = list(self._seen)

        if len(ids_to_save) > MAX_IDS:
            # Keep the most recent MAX_IDS by just slicing — insertion order
            # isn't guaranteed to be chronological, but this prevents unbounded growth.
            ids_to_save = ids_to_save[-MAX_IDS:]
            self._seen = set(ids_to_save)

        try:
            # Write atomically: write to a temp file, then rename
            tmp_path = self._path.with_suffix(".tmp")
            with open(tmp_path, "w", encoding="utf-8") as fh:
                json.dump({"seen_ids": ids_to_save}, fh)
            os.replace(tmp_path, self._path)
            logger.debug("State saved: %d seen IDs → %s", len(ids_to_save), self._path)
        except OSError as exc:
            logger.error("Failed to save state file %s: %s", self._path, exc)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _load(self) -> None:
        if not self._path.exists():
            logger.debug("No state file at %s — starting fresh.", self._path)
            return
        try:
            with open(self._path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            self._seen = set(data.get("seen_ids", []))
            logger.debug("Loaded %d seen IDs from %s", len(self._seen), self._path)
        except (json.JSONDecodeError, OSError) as exc:
            logger.warning("Could not load state file %s: %s — starting fresh.", self._path, exc)
            self._seen = set()
