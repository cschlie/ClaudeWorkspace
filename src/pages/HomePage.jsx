import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import BookCard from '../components/BookCard';
import ReviewCard from '../components/ReviewCard';
import StarRating from '../components/StarRating';
import { BookOpen, TrendingUp, Clock } from 'lucide-react';

export default function HomePage() {
  const { allBooks, allReviews, user, userReadingLog, getUserById, getBookById } = useApp();

  const currentlyReading = useMemo(() => {
    const entry = userReadingLog.find((e) => e.status === 'currently-reading');
    if (!entry) return null;
    const book = getBookById(entry.bookId);
    return book ? { ...entry, book } : null;
  }, [userReadingLog, getBookById]);

  const trendingBooks = useMemo(() => {
    return [...allBooks]
      .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
      .slice(0, 8);
  }, [allBooks]);

  const recentReviews = useMemo(() => {
    return [...allReviews]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [allReviews]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero / Welcome Section */}
      <section className="mb-10">
        <h1 className="font-serif text-3xl mb-6">
          Welcome back, {user.displayName}
        </h1>

        {currentlyReading ? (
          <div className="bg-surface-light rounded-xl p-5 border border-border flex items-center gap-5">
            <div className="flex-shrink-0">
              <BookCard book={currentlyReading.book} size="sm" showInfo={false} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-text-muted mb-1 flex items-center gap-1.5">
                <BookOpen size={14} />
                Currently reading
              </p>
              <p className="font-semibold text-lg truncate">{currentlyReading.book.title}</p>
              <p className="text-text-muted text-sm truncate">{currentlyReading.book.author}</p>
            </div>
          </div>
        ) : (
          <div className="bg-surface-light rounded-xl p-8 border border-border text-center">
            <BookOpen size={32} className="mx-auto mb-3 text-text-muted" />
            <p className="text-text-muted">
              You're not reading anything right now. Pick up a book and start reading!
            </p>
          </div>
        )}
      </section>

      {/* Trending This Week */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
          <TrendingUp size={22} />
          Trending This Week
        </h2>

        <div className="flex gap-4 overflow-x-auto pb-4 scroll-snap-x hide-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
          {trendingBooks.map((book) => (
            <div key={book.id} style={{ scrollSnapAlign: 'start' }}>
              <BookCard book={book} size="md" />
            </div>
          ))}
        </div>
      </section>

      {/* Recent from Friends */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
          <Clock size={22} />
          Recent from Friends
        </h2>

        <div className="flex flex-col gap-4">
          {recentReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>

      {/* Hide scrollbar utility */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
