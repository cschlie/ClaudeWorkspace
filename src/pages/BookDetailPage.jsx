import { useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StarRating from '../components/StarRating';
import ReviewCard from '../components/ReviewCard';
import { BookOpen, Calendar, Hash, Plus, Check, Eye, MessageSquare } from 'lucide-react';
import { useState } from 'react';

export default function BookDetailPage() {
  const { id } = useParams();
  const bookId = Number(id);

  const {
    getBookById,
    getReviewsForBook,
    getUserReadingStatus,
    getUserRating,
    addToShelf,
    removeFromShelf,
    addReview,
    updateRating,
  } = useApp();

  const book = getBookById(bookId);
  const reviews = getReviewsForBook(bookId);
  const readingStatus = getUserReadingStatus(bookId);
  const userRating = getUserRating(bookId);

  const [coverError, setCoverError] = useState(false);
  const [reviewExpanded, setReviewExpanded] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [spoiler, setSpoiler] = useState(false);

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-text-muted">
        <BookOpen className="w-16 h-16 mb-4 opacity-40" />
        <h2 className="text-2xl font-bold mb-2">Book not found</h2>
        <p>The book you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  const shelfButtons = [
    { key: 'want-to-read', label: 'Want to Read', icon: Eye },
    { key: 'currently-reading', label: 'Currently Reading', icon: BookOpen },
    { key: 'read', label: 'Read', icon: Check },
  ];

  const handleShelfClick = (shelf) => {
    if (readingStatus === shelf) {
      removeFromShelf(bookId);
    } else {
      addToShelf(bookId, shelf);
    }
  };

  const handleSubmitReview = () => {
    if (!reviewText.trim()) return;
    addReview(bookId, userRating || 0, reviewText.trim(), spoiler);
    setReviewText('');
    setSpoiler(false);
    setReviewExpanded(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Book Header */}
      <div className="flex flex-col sm:flex-row gap-8">
        {/* Cover */}
        <div className="flex-shrink-0">
          {!coverError && book.cover ? (
            <img
              src={book.cover}
              alt={book.title}
              className="w-56 aspect-[2/3] rounded-lg shadow-2xl object-cover"
              onError={() => setCoverError(true)}
            />
          ) : (
            <div className="w-56 aspect-[2/3] rounded-lg shadow-2xl bg-gradient-to-br from-accent/60 to-primary/60 flex items-center justify-center p-4">
              <span className="text-white font-serif text-xl text-center font-bold leading-tight">
                {book.title}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <h1 className="font-serif text-3xl font-bold">{book.title}</h1>
          <p className="text-xl text-text-muted">{book.author}</p>

          <div className="flex items-center gap-6 text-text-muted text-sm">
            {book.year && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {book.year}
              </span>
            )}
            {book.pages && (
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {book.pages} pages
              </span>
            )}
          </div>

          {book.genre && book.genre.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {book.genre.map((genre) => (
                <span
                  key={genre}
                  className="bg-surface-lighter rounded-full px-3 py-1 text-sm"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {book.avgRating !== undefined && (
            <div className="flex items-center gap-3">
              <StarRating rating={book.avgRating} size="lg" />
              <span className="text-lg font-semibold">
                {book.avgRating.toFixed(1)}
              </span>
              {book.totalRatings !== undefined && (
                <span className="text-text-muted text-sm">
                  ({book.totalRatings} {book.totalRatings === 1 ? 'rating' : 'ratings'})
                </span>
              )}
            </div>
          )}

          {book.synopsis && (
            <p className="text-text-muted leading-relaxed">{book.synopsis}</p>
          )}
        </div>
      </div>

      {/* User Actions Bar */}
      <div className="bg-surface-light rounded-xl p-4 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-muted whitespace-nowrap">Your Rating</span>
          <StarRating
            rating={userRating || 0}
            size="lg"
            onRate={(rating) => updateRating(bookId, rating)}
          />
        </div>

        <div className="flex items-center gap-2">
          {shelfButtons.map(({ key, label, icon: Icon }) => {
            const isActive = readingStatus === key;
            return (
              <button
                key={key}
                onClick={() => handleShelfClick(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent text-black'
                    : 'bg-surface-lighter hover:bg-surface-lighter/80 text-text-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Write a Review */}
      <div className="space-y-3">
        {!reviewExpanded ? (
          <button
            onClick={() => setReviewExpanded(true)}
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Write a review...
          </button>
        ) : (
          <div className="space-y-3">
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you think of this book?"
              className="w-full bg-surface-lighter rounded-lg p-4 min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={spoiler}
                  onChange={(e) => setSpoiler(e.target.checked)}
                  className="rounded"
                />
                Contains spoilers
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setReviewExpanded(false);
                    setReviewText('');
                    setSpoiler(false);
                  }}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="bg-accent text-black px-5 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reviews Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          Reviews
          <span className="text-text-muted text-base font-normal">
            ({reviews.length})
          </span>
        </h2>

        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <p className="text-text-muted py-8 text-center">
            No reviews yet. Be the first!
          </p>
        )}
      </div>
    </div>
  );
}
