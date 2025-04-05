
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ConfigProvider } from './context/ConfigContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingScreen from './components/common/LoadingScreen';

// Lazy load pages
const Login = lazy(() => import('./pages/Login'));
const Index = lazy(() => import('./pages/Index'));
const Contents = lazy(() => import('./pages/Contents'));
const Episodes = lazy(() => import('./pages/Episodes'));
const Categories = lazy(() => import('./pages/Categories'));
const Users = lazy(() => import('./pages/Users'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));
const DuplicatesCheck = lazy(() => import('./pages/DuplicatesCheck'));
const BulkUpload = lazy(() => import('./pages/BulkUpload'));
const Promotionals = lazy(() => import('./pages/Promotionals'));
const PremiumFeatures = lazy(() => import('./pages/PremiumFeatures'));
const Premium = lazy(() => import('./pages/Premium'));
const PremiumSuccess = lazy(() => import('./pages/PremiumSuccess'));

function App() {
  return (
    <Router>
      <AuthProvider>
        <ConfigProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/contents" element={<ProtectedRoute><Contents /></ProtectedRoute>} />
              <Route path="/episodes" element={<ProtectedRoute><Episodes /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/duplicates/:type" element={<ProtectedRoute><DuplicatesCheck /></ProtectedRoute>} />
              <Route path="/bulk-upload" element={<ProtectedRoute><BulkUpload /></ProtectedRoute>} />
              <Route path="/promotionals" element={<ProtectedRoute><Promotionals /></ProtectedRoute>} />
              <Route path="/premium-features" element={<ProtectedRoute><PremiumFeatures /></ProtectedRoute>} />
              <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
              <Route path="/premium-success" element={<ProtectedRoute><PremiumSuccess /></ProtectedRoute>} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Suspense>
          <Toaster position="top-right" richColors closeButton />
        </ConfigProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
