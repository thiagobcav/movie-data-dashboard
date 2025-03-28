
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Contents from "./pages/Contents";
import Episodes from "./pages/Episodes";
import Banners from "./pages/Banners";
import Categories from "./pages/Categories";
import Users from "./pages/Users";
import Sessions from "./pages/Sessions";
import Platforms from "./pages/Platforms";
import Login from "./pages/Login";
import { ConfigProvider } from "./context/ConfigContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useState } from "react";

const App = () => {
  // Create a QueryClient instance inside the component with useState
  // to ensure it's stable across renders
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ConfigProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/contents" element={
                  <ProtectedRoute>
                    <Contents />
                  </ProtectedRoute>
                } />
                <Route path="/episodes" element={
                  <ProtectedRoute>
                    <Episodes />
                  </ProtectedRoute>
                } />
                <Route path="/banners" element={
                  <ProtectedRoute>
                    <Banners />
                  </ProtectedRoute>
                } />
                <Route path="/categories" element={
                  <ProtectedRoute>
                    <Categories />
                  </ProtectedRoute>
                } />
                <Route path="/users" element={
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                } />
                <Route path="/sessions" element={
                  <ProtectedRoute>
                    <Sessions />
                  </ProtectedRoute>
                } />
                <Route path="/platforms" element={
                  <ProtectedRoute>
                    <Platforms />
                  </ProtectedRoute>
                } />
                
                {/* Not found and redirect */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ConfigProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
