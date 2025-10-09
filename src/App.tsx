import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './lib/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Hero from './components/home/Hero';
import Features from './components/home/Features';
import Benefits from './components/home/Benefits';
import Demo from './components/home/Demo';
import Savings from './components/home/Savings';
import Reliability from './components/home/Reliability';
import Pricing from './components/home/Pricing';
import FAQ from './components/home/FAQ';
import Contact from './components/home/Contact';
import LogoSection from './components/home/LogoSection';
import CookieConsent from './components/gdpr/CookieConsent';

const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout'));
const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome'));
const CallCenter = lazy(() => import('./pages/dashboard/CallCenter'));
const Appointments = lazy(() => import('./pages/dashboard/Appointments'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));
const Billing = lazy(() => import('./pages/dashboard/Billing'));
const PhoneLine = lazy(() => import('./pages/dashboard/PhoneLine'));
const Notifications = lazy(() => import('./pages/dashboard/Notifications'));
const Analytics = lazy(() => import('./pages/dashboard/Analytics'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const CheckoutSuccess = lazy(() => import('./pages/checkout/Success'));
const CheckoutCanceled = lazy(() => import('./pages/checkout/Canceled'));
const CancellationForm = lazy(() => import('./pages/subscription/CancellationForm'));
const AuthGuard = lazy(() => import('./components/auth/AuthGuard'));
const LegalMentions = lazy(() => import('./pages/legal/LegalMentions'));
const TermsPage = lazy(() => import('./pages/legal/TermsPage'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const CalendarCallback = lazy(() => import('./pages/calendar/CalendarCallback'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Features />
        <LogoSection />
        <Benefits />
        <Demo />
        <Savings />
        <Reliability />
        <Pricing />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/checkout/canceled" element={<CheckoutCanceled />} />
            <Route path="/subscription/cancel" element={<CancellationForm />} />
            <Route path="/mentions-legales" element={<LegalMentions />} />
            <Route path="/conditions-generales" element={<TermsPage />} />
            <Route path="/politique-de-confidentialite" element={<PrivacyPolicy />} />
            <Route path="/calendar/callback" element={<CalendarCallback />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/dashboard" element={
              <AuthGuard>
                <DashboardLayout />
              </AuthGuard>
            }>
              <Route index element={<DashboardHome />} />
              <Route path="calls" element={<CallCenter />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="line" element={<PhoneLine />} />
              <Route path="settings" element={<Settings />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="billing" element={<Billing />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
          </Routes>
          <CookieConsent />
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
