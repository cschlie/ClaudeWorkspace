import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import BookCard from '../components/BookCard';
import ReviewCard from '../components/ReviewCard';
import StarRating from '../components/StarRating';
import { BookOpen, Star, Heart, Calendar, Library, Eye, Bookmark } from 'lucide-react';

function getInitials(displayName) {
  if (!displayName) return '?';
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export default function ProfilePage() {
  const { user, userReadingLog, allReviews, getBookById, getReviewsByUser } = useApp();
  const [activeTab, setActiveTab] = useState('Shelves');

  const tabs = ['Shelves', 'Reviews', 'Stats'];

  const initials = getInitials(user.displayName);

  const currentlyReading = useMemo(() => {
    return userReadingLog
      .filter((entry) => entry.status === 'currently-reading')
      .map((entry) => ({ ...entry, book: getBookById(entry.bookId) }))
      .filter((entry) => entry.book);
  }, [userReadingLog, getBookById]);

  const wantToRead = useMemo(() => {
    return userReadingLog
      .filter((entry) => entry.status === 'want-to-read')
      .map((entry) => ({ ...entry, book: getBookById(entry.bookId) }))
      .filter((entry) => entry.book);
  }, [userReadingLog, getBookById]);

  const readBooks = useMemo(() => {
    return userReadingLog
      .filter((entry) => entry.status === 'read')
      .map((entry) => ({ ...entry, book: getBookById(entry.bookId) }))
      .filter((entry) => entry.book);
  }, [userReadingLog, getBookById]);

  const userReviews = useMemo(() => {
    return getReviewsByUser(user.id);
  }, [getReviewsByUser, user.id]);

  // Stats computations
  const stats = useMemo(() => {
    const totalBooksRead = readBooks.length;

    const totalPagesRead = readBooks.reduce((sum, entry) => {
      return sum + (entry.book.pages || 0);
    }, 0);

    const ratedEntries = userReadingLog.filter((entry) => entry.rating != null);
    const averageRating =
      ratedEntries.length > 0
        ? ratedEntries.reduce((sum, entry) => sum + entry.rating, 0) / ratedEntries.length
        : 0;

    // Genre counts from read books
    const genreCounts = {};
    readBooks.forEach((entry) => {
      if (entry.book.genre) {
        entry.book.genre.forEach((g) => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      }
    });

    const favoriteGenre =
      Object.keys(genreCounts).length > 0
        ? Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0][0]
        : 'N/A';

    const maxGenreCount =
      Object.values(genreCounts).length > 0 ? Math.max(...Object.values(genreCounts)) : 0;

    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratedEntries.forEach((entry) => {
      const rounded = Math.round(entry.rating);
      if (rounded >= 1 && rounded <= 5) {
        ratingDistribution[rounded] += 1;
      }
    });
    const maxRatingCount = Math.max(...Object.values(ratingDistribution), 1);

    return {
      totalBooksRead,
      totalPagesRead,
      averageRating,
      favoriteGenre,
      genreCounts,
      maxGenreCount,
      ratingDistribution,
      maxRatingCount,
    };
  }, [readBooks, userReadingLog]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <section className="mb-10">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-primary-light flex items-center justify-center text-white text-3xl font-bold mb-4">
            {initials}
          </div>

          {/* Display Name */}
          <h1 className="font-serif text-3xl font-bold mb-1">{user.displayName}</h1>

          {/* Username */}
          <p className="text-text-muted mb-3">@{user.username}</p>

          {/* Bio */}
          {user.bio && <p className="text-sm max-w-md mb-5 leading-relaxed">{user.bio}</p>}

          {/* Stats Row */}
          <div className="flex items-center gap-6 mb-5">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold">{user.booksRead}</span>
              <span className="text-text-muted text-xs">Books Read</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold">{userReviews.length}</span>
              <span className="text-text-muted text-xs">Reviews</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold">{user.following?.length || 0}</span>
              <span className="text-text-muted text-xs">Following</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold">{user.followers?.length || 0}</span>
              <span className="text-text-muted text-xs">Followers</span>
            </div>
          </div>

          {/* Favorite Genres */}
          {user.favoriteGenres && user.favoriteGenres.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {user.favoriteGenres.map((genre) => (
                <span
                  key={genre}
                  className="bg-surface-lighter rounded-full px-3 py-1 text-xs text-text-muted"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Member Since */}
          {user.joinedDate && (
            <p className="text-text-muted text-xs flex items-center gap-1.5">
              <Calendar size={14} />
              Member since {formatDate(user.joinedDate)}
            </p>
          )}
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border mb-8">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-muted hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Shelves' && (
        <div className="space-y-10">
          {/* Currently Reading */}
          <ShelfSection
            title="Currently Reading"
            icon={<Eye size={20} />}
            entries={currentlyReading}
          />

          {/* Want to Read */}
          <ShelfSection
            title="Want to Read"
            icon={<Bookmark size={20} />}
            entries={wantToRead}
          />

          {/* Read */}
          <ShelfSection
            title="Read"
            icon={<BookOpen size={20} />}
            entries={readBooks}
          />
        </div>
      )}

      {activeTab === 'Reviews' && (
        <div>
          {userReviews.length > 0 ? (
            <div className="flex flex-col gap-4">
              {userReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Star size={32} className="mx-auto mb-3 text-text-muted" />
              <p className="text-text-muted">No reviews yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Stats' && (
        <div className="space-y-8">
          {/* Top-level stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Books Read"
              value={stats.totalBooksRead}
              icon={<BookOpen size={20} className="text-accent" />}
            />
            <StatCard
              label="Pages Read"
              value={stats.totalPagesRead.toLocaleString()}
              icon={<Library size={20} className="text-accent" />}
            />
            <StatCard
              label="Avg Rating"
              value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '--'}
              icon={<Star size={20} className="text-accent" />}
            />
            <StatCard
              label="Favorite Genre"
              value={stats.favoriteGenre}
              icon={<Heart size={20} className="text-accent" />}
              small
            />
          </div>

          {/* Books by Genre */}
          {Object.keys(stats.genreCounts).length > 0 && (
            <div className="bg-surface-light rounded-xl p-5 border border-border">
              <h3 className="font-semibold mb-4">Books Read by Genre</h3>
              <div className="space-y-3">
                {Object.entries(stats.genreCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([genre, count]) => (
                    <div key={genre} className="flex items-center gap-3">
                      <span className="text-sm text-text-muted w-28 shrink-0 text-right">
                        {genre}
                      </span>
                      <div className="flex-1 bg-surface-lighter rounded-full h-5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-primary-light rounded-full transition-all duration-500"
                          style={{
                            width: `${(count / stats.maxGenreCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-6 text-right">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Rating Distribution */}
          <div className="bg-surface-light rounded-xl p-5 border border-border">
            <h3 className="font-semibold mb-4">Rating Distribution</h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-20 shrink-0 justify-end">
                    <span className="text-sm font-medium">{star}</span>
                    <Star size={14} className="text-star fill-star" />
                  </div>
                  <div className="flex-1 bg-surface-lighter rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-star rounded-full transition-all duration-500"
                      style={{
                        width:
                          stats.ratingDistribution[star] > 0
                            ? `${(stats.ratingDistribution[star] / stats.maxRatingCount) * 100}%`
                            : '0%',
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-6 text-right">
                    {stats.ratingDistribution[star]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

function ShelfSection({ title, icon, entries }) {
  return (
    <div>
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        {icon}
        {title}
        <span className="text-text-muted text-sm font-normal">({entries.length})</span>
      </h2>
      {entries.length > 0 ? (
        <div
          className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {entries.map((entry) => (
            <div key={entry.bookId} style={{ scrollSnapAlign: 'start' }}>
              <BookCard book={entry.book} size="md" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-light rounded-xl p-8 border border-border text-center">
          <p className="text-text-muted text-sm">Nothing here yet</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, small }) {
  return (
    <div className="bg-surface-light rounded-xl p-5 border border-border flex flex-col items-center text-center">
      <div className="mb-2">{icon}</div>
      <span className={`font-bold ${small ? 'text-lg' : 'text-2xl'}`}>{value}</span>
      <span className="text-text-muted text-xs mt-1">{label}</span>
    </div>
  );
}
