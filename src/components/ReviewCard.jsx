import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useApp } from "../context/AppContext";
import StarRating from "./StarRating";

function getInitials(displayName) {
  if (!displayName) return "?";
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const AVATAR_COLORS = [
  "#e74c3c",
  "#8e44ad",
  "#2980b9",
  "#16a085",
  "#27ae60",
  "#f39c12",
  "#d35400",
  "#c0392b",
  "#7f8c8d",
  "#2c3e50",
];

function getAvatarColor(userId) {
  let hash = 0;
  const str = String(userId);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ReviewCard({ review }) {
  const { getUserById, getBookById, toggleLikeReview, user: currentUser } = useApp();
  const navigate = useNavigate();
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);

  const reviewer = getUserById(review.userId);
  const book = getBookById(review.bookId);

  const displayName = reviewer?.displayName || "Unknown User";
  const initials = getInitials(displayName);
  const avatarColor = getAvatarColor(review.userId);
  const bookTitle = book?.title || "Unknown Book";

  const hasLiked =
    currentUser && review.likedBy ? review.likedBy.includes(currentUser.id) : false;

  const handleLike = () => {
    toggleLikeReview(review.id);
  };

  const handleBookClick = () => {
    navigate(`/book/${review.bookId}`);
  };

  return (
    <div className="bg-surface-light rounded-xl p-5 border border-border">
      {/* Header: Avatar, Name, Date */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-sm truncate">{displayName}</span>
          <span className="text-text-muted text-xs">{formatDate(review.date)}</span>
        </div>
      </div>

      {/* Book Title and Rating */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <button
          onClick={handleBookClick}
          className="text-white font-semibold hover:underline text-left"
        >
          {bookTitle}
        </button>
        <StarRating rating={review.rating} />
      </div>

      {/* Review Text */}
      <div className="mb-4">
        {review.containsSpoilers && !spoilerRevealed ? (
          <div className="relative">
            <p className="text-sm leading-relaxed blur-sm select-none" aria-hidden="true">
              {review.text}
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => setSpoilerRevealed(true)}
                className="bg-surface-light border border-border text-text-muted text-sm font-medium px-4 py-2 rounded-lg hover:text-white transition-colors"
              >
                This review contains spoilers. Click to reveal.
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{review.text}</p>
        )}
      </div>

      {/* Like Button */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 text-text-muted hover:text-red-500 transition-colors"
          aria-label={hasLiked ? "Unlike review" : "Like review"}
        >
          <Heart
            size={18}
            className={hasLiked ? "fill-red-500 text-red-500" : ""}
          />
        </button>
        {review.likes > 0 && (
          <span className="text-text-muted text-xs">{review.likes}</span>
        )}
      </div>
    </div>
  );
}
