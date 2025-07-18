import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "@/components/NotificationProvider";
import { WelcomeSMSUpdater } from "@/components/registration/WelcomeSMSUpdater";
import Landing from "./pages/Landing";
import Login from "./pages/Auth/Login";
import { Register } from "./pages/Auth/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/Admin/Dashboard";
import MerchantDashboard from "./pages/Merchant/Dashboard";
import StudentDashboard from "./pages/Student/Dashboard";
import InchargeDashboard from "./pages/Incharge/Dashboard";
import TelemarketingExecutiveDashboard from "./pages/TelemarketingDashboard";
import PendingPaymentsCallerDashboard from "./pages/PaymentsCallerDashboard";
import CustomerCareExecutiveDashboard from "./pages/CustomerCareDashboard";
import SettlementManagerDashboard from "./pages/SettlementManagerDashboard";
import GeneralAdministratorDashboard from "./pages/GeneralAdminDashboard";
import InstitutionDashboard from "./pages/Institution/Dashboard";
import MaintenancePage from "./pages/MaintenancePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <WelcomeSMSUpdater />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/maintenance" element={<MaintenancePage />} />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Merchant Routes */}
              <Route
                path="/merchant"
                element={
                  <ProtectedRoute requiredRole="merchant">
                    <MerchantDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Student Routes */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute requiredRole="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Incharge Routes */}
              <Route
                path="/incharge"
                element={
                  <ProtectedRoute requiredRole="incharge">
                    <InchargeDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Telemarketing Executive Routes */}
              <Route
                path="/telemarketing_executive"
                element={
                  <ProtectedRoute requiredRole="telemarketing_executive">
                    <TelemarketingExecutiveDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Pending Payments Caller Routes */}
              <Route
                path="/pending_payments_caller"
                element={
                  <ProtectedRoute requiredRole="pending_payments_caller">
                    <PendingPaymentsCallerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Customer Care Executive Routes */}
              <Route
                path="/customer_care_executive"
                element={
                  <ProtectedRoute requiredRole="customer_care_executive">
                    <CustomerCareExecutiveDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Settlement Manager Routes */}
              <Route
                path="/settlement_manager"
                element={
                  <ProtectedRoute requiredRole="settlement_manager">
                    <SettlementManagerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* General Administrator Routes */}
              <Route
                path="/general_administrator"
                element={
                  <ProtectedRoute requiredRole="general_administrator">
                    <GeneralAdministratorDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Institution Routes */}
              <Route
                path="/institution"
                element={
                  <ProtectedRoute requiredRole="institution">
                    <InstitutionDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
