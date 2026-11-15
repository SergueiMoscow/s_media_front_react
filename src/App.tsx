import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import AppLayout from './components/layout/AppLayout';
import { RequireAuth } from './router/RequireAuth';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import StoragesPage from './pages/StoragesPage';
import FolderContentPage from './pages/FolderContentPage';
import CatalogContentPage from './pages/CatalogContentPage';
import AnalyzerPage from './pages/AnalyzerPage';
import AnalyzerDetailPage from './pages/AnalyzerDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="login" element={<LoginPage />} />

            <Route element={<RequireAuth />}>
              <Route path="storages" element={<StoragesPage />} />
              <Route path="folder_content" element={<FolderContentPage />} />
              <Route
                path="folder_content/:server/:storage/*"
                element={<FolderContentPage />}
              />
              <Route
                path="catalog_content/:server_id/:storage_id"
                element={<CatalogContentPage />}
              />
              <Route path="analyzer" element={<AnalyzerPage />} />
              <Route path="analyzer/:server_id" element={<AnalyzerDetailPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
