import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Placeholder pages for now
import MediaHub from './pages/MediaHub';
import PlayerPage from './pages/PlayerPage';
import GraphView from './pages/GraphView';
// const Brain = () => <div className="text-slate-400">Graph View - Coming Soon</div>;
import TranscribePage from './pages/TranscribePage';
import SettingsPage from './pages/SettingsPage';

// ...

function App() {
  return (
    <Router>
      <AuthProvider>
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
            <Route path="/brain" element={
              <ProtectedRoute>
                <GraphView />
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
      </AuthProvider>
    </Router>
  );
}

export default App;
