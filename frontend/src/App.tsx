import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { RequireAdmin, RequireAuth } from './components/guards';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SubmitPage from './pages/SubmitPage';
import HistoryPage from './pages/HistoryPage';
import SubmissionDetailPage from './pages/SubmissionDetailPage';
import AppealsPage from './pages/AppealsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import AppealsQueuePage from './pages/admin/AppealsQueuePage';
import PolicyPage from './pages/admin/PolicyPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/submit" replace />} />
          <Route path="/submit" element={<SubmitPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/submissions/:id" element={<SubmissionDetailPage />} />
          <Route path="/appeals" element={<AppealsPage />} />

          <Route element={<RequireAdmin />}>
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
            <Route path="/admin/queue" element={<AppealsQueuePage />} />
            <Route path="/admin/policy" element={<PolicyPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/submit" replace />} />
    </Routes>
  );
}
