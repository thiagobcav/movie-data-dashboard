
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { ConfigProvider } from "./context/ConfigContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ConfigProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/contents" element={<Contents />} />
            <Route path="/episodes" element={<Episodes />} />
            <Route path="/banners" element={<Banners />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/users" element={<Users />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/platforms" element={<Platforms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
