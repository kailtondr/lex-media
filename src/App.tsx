import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import { AuthProvider } from './contexts/AuthContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import GlobalPlayer from './components/GlobalPlayer';

// Pages
import MediaHub from './pages/MediaHub';
import PlayerPage from './pages/PlayerPage';
import GraphView from './pages/GraphView';
import TranscribePage from './pages/TranscribePage';
import SettingsPage from './pages/SettingsPage';
import NotesPage from './pages/NotesPage';
import TagsPage from './pages/TagsPage';

// ...

function App() {
  return (
    <Router>
      <AuthProvider>
        <PlayerProvider>
          <GlobalPlayer />
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/media" element={
                <ProtectedRoute>
                  <MediaHub />
                </ProtectedRoute>
              } />
              <Route path="/resource/:id" element={
                <ProtectedRoute>
                  <PlayerPage />
                </ProtectedRoute>
              } />
              <Route path="/player" element={
                <ProtectedRoute>
                  <PlayerPage />
                </ProtectedRoute>
              } />
              <Route path="/brain" element={
                <ProtectedRoute>
                  <GraphView />
                </ProtectedRoute>
              } />
              <Route path="/notes" element={
                <ProtectedRoute>
                  <NotesPage />
                </ProtectedRoute>
              } />
              <Route path="/notes/:id" element={
                <ProtectedRoute>
                  <NotesPage />
                </ProtectedRoute>
              } />
              <Route path="/tags" element={
                <ProtectedRoute>
                  <TagsPage />
                </ProtectedRoute>
              } />
              <Route path="/transcribe" element={
                <ProtectedRoute>
                  <TranscribePage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
            </Routes>
          </Layout>
        </PlayerProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
