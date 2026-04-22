import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, Component, ReactNode } from 'react';
import { AuthProvider } from './lib/AuthContext';
import AuthGuard from './components/auth/AuthGuard';
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

interface ErrorBoundaryState { hasError: boolean }
class DashboardErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Une erreur est survenue</h2>
            <p className="text-gray-600 mb-4">Impossible de charger le tableau de bord.</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Recharger
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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

function PricingStandalonePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-16">
        <Pricing />
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
            <Route path="/pricing" element={<PricingStandalonePage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/dashboard" element={
              <DashboardErrorBoundary>
                <AuthGuard>
                  <DashboardLayout />
                </AuthGuard>
              </DashboardErrorBoundary>
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
