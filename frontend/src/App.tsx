import { Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PublicPage from './pages/PublicPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/user/me" element={<UserDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
