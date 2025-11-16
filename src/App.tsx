import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import Index from "./pages/Index";
import Fields from "./pages/Fields";
import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import MyBookings from "./pages/MyBookings";
import Account from "./pages/Account";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Promotions from "./pages/Promotions";
import PromotionDetail from "./pages/PromotionDetail";
import { Dashboard } from "./pages/admin/Dashboard";
import { AdminUsers } from "./pages/admin/Users";
import { AdminPitches } from "./pages/admin/Pitches";
import { AdminBookings } from "./pages/admin/Bookings";
import { AdminRevenue } from "./pages/admin/Revenue";
import { AdminFeedback } from "./pages/admin/Feedback";
import { AdminSettings } from "./pages/admin/Settings";
import { AdminPromotions } from "./pages/admin/Promotions";
import { AdminReviews } from "./pages/admin/Reviews";
import { OwnerDashboard } from "./pages/owner/Dashboard";
import { OwnerPitches } from "./pages/owner/Pitches";
import { OwnerBookings } from "./pages/owner/Bookings";
import { OwnerRevenue } from "./pages/owner/Revenue";
import { OwnerSettings } from "./pages/owner/Settings";
import { OwnerPromotions } from "./pages/owner/Promotions";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <NotificationProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/fields" element={<Fields />} />
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/promotions/:id" element={<PromotionDetail />} />
              <Route path="/booking/:fieldId" element={<Booking />} />
              <Route path="/payment/:bookingId" element={<Payment />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout>
                      <Dashboard />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout>
                      <AdminUsers />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/pitches"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout>
                      <AdminPitches />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/bookings"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout>
                      <AdminBookings />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/revenue"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout>
                      <AdminRevenue />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/feedback"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout>
                      <AdminFeedback />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout>
                      <AdminSettings />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/promotions"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout>
                      <AdminPromotions />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reviews"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout>
                      <AdminReviews />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              {/* Owner Routes */}
              <Route
                path="/owner/dashboard"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerLayout>
                      <OwnerDashboard />
                    </OwnerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/pitches"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerLayout>
                      <OwnerPitches />
                    </OwnerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/bookings"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerLayout>
                      <OwnerBookings />
                    </OwnerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/revenue"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerLayout>
                      <OwnerRevenue />
                    </OwnerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/settings"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerLayout>
                      <OwnerSettings />
                    </OwnerLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/promotions"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerLayout>
                      <OwnerPromotions />
                    </OwnerLayout>
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
