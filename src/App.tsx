import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Vehicles from "@/pages/Vehicles";
import Drivers from "@/pages/Drivers";
import Movements from "@/pages/Movements";
import Gate from "@/pages/Gate";
import Users from "@/pages/Users";
import Login from "@/pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={
              <ProtectedRoute>
                <AppProvider>
                  <AppLayout />
                </AppProvider>
              </ProtectedRoute>
            }>
              <Route path="/" element={<ProtectedRoute allowedRoles={['dev', 'admin']}><Dashboard /></ProtectedRoute>} />
              <Route path="/vehicles" element={<ProtectedRoute allowedRoles={['dev', 'admin']}><Vehicles /></ProtectedRoute>} />
              <Route path="/drivers" element={<ProtectedRoute allowedRoles={['dev', 'admin']}><Drivers /></ProtectedRoute>} />
              <Route path="/movements" element={<Movements />} />
              <Route path="/gate" element={<ProtectedRoute allowedRoles={['dev', 'admin', 'gate']}><Gate /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute allowedRoles={['dev', 'admin']}><Users /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
