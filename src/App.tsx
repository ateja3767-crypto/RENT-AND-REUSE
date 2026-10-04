import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ToastContainer } from './components/common/Toast';
import { LandingPage } from './pages/LandingPage';
import { BrowsePage } from './pages/BrowsePage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { WantedBoardPage } from './pages/WantedBoardPage';
import { DashboardPage } from './pages/DashboardPage';
import { MessagesPage } from './pages/MessagesPage';
import { ProfilePage } from './pages/ProfilePage';
import { ImpactPage } from './pages/ImpactPage';
import { AdminPage } from './pages/AdminPage';
import { PostItemPage } from './pages/PostItemPage';
import { WishlistPage } from './pages/WishlistPage';
import { CartCheckoutPage } from './pages/CartCheckoutPage';
import { AuthPage } from './pages/AuthPage';
import { AuthModal } from './pages/AuthModal';

const VALID_TABS = new Set([
  'landing',
  'browse',
  'detail',
  'wishlist',
  'cart',
  'wanted',
  'dashboard',
  'messages',
  'profile',
  'impact',
  'admin',
  'admin-portal',
  'post',
  'auth',
]);

function normalizeTabName(raw: string): string {
  const clean = raw.replace(/^#\/?|^\/+|\/+$/g, '').trim().toLowerCase();
  if (clean === 'admin-dashboard' || clean === 'admindashboard') return 'admin';
  if (clean === 'admin-login' || clean === 'adminportal') return 'admin-portal';
  return clean;
}

function getInitialTabFromLocation(): string {
  try {
    if (typeof window === 'undefined') return 'landing';
    const hash = normalizeTabName(window.location.hash);
    if (hash && VALID_TABS.has(hash)) return hash;
    const path = normalizeTabName(window.location.pathname);
    if (path && VALID_TABS.has(path)) return path;
  } catch {
    // Ignore location access errors
  }
  return 'landing';
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected runtime error occurred.',
    };
  }

  handleResetAndReload = () => {
    try {
      window.sessionStorage.clear();
    } catch {
      // Ignore storage access errors
    }
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-slate-900 dark:text-slate-100">
          <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg space-y-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-bold text-sm flex items-center justify-center mx-auto">
              RR
            </div>
            <h1 className="text-lg font-bold">RentReuse Campus</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {this.state.errorMessage}
            </p>
            <button
              onClick={this.handleResetAndReload}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const { currentUser, isAuthLoading, showToast } = useApp();
  const [currentTab, setCurrentTabState] = useState<string>(getInitialTabFromLocation);
  const [selectedItemId, setSelectedItemId] = useState<string>('item_1');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const isAuthorizedAdmin = Boolean(
    currentUser && (currentUser.isAdmin || currentUser.role === 'admin' || currentUser.role === 'super_admin')
  );

  const setCurrentTab = (tab: string) => {
    const normalized = normalizeTabName(tab);
    const nextTab = VALID_TABS.has(normalized) ? normalized : 'landing';

    if (nextTab === 'admin' && !isAuthLoading && !isAuthorizedAdmin) {
      showToast('Access Denied: Only authorized administrators can enter the Admin Dashboard.', 'error');
      setCurrentTabState('auth');
      try {
        window.history.replaceState(null, '', '#auth');
      } catch {
        // ignore
      }
      return;
    }

    setCurrentTabState(nextTab);
    try {
      const targetHash = nextTab === 'landing' ? '' : `#${nextTab}`;
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', targetHash || window.location.pathname);
      }
    } catch {
      // Ignore history API errors inside restricted iframes
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const tabFromUrl = getInitialTabFromLocation();
      setCurrentTabState(tabFromUrl);
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Automatic guard: if URL or state points to 'admin' and user is not an authorized admin, deny access & redirect to login
  useEffect(() => {
    if (!isAuthLoading && currentTab === 'admin' && !isAuthorizedAdmin) {
      showToast('Access Denied: Normal or unauthenticated users cannot access the Admin Dashboard.', 'error');
      setCurrentTabState('auth');
      try {
        window.history.replaceState(null, '', '#auth');
      } catch {
        // ignore
      }
    }
  }, [currentTab, isAuthLoading, isAuthorizedAdmin, showToast]);

  const activeTab = VALID_TABS.has(currentTab) ? currentTab : 'landing';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Bar Navigation */}
      <Navbar
        currentTab={activeTab}
        setCurrentTab={(tab) => {
          if (tab === 'profile') {
            setSelectedUserId('');
          }
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        setSelectedItemId={setSelectedItemId}
        setSelectedUserId={setSelectedUserId}
        openPostModal={() => setPostModalOpen(true)}
        openAuthModal={() => setCurrentTab('auth')}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingPage
            setCurrentTab={setCurrentTab}
            setSelectedItemId={setSelectedItemId}
            openPostModal={() => setPostModalOpen(true)}
          />
        )}

        {activeTab === 'browse' && (
          <BrowsePage
            setCurrentTab={setCurrentTab}
            setSelectedItemId={setSelectedItemId}
          />
        )}

        {activeTab === 'detail' && (
          <ItemDetailPage
            itemId={selectedItemId}
            onBack={() => setCurrentTab('browse')}
            setCurrentTab={setCurrentTab}
            setSelectedUserId={setSelectedUserId}
          />
        )}

        {activeTab === 'wishlist' && (
          <WishlistPage
            setCurrentTab={setCurrentTab}
            setSelectedItemId={setSelectedItemId}
            setSelectedUserId={setSelectedUserId}
          />
        )}

        {activeTab === 'cart' && (
          <CartCheckoutPage
            setCurrentTab={setCurrentTab}
            setSelectedItemId={setSelectedItemId}
          />
        )}

        {activeTab === 'wanted' && (
          <WantedBoardPage
            setCurrentTab={setCurrentTab}
            setSelectedUserId={setSelectedUserId}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage
            setCurrentTab={setCurrentTab}
            setSelectedItemId={setSelectedItemId}
            setSelectedUserId={setSelectedUserId}
          />
        )}

        {activeTab === 'messages' && (
          <MessagesPage
            setCurrentTab={setCurrentTab}
            setSelectedItemId={setSelectedItemId}
          />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            userId={selectedUserId || undefined}
            setCurrentTab={setCurrentTab}
            setSelectedItemId={setSelectedItemId}
          />
        )}

        {activeTab === 'impact' && (
          <ImpactPage />
        )}

        {activeTab === 'admin' && isAuthorizedAdmin && (
          <AdminPage
            setCurrentTab={setCurrentTab}
            setSelectedItemId={setSelectedItemId}
          />
        )}

        {activeTab === 'post' && (
          <PostItemPage
            setCurrentTab={setCurrentTab}
            setSelectedItemId={setSelectedItemId}
          />
        )}

        {(activeTab === 'auth' || activeTab === 'admin-portal') && (
          <AuthPage
            initialTab={activeTab === 'admin-portal' ? 'admin' : 'login'}
            setCurrentTab={setCurrentTab}
            onSuccess={() => setCurrentTab('browse')}
          />
        )}
      </main>

      <Footer setCurrentTab={setCurrentTab} />

      {/* List Item Modal */}
      {postModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-2xl my-8">
            <PostItemPage
              onClose={() => setPostModalOpen(false)}
              setCurrentTab={setCurrentTab}
              setSelectedItemId={setSelectedItemId}
            />
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {authModalOpen && (
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      )}

      <ToastContainer />
    </div>
  );
}

export function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AppErrorBoundary>
  );
}

export default App;
