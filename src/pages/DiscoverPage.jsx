import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BookCard from '../components/BookCard';
import { genres } from '../data/books';

const sortOptions = [
  { key: 'popular', label: 'Popular' },
  { key: 'top-rated', label: 'Top Rated' },
  { key: 'newest', label: 'Newest' },
  { key: 'title', label: 'Title A-Z' },
];

export default function DiscoverPage() {
  const { allBooks, searchQuery } = useApp();
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('popular');

  const filteredAndSorted = allBooks
    .filter((book) => {
      if (selectedGenre !== 'All' && !book.genre?.includes(selectedGenre)) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          book.title.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.totalRatings ?? 0) - (a.totalRatings ?? 0);
        case 'top-rated':
          return (b.avgRating ?? 0) - (a.avgRating ?? 0);
        case 'newest':
          return (b.year ?? 0) - (a.year ?? 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <h1 className="font-serif text-3xl">Discover</h1>

      {/* Genre Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`rounded-full px-4 py-2 text-sm cursor-pointer transition whitespace-nowrap ${
              selectedGenre === genre
                ? 'bg-accent text-black font-medium'
                : 'bg-surface-lighter text-text-muted hover:text-text'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-4">
        <SlidersHorizontal className="w-4 h-4 text-text-muted" />
        <div className="flex gap-4">
          {sortOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setSortBy(option.key)}
              className={`text-sm pb-1 transition cursor-pointer ${
                sortBy === option.key
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result Count */}
      <p className="text-sm text-text-muted">
        {filteredAndSorted.length} books
      </p>

      {/* Book Grid or Empty State */}
      {filteredAndSorted.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredAndSorted.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-text-muted text-lg mb-2">
            No books found matching your filters.
          </p>
          <p className="text-text-muted text-sm">
            Try adjusting your genre or search query.
          </p>
        </div>
      )}
    </div>
  );
}
