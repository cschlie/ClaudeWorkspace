export const bookClubs = [
  {
    id: 1,
    name: "The Midnight Society",
    description: "A cozy club for night owls who read everything from literary fiction to genre-bending thrillers. We meet virtually every other Friday.",
    members: [1, 2, 3, 5],
    admin: 1,
    currentBook: 6,
    coverColor: "#4a1942",
    schedule: "Bi-weekly Fridays, 9PM EST",
    isPublic: true,
    readingHistory: [
      { bookId: 7, finishedDate: "2026-01-24" },
      { bookId: 10, finishedDate: "2026-01-10" },
      { bookId: 3, finishedDate: "2025-12-27" },
    ],
    discussions: [
      {
        id: 1,
        userId: 1,
        text: "Just started Beloved — Morrison's prose is hitting me like a freight train. Anyone else feeling this?",
        date: "2026-02-08",
        replies: [
          { userId: 3, text: "The opening line alone. Incredible.", date: "2026-02-08" },
          { userId: 5, text: "I'm only 30 pages in and I've had to put it down twice to process. This is heavy.", date: "2026-02-08" },
        ],
      },
      {
        id: 2,
        userId: 2,
        text: "How far along is everyone? I'm thinking we discuss through chapter 10 this Friday.",
        date: "2026-02-07",
        replies: [
          { userId: 1, text: "I'll be there by Friday for sure!", date: "2026-02-07" },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Myth & Blade",
    description: "Fantasy and mythology retellings. From Homer to Miller, we love it all. Sword fights and feelings.",
    members: [1, 4, 6],
    admin: 4,
    currentBook: 15,
    coverColor: "#1a3a2a",
    schedule: "Monthly, 1st Saturday, 3PM EST",
    isPublic: true,
    readingHistory: [
      { bookId: 12, finishedDate: "2026-01-04" },
      { bookId: 16, finishedDate: "2025-12-07" },
    ],
    discussions: [
      {
        id: 3,
        userId: 4,
        text: "Circe discussion starts next Saturday! Make sure you're through at least Part 2.",
        date: "2026-02-06",
        replies: [
          { userId: 6, text: "Already done! Miller is incredible as always.", date: "2026-02-06" },
          { userId: 1, text: "I reread it so fast. Can't wait to discuss the Odysseus chapters.", date: "2026-02-07" },
        ],
      },
    ],
  },
  {
    id: 3,
    name: "The Dystopia Diaries",
    description: "Exploring bleak futures and cautionary tales. From Orwell to Atwood. Depressing? Yes. Important? Also yes.",
    members: [2, 3, 5],
    admin: 2,
    currentBook: 14,
    coverColor: "#3a1a1a",
    schedule: "Weekly Wednesdays, 7PM EST",
    isPublic: false,
    readingHistory: [
      { bookId: 3, finishedDate: "2026-01-17" },
    ],
    discussions: [
      {
        id: 4,
        userId: 2,
        text: "Atwood's Gilead feels more relevant every year. Let's discuss chapters 1-15 this week.",
        date: "2026-02-05",
        replies: [
          { userId: 5, text: "The ceremony chapter was brutal to get through. Atwood doesn't let you look away.", date: "2026-02-05" },
          { userId: 3, text: "The use of second-person interludes is genius. She pulls you right in.", date: "2026-02-06" },
        ],
      },
    ],
  },
];
