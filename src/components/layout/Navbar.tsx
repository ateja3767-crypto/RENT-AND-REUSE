import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  PlusCircle,
  Bell,
  Moon,
  Sun,
  Shield,
  ChevronDown,
  Menu,
  X,
  Package,
  Heart,
  ShoppingCart,
  LogOut,
  LogIn,
  User as UserIcon,
  Settings,
  ClipboardList,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  setSelectedItemId?: (id: string) => void;
  setSelectedUserId?: (id: string) => void;
  openPostModal: () => void;
  openAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  setSelectedItemId,
  setSelectedUserId,
  openPostModal,
  openAuthModal,
}) => {
  const {
    currentUser,
    logout,
    wishlist,
    cart,
    notifications,
    markNotificationsAsRead,
    darkMode,
    toggleDarkMode,
    bookings,
    messages,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const incomingPendingCount = currentUser
    ? bookings.filter((b) => b.ownerId === currentUser.id && b.status === 'pending').length
    : 0;

  const unreadNotifCount = currentUser
    ? notifications.filter((n) => n.userId === currentUser.id && !n.isRead).length
    : 0;

  const unreadMessageCount = currentUser
    ? messages.filter((m) => m.recipientId === currentUser.id && !m.isRead).length
    : 0;

  const wishlistCount = currentUser ? wishlist.length : 0;
  const cartCount = currentUser ? cart.reduce((sum, c) => sum + c.quantity, 0) : 0;

  const handleNavClick = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => handleNavClick('landing')}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white hover:opacity-85 transition-opacity whitespace-nowrap cursor-pointer"
          >
            RentReuse
          </button>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => handleNavClick('browse')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
                currentTab === 'browse' ? 'text-emerald-700 dark:text-emerald-400 font-semibold underline underline-offset-8' : ''
              }`}
            >
              Browse Catalog
            </button>

            <button
              onClick={() => handleNavClick('wishlist')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
                currentTab === 'wishlist' ? 'text-emerald-700 dark:text-emerald-400 font-semibold underline underline-offset-8' : ''
              }`}
            >
              Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ''}
            </button>

            <button
              onClick={() => handleNavClick('cart')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
                currentTab === 'cart' || currentTab === 'checkout'
                  ? 'text-emerald-700 dark:text-emerald-400 font-semibold underline underline-offset-8'
                  : ''
              }`}
            >
              Cart{cartCount > 0 ? ` (${cartCount})` : ''}
            </button>

            <button
              onClick={() => handleNavClick('dashboard')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
                currentTab === 'dashboard' ? 'text-emerald-700 dark:text-emerald-400 font-semibold underline underline-offset-8' : ''
              }`}
            >
              Dashboard{incomingPendingCount > 0 ? ` (${incomingPendingCount})` : ''}
            </button>

            <button
              onClick={() => handleNavClick('wanted')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
                currentTab === 'wanted' ? 'text-emerald-700 dark:text-emerald-400 font-semibold underline underline-offset-8' : ''
              }`}
            >
              Wanted Board
            </button>

            {currentUser?.isAdmin && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`hover:text-rose-600 dark:hover:text-rose-400 transition-colors whitespace-nowrap cursor-pointer ${
                  currentTab === 'admin' ? 'text-rose-600 dark:text-rose-400 font-semibold underline underline-offset-8' : ''
                }`}
              >
                Admin Console
              </button>
            )}
          </nav>

          {/* Zone 3: Primary Actions & User Account Menu */}
          <div className="flex items-center gap-2">
            {/* Quick Wishlist Icon */}
            <button
              onClick={() => handleNavClick('wishlist')}
              aria-label="Wishlist"
              title="My Wishlist"
              className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Heart className={`w-4 h-4 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Quick Cart Icon */}
            <button
              onClick={() => handleNavClick('cart')}
              aria-label="Cart"
              title="My Rental Cart"
              className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {currentUser ? (
              <>
                {/* Notifications Popover */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => {
                      setNotifDropdownOpen(!notifDropdownOpen);
                      if (!notifDropdownOpen) markNotificationsAsRead();
                    }}
                    aria-label="Notifications"
                    className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          Account Notifications
                        </span>
                        <span className="text-[11px] text-slate-500 tabular-nums">
                          {notifications.length} total
                        </span>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">
                            No notifications for your account
                          </div>
                        ) : (
                          notifications.slice(0, 6).map((n) => (
                            <div
                              key={n.id}
                              className="p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                              onClick={() => {
                                setNotifDropdownOpen(false);
                                if (n.targetType === 'booking' || n.targetType === 'order') setCurrentTab('dashboard');
                                if (n.targetType === 'message') setCurrentTab('messages');
                                if (n.targetType === 'wanted') setCurrentTab('wanted');
                                if (n.targetType === 'item' && n.linkId && setSelectedItemId) {
                                  setSelectedItemId(n.linkId);
                                  setCurrentTab('detail');
                                }
                              }}
                            >
                              <div className="font-semibold text-slate-900 dark:text-white mb-0.5">{n.title}</div>
                              <div className="text-slate-600 dark:text-slate-300 text-[11px] line-clamp-2">{n.message}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* List Item CTA */}
                <button
                  onClick={openPostModal}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-sm whitespace-nowrap cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>List Product</span>
                </button>

                {/* Authenticated User Profile Menu */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                  >
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="hidden lg:block max-w-[110px] truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {currentUser.fullName.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {currentUser.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                        <div className="mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          ID: {currentUser.id.slice(0, 14)} · {currentUser.trustScore}% Trust
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setCurrentTab('dashboard');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                        >
                          <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                          <span>My Dashboard & Orders</span>
                        </button>

                        <button
                          onClick={() => {
                            setCurrentTab('wishlist');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5">
                            <Heart className="w-3.5 h-3.5 text-slate-400" />
                            <span>My Wishlist</span>
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 tabular-nums">{wishlistCount}</span>
                        </button>

                        <button
                          onClick={() => {
                            setCurrentTab('cart');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5">
                            <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                            <span>My Cart</span>
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 tabular-nums">{cartCount}</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUserId?.(currentUser.id);
                            setCurrentTab('profile');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>Public Profile & Settings</span>
                        </button>

                        <button
                          onClick={() => {
                            setCurrentTab('messages');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5">
                            <Package className="w-3.5 h-3.5 text-slate-400" />
                            <span>Messages</span>
                          </span>
                          {unreadMessageCount > 0 && (
                            <span className="text-[11px] font-bold text-emerald-600">{unreadMessageCount}</span>
                          )}
                        </button>

                        {currentUser.isAdmin && (
                          <button
                            onClick={() => {
                              setCurrentTab('admin');
                              setProfileDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 font-semibold cursor-pointer"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Admin Control Panel</span>
                          </button>
                        )}
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                        <button
                          onClick={async () => {
                            setProfileDropdownOpen(false);
                            await logout();
                            setCurrentTab('auth');
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Unauthenticated: Show Sign In / Register CTA + Admin Portal */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavClick('admin-portal')}
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Portal</span>
                </button>
                <button
                  onClick={() => handleNavClick('auth')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-sm whitespace-nowrap cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In / Sign Up</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-5 space-y-2">
          <button
            onClick={() => handleNavClick('browse')}
            className="w-full text-left px-3 py-2 text-sm rounded-lg text-slate-700 dark:text-slate-200 font-medium"
          >
            Browse Catalog
          </button>
          <button
            onClick={() => handleNavClick('wishlist')}
            className="w-full text-left px-3 py-2 text-sm rounded-lg text-slate-700 dark:text-slate-200 font-medium flex justify-between"
          >
            <span>My Wishlist</span>
            <span className="tabular-nums">{wishlistCount}</span>
          </button>
          <button
            onClick={() => handleNavClick('cart')}
            className="w-full text-left px-3 py-2 text-sm rounded-lg text-slate-700 dark:text-slate-200 font-medium flex justify-between"
          >
            <span>My Cart</span>
            <span className="tabular-nums">{cartCount}</span>
          </button>
          <button
            onClick={() => handleNavClick('dashboard')}
            className="w-full text-left px-3 py-2 text-sm rounded-lg text-slate-700 dark:text-slate-200 font-medium"
          >
            Dashboard & Orders
          </button>
          <button
            onClick={() => handleNavClick('wanted')}
            className="w-full text-left px-3 py-2 text-sm rounded-lg text-slate-700 dark:text-slate-200 font-medium"
          >
            Wanted Board
          </button>
          <button
            onClick={() => handleNavClick('impact')}
            className="w-full text-left px-3 py-2 text-sm rounded-lg text-slate-700 dark:text-slate-200 font-medium"
          >
            Campus Impact
          </button>
          {currentUser ? (
            <>
              <button
                onClick={() => {
                  openPostModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 text-xs font-bold text-white bg-emerald-700 rounded-lg text-center"
              >
                List a Product
              </button>
              <button
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await logout();
                  setCurrentTab('auth');
                }}
                className="w-full py-2 text-xs font-semibold text-rose-600 text-center"
              >
                Log Out ({currentUser.fullName})
              </button>
            </>
          ) : (
            <button
              onClick={() => handleNavClick('auth')}
              className="w-full py-2.5 text-xs font-bold text-white bg-emerald-700 rounded-lg text-center"
            >
              Log In / Sign Up
            </button>
          )}
        </div>
      )}
    </header>
  );
};
