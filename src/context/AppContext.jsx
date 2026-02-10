import React, { createContext, useState, useCallback, useContext } from "react";
import { books } from "../data/books.js";
import { users, currentUser } from "../data/users.js";
import { reviews, readingLog } from "../data/reviews.js";
import { bookClubs } from "../data/clubs.js";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [allBooks] = useState(books);
  const [allUsers, setAllUsers] = useState(users);
  const [allReviews, setAllReviews] = useState(reviews);
  const [allClubs, setAllClubs] = useState(bookClubs);
  const [user] = useState(currentUser);
  const [userReadingLog, setUserReadingLog] = useState(
    readingLog.filter((entry) => entry.userId === currentUser.id)
  );
  const [searchQuery, setSearchQuery] = useState("");

  const addReview = useCallback(
    (bookId, rating, text, containsSpoilers) => {
      setAllReviews((prev) => {
        const maxId = prev.reduce((max, r) => Math.max(max, r.id), 0);
        const newReview = {
          id: maxId + 1,
          userId: user.id,
          bookId,
          rating,
          text,
          date: new Date().toISOString().split("T")[0],
          likes: 0,
          likedBy: [],
          containsSpoilers: containsSpoilers || false,
        };
        return [...prev, newReview];
      });
    },
    [user.id]
  );

  const updateRating = useCallback(
    (bookId, rating) => {
      setUserReadingLog((prev) =>
        prev.map((entry) =>
          entry.bookId === bookId ? { ...entry, rating } : entry
        )
      );
    },
    []
  );

  const addToShelf = useCallback(
    (bookId, status) => {
      setUserReadingLog((prev) => {
        const existing = prev.find((entry) => entry.bookId === bookId);
        if (existing) {
          return prev.map((entry) =>
            entry.bookId === bookId ? { ...entry, status } : entry
          );
        }
        const newEntry = {
          userId: user.id,
          bookId,
          status,
        };
        if (status === "currently-reading") {
          newEntry.dateStarted = new Date().toISOString().split("T")[0];
        } else if (status === "read") {
          newEntry.dateRead = new Date().toISOString().split("T")[0];
        }
        return [...prev, newEntry];
      });
    },
    [user.id]
  );

  const removeFromShelf = useCallback((bookId) => {
    setUserReadingLog((prev) =>
      prev.filter((entry) => entry.bookId !== bookId)
    );
  }, []);

  const toggleLikeReview = useCallback(
    (reviewId) => {
      setAllReviews((prev) =>
        prev.map((review) => {
          if (review.id !== reviewId) return review;
          const alreadyLiked = review.likedBy.includes(user.id);
          if (alreadyLiked) {
            return {
              ...review,
              likes: review.likes - 1,
              likedBy: review.likedBy.filter((id) => id !== user.id),
            };
          }
          return {
            ...review,
            likes: review.likes + 1,
            likedBy: [...review.likedBy, user.id],
          };
        })
      );
    },
    [user.id]
  );

  const joinClub = useCallback(
    (clubId) => {
      setAllClubs((prev) =>
        prev.map((club) => {
          if (club.id !== clubId) return club;
          if (club.members.includes(user.id)) return club;
          return { ...club, members: [...club.members, user.id] };
        })
      );
    },
    [user.id]
  );

  const leaveClub = useCallback(
    (clubId) => {
      setAllClubs((prev) =>
        prev.map((club) => {
          if (club.id !== clubId) return club;
          return {
            ...club,
            members: club.members.filter((id) => id !== user.id),
          };
        })
      );
    },
    [user.id]
  );

  const addDiscussion = useCallback(
    (clubId, text) => {
      setAllClubs((prev) =>
        prev.map((club) => {
          if (club.id !== clubId) return club;
          const maxId = club.discussions.reduce(
            (max, d) => Math.max(max, d.id),
            0
          );
          const newDiscussion = {
            id: maxId + 1,
            userId: user.id,
            text,
            date: new Date().toISOString().split("T")[0],
            replies: [],
          };
          return {
            ...club,
            discussions: [...club.discussions, newDiscussion],
          };
        })
      );
    },
    [user.id]
  );

  const addReply = useCallback(
    (clubId, discussionId, text) => {
      setAllClubs((prev) =>
        prev.map((club) => {
          if (club.id !== clubId) return club;
          return {
            ...club,
            discussions: club.discussions.map((discussion) => {
              if (discussion.id !== discussionId) return discussion;
              const newReply = {
                userId: user.id,
                text,
                date: new Date().toISOString().split("T")[0],
              };
              return {
                ...discussion,
                replies: [...discussion.replies, newReply],
              };
            }),
          };
        })
      );
    },
    [user.id]
  );

  const getBookById = useCallback(
    (id) => {
      return allBooks.find((book) => book.id === id);
    },
    [allBooks]
  );

  const getUserById = useCallback(
    (id) => {
      return allUsers.find((u) => u.id === id);
    },
    [allUsers]
  );

  const getReviewsForBook = useCallback(
    (bookId) => {
      return allReviews.filter((review) => review.bookId === bookId);
    },
    [allReviews]
  );

  const getReviewsByUser = useCallback(
    (userId) => {
      return allReviews.filter((review) => review.userId === userId);
    },
    [allReviews]
  );

  const getUserReadingStatus = useCallback(
    (bookId) => {
      const entry = userReadingLog.find((e) => e.bookId === bookId);
      return entry ? entry.status : null;
    },
    [userReadingLog]
  );

  const getUserRating = useCallback(
    (bookId) => {
      const entry = userReadingLog.find((e) => e.bookId === bookId);
      return entry ? entry.rating : null;
    },
    [userReadingLog]
  );

  const value = {
    allBooks,
    allUsers,
    allReviews,
    allClubs,
    user,
    userReadingLog,
    searchQuery,
    addReview,
    updateRating,
    addToShelf,
    removeFromShelf,
    toggleLikeReview,
    joinClub,
    leaveClub,
    addDiscussion,
    addReply,
    setSearchQuery,
    getBookById,
    getUserById,
    getReviewsForBook,
    getReviewsByUser,
    getUserReadingStatus,
    getUserRating,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
