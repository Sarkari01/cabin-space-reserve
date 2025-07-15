import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import StudentDashboard from "./pages/Student/Dashboard";
import MerchantDashboard from "./pages/Merchant/Dashboard";
import AdminDashboard from "./pages/Admin/Dashboard";
import InchargeDashboard from "./pages/Incharge/Dashboard";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/student/dashboard" 
              element={
                <ProtectedRoute requiredRole="student">
                  <ErrorBoundary>
                    <StudentDashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/merchant/dashboard" 
              element={
                <ProtectedRoute requiredRole="merchant">
                  <ErrorBoundary>
                    <MerchantDashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ErrorBoundary>
                    <AdminDashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/incharge/dashboard" 
              element={
                <ProtectedRoute requiredRole="incharge">
                  <ErrorBoundary>
                    <InchargeDashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment-success" 
              element={
                <ProtectedRoute allowMultipleRoles={['student', 'merchant']}>
                  <ErrorBoundary>
                    <PaymentSuccess />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
