import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating';

const sizeClasses = {
  sm: 'w-28',
  md: 'w-36',
  lg: 'w-44',
};

export default function BookCard({ book, size = 'md', showInfo = true, onClick }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(book);
    } else {
      navigate(`/book/${book.id}`);
    }
  };

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0 cursor-pointer group`} onClick={handleClick}>
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]">
        {!imgError ? (
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-3">
            <span className="text-white text-center text-sm font-medium leading-tight">
              {book.title}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2">
          {book.avgRating != null && (
            <StarRating rating={book.avgRating} />
          )}
          {book.year && (
            <span className="text-white/70 text-xs">{book.year}</span>
          )}
        </div>
      </div>

      {showInfo && (
        <div className="mt-2">
          <p className="font-medium text-sm truncate">{book.title}</p>
          <p className="text-text-muted text-sm truncate">{book.author}</p>
        </div>
      )}
    </div>
  );
}
