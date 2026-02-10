import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import DiscoverPage from './pages/DiscoverPage'
import BookDetailPage from './pages/BookDetailPage'
import BookClubsPage from './pages/BookClubsPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="discover" element={<DiscoverPage />} />
            <Route path="book/:id" element={<BookDetailPage />} />
            <Route path="clubs" element={<BookClubsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}

export default App
