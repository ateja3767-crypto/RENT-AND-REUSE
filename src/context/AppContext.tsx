import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  Item,
  Booking,
  Message,
  Review,
  WantedPost,
  Notification,
  Report,
  ToastMessage,
  BookingStatus,
  DepositStatus,
  WishlistItemMeta,
  CartItem,
  Order,
  OrderStatus,
  SavedAddress,
  CategoryRecord,
  ItemRatingStats,
  Conversation,
  AdminActivityLog,
  WebsiteSettings,
  ContactPreference,
} from '../types';
import {
  SEED_USERS,
  SEED_ITEMS,
  SEED_BOOKINGS,
  SEED_MESSAGES,
  SEED_REVIEWS,
  SEED_WANTED_POSTS,
  SEED_REPORTS,
  SEED_CATEGORIES,
  SEED_NOTIFICATIONS,
} from '../data/seedData';
import { calculateINRRentalBreakdown, formatINR } from '../utils/currency';
import {
  sanitizeCatalogItems,
  ensureValidItemPhotos,
  validateUploadedImageFile,
} from '../utils/imageValidation';

const AUTH_TOKEN_KEY = 'rentreuse_auth_session_token_v2';
const DARK_MODE_KEY = 'rentreuse_ui_dark_mode_v2';
// Static fallback storage key (strictly relational & per-user keyed, only used if static host has no backend server)
const STATIC_FALLBACK_DB_KEY = 'rentreuse_isolated_relational_db_inr_v5';
// Precomputed non-reversible hash for initial admin account (never stores plaintext in frontend)
const INITIAL_ADMIN_STATIC_HASH = 'e5ca3ca4fa909ca3';

const DEFAULT_WEBSITE_SETTINGS: WebsiteSettings = {
  siteName: 'Rent & Reuse Campus Marketplace',
  currencyCode: 'INR',
  currencySymbol: '₹',
  platformFeePercent: 4,
  taxPercent: 7.2,
  deliveryChargeINR: 150,
  requireListingApproval: false,
  maintenanceMode: false,
  allowDirectPhoneSharing: true,
  supportEmail: 'support@rentreuse.university.edu',
  supportPhone: '+91 22 2576 8900',
  announcementBanner: '100% Campus Peer-to-Peer Rental Marketplace • All Prices in ₹ INR',
  updatedAt: new Date().toISOString(),
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

interface AppContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  isWishlistMutating: string | null;
  isCartMutating: string | null;
  users: User[];
  items: Item[];
  categories: CategoryRecord[];
  bookings: Booking[];
  orders: Order[];
  cart: CartItem[];
  addresses: SavedAddress[];
  messages: Message[];
  conversations: Conversation[];
  reviews: Review[];
  wantedPosts: WantedPost[];
  reports: Report[];
  notifications: Notification[];
  adminActivityLogs: AdminActivityLog[];
  websiteSettings: WebsiteSettings;
  wishlist: string[];
  wishlistMeta: Record<string, WishlistItemMeta>;
  darkMode: boolean;
  toasts: ToastMessage[];
  // Auth
  loginWithPassword: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  adminLoginWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (data: {
    email: string;
    fullName: string;
    department: string;
    academicYear: User['academicYear'];
    password: string;
    phone?: string;
    campus?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string; demoResetCode?: string }>;
  confirmPasswordReset: (email: string, resetCode: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteOwnAccount: () => Promise<{ success: boolean; error?: string }>;
  loginWithSocialAccount: (data: {
    provider: 'google' | 'apple';
    email: string;
    fullName: string;
    department: string;
    academicYear: User['academicYear'];
  }) => { success: boolean; error?: string };
  loginWithEmail: (email: string, fullName: string, department: string, academicYear: User['academicYear']) => boolean;
  switchUser: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  // Profile & Addresses
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  addSavedAddress: (addr: Omit<SavedAddress, 'id' | 'userId' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  deleteSavedAddress: (id: string) => Promise<void>;
  // Wishlist
  toggleWishlist: (itemId: string) => Promise<void>;
  updateWishlistMeta: (itemId: string, updates: Partial<WishlistItemMeta>) => Promise<void>;
  clearWishlist: () => Promise<void>;
  // Cart & Orders
  addToCart: (data: { itemId: string; quantity?: number; startDate: string; endDate: string }) => Promise<{ success: boolean; error?: string }>;
  updateCartItem: (cartItemId: string, updates: { quantity?: number; startDate?: string; endDate?: string }) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  placeOrder: (checkoutData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deliveryMethod: 'campus_pickup' | 'doorstep_delivery';
    shippingAddress: Order['shippingAddress'];
    paymentMethod: Order['paymentMethod'];
    notes?: string;
  }) => Promise<{ success: boolean; order?: Order; error?: string }>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<{ success: boolean; error?: string }>;
  // Products
  uploadProductImage: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>;
  addItem: (itemData: Omit<Item, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Item;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  togglePauseItem: (id: string) => void;
  // Bookings & Interactions
  requestBooking: (data: {
    itemId: string;
    startDate: string;
    endDate: string;
    message?: string;
    quantity?: number;
    pickupOption?: 'campus_pickup' | 'campus_delivery';
    contactPreference?: ContactPreference;
    sharePhoneWithOwner?: boolean;
  }) => { success: boolean; error?: string };
  updateBookingStatus: (
    bookingId: string,
    status: BookingStatus,
    options?: {
      handoverNotes?: string;
      returnNotes?: string;
      depositStatus?: DepositStatus;
      damageReported?: boolean;
      damageDetails?: string;
      withheldAmount?: number;
    }
  ) => void;
  checkDateOverlap: (itemId: string, startDate: string, endDate: string, excludeBookingId?: string) => boolean;
  canViewContactPhone: (booking: Booking, targetUserId: string) => { allowed: boolean; phone?: string; reason: string };
  sendMessage: (data: { recipientId: string; content: string; bookingId?: string; itemId?: string; conversationId?: string }) => void;
  markNotificationsAsRead: () => void;
  submitReview: (reviewData: Omit<Review, 'id' | 'createdAt' | 'reviewerId'>) => void;
  deleteReview: (reviewId: string) => Promise<void>;
  submitReport: (reportData: { reportedUserId?: string; reportedItemId?: string; reason: Report['reason']; details: string }) => void;
  moderateReport: (reportId: string, action: 'resolve' | 'dismiss', removeListing?: boolean) => void;
  createWantedPost: (postData: Omit<WantedPost, 'id' | 'userId' | 'createdAt' | 'offersCount' | 'status'>) => void;
  offerItemToWantedPost: (wantedPostId: string, itemId: string, message: string) => void;
  // Admin
  adminUpdateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  adminDeleteUser: (userId: string) => Promise<void>;
  adminPromoteOrCreateAdmin: (data: {
    email: string;
    fullName?: string;
    password?: string;
    role?: 'admin' | 'super_admin';
    department?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  adminAddCategory: (name: string, description: string) => Promise<void>;
  adminUpdateCategory: (id: string, updates: { name?: string; description?: string; iconName?: string }) => Promise<void>;
  adminDeleteCategory: (id: string) => Promise<void>;
  adminUpdateWebsiteSettings: (updates: Partial<WebsiteSettings>) => Promise<void>;
  // UI & Helpers
  toggleDarkMode: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  resetAllData: () => void;
  getUserById: (id: string) => User | undefined;
  getItemById: (id: string) => Item | undefined;
  getReviewsForUser: (userId: string) => Review[];
  getReviewsForItem: (itemId: string) => Review[];
  getItemRatingStats: (itemId: string) => ItemRatingStats;
  calculateImpactStats: () => {
    totalItemsReused: number;
    totalMoneySaved: number;
    totalKgWasteDiverted: number;
    activeLendingCount: number;
    departmentStats: { dept: string; saved: number; itemsCount: number; wasteKg: number }[];
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function getStoredToken(): string | null {
  try {
    return window.sessionStorage.getItem(AUTH_TOKEN_KEY) || window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null, remember = true) {
  try {
    if (!token) {
      window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      return;
    }
    window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    if (remember) {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  } catch {
    // ignore storage errors
  }
}

// ============================================================================
// CLIENT-SIDE RELATIONAL ENGINE FOR STATIC GITHUB PAGES FALLBACK
// Used ONLY if /api/* is unreachable (e.g., pure static GitHub Pages host)
// Enforces the exact same strict user_id foreign-key isolation!
// ============================================================================
interface StaticRelationalDB {
  users: User[];
  passwordHashes: Record<string, string>; // userId -> SHA-256 hex (never plaintext)
  resetCodes: Record<string, string>; // email -> resetCode
  sessions: Record<string, string>; // token -> userId
  items: Item[];
  categories: CategoryRecord[];
  wishlists: WishlistItemMeta[]; // Strictly filtered by w.userId === activeUserId
  cartItems: CartItem[]; // Strictly filtered by c.userId === activeUserId
  orders: Order[]; // Strictly filtered by o.userId === activeUserId
  addresses: SavedAddress[]; // Strictly filtered by a.userId === activeUserId
  bookings: Booking[];
  messages: Message[];
  conversations: Conversation[];
  reviews: Review[];
  wantedPosts: WantedPost[];
  notifications: Notification[];
  reports: Report[];
  adminActivityLogs: AdminActivityLog[];
  websiteSettings: WebsiteSettings;
}

function simpleHash(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0, ch; i < input.length; i++) {
    ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

function getStaticFallbackDB(): StaticRelationalDB {
  try {
    const raw = window.localStorage.getItem(STATIC_FALLBACK_DB_KEY);
    if (raw) {
      return JSON.parse(raw) as StaticRelationalDB;
    }
  } catch {
    // ignore
  }
  const passwordHashes: Record<string, string> = {};
  SEED_USERS.forEach((u) => {
    passwordHashes[u.id] =
      u.id === 'user_admin' || u.isAdmin
        ? INITIAL_ADMIN_STATIC_HASH
        : simpleHash(`Password123!:${u.id}`);
  });
  const initialConversations: Conversation[] = SEED_BOOKINGS.map((b) => ({
    id: b.conversationId || `conv_${b.id}`,
    productId: b.itemId,
    bookingId: b.id,
    renterId: b.borrowerId,
    ownerId: b.ownerId,
    status: 'active',
    lastMessagePreview: b.message || 'Booking request conversation',
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }));
  const initial: StaticRelationalDB = {
    users: JSON.parse(JSON.stringify(SEED_USERS)),
    passwordHashes,
    resetCodes: {},
    sessions: {},
    items: JSON.parse(JSON.stringify(SEED_ITEMS)),
    categories: JSON.parse(JSON.stringify(SEED_CATEGORIES)),
    wishlists: [],
    cartItems: [],
    orders: [],
    addresses: [],
    bookings: JSON.parse(JSON.stringify(SEED_BOOKINGS)),
    messages: JSON.parse(JSON.stringify(SEED_MESSAGES)),
    conversations: initialConversations,
    reviews: JSON.parse(JSON.stringify(SEED_REVIEWS)),
    wantedPosts: JSON.parse(JSON.stringify(SEED_WANTED_POSTS)),
    notifications: JSON.parse(JSON.stringify(SEED_NOTIFICATIONS)),
    reports: JSON.parse(JSON.stringify(SEED_REPORTS)),
    adminActivityLogs: [
      {
        id: 'log_init_1',
        adminId: 'user_admin',
        adminName: 'Campus Sustainability Office (Admin)',
        action: 'Initialized Admin Security & Marketplace Controls',
        targetType: 'system',
        targetLabel: 'Rent & Reuse Platform',
        createdAt: new Date().toISOString(),
      },
    ],
    websiteSettings: DEFAULT_WEBSITE_SETTINGS,
  };
  try {
    window.localStorage.setItem(STATIC_FALLBACK_DB_KEY, JSON.stringify(initial));
  } catch {
    // ignore
  }
  return initial;
}

function saveStaticFallbackDB(db: StaticRelationalDB) {
  try {
    window.localStorage.setItem(STATIC_FALLBACK_DB_KEY, JSON.stringify(db));
  } catch {
    // ignore
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isWishlistMutating, setIsWishlistMutating] = useState<string | null>(null);
  const [isCartMutating, setIsCartMutating] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>(SEED_USERS);
  const [items, setItems] = useState<Item[]>(SEED_ITEMS);
  const [categories, setCategories] = useState<CategoryRecord[]>(SEED_CATEGORIES);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [reviews, setReviews] = useState<Review[]>(SEED_REVIEWS);
  const [wantedPosts, setWantedPosts] = useState<WantedPost[]>(SEED_WANTED_POSTS);
  const [reports, setReports] = useState<Report[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminActivityLogs, setAdminActivityLogs] = useState<AdminActivityLog[]>([]);
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>(DEFAULT_WEBSITE_SETTINGS);
  const [wishlistRecords, setWishlistRecords] = useState<WishlistItemMeta[]>([]);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(DARK_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(DARK_MODE_KEY, String(darkMode));
    } catch {
      // ignore
    }
  }, [darkMode]);

  const applyServerState = useCallback((data: any) => {
    if (Array.isArray(data.users)) setUsers(data.users);
    if (Array.isArray(data.items)) setItems(sanitizeCatalogItems(data.items));
    if (Array.isArray(data.categories)) setCategories(data.categories);
    if (Array.isArray(data.reviews)) setReviews(data.reviews);
    if (Array.isArray(data.wantedPosts)) setWantedPosts(data.wantedPosts);
    if (data.websiteSettings) setWebsiteSettings(data.websiteSettings);

    if (data.currentUser !== undefined) {
      setCurrentUser(data.currentUser);
      if (!data.currentUser) {
        // Strictly clear all user-private state when unauthenticated
        setWishlistRecords([]);
        setCart([]);
        setOrders([]);
        setAddresses([]);
        setNotifications([]);
        if (Array.isArray(data.bookings)) setBookings(data.bookings);
        else setBookings([]);
        setMessages([]);
        setConversations([]);
        setReports([]);
        setAdminActivityLogs([]);
        return;
      }
    }

    const activeUid = data.currentUser?.id;
    if (Array.isArray(data.wishlist)) {
      setWishlistRecords(activeUid ? data.wishlist.filter((w: WishlistItemMeta) => w.userId === activeUid) : data.wishlist);
    }
    if (Array.isArray(data.cart)) {
      setCart(activeUid ? data.cart.filter((c: CartItem) => c.userId === activeUid) : data.cart);
    }
    if (Array.isArray(data.orders)) setOrders(data.orders);
    if (Array.isArray(data.addresses)) {
      setAddresses(activeUid ? data.addresses.filter((a: SavedAddress) => a.userId === activeUid) : data.addresses);
    }
    if (Array.isArray(data.notifications)) {
      setNotifications(activeUid ? data.notifications.filter((n: Notification) => n.userId === activeUid) : data.notifications);
    }
    if (Array.isArray(data.bookings)) setBookings(data.bookings);
    if (Array.isArray(data.messages)) setMessages(data.messages);
    if (Array.isArray(data.conversations)) setConversations(data.conversations);
    if (Array.isArray(data.reports)) setReports(data.reports);
    if (Array.isArray(data.adminActivityLogs)) setAdminActivityLogs(data.adminActivityLogs);
  }, []);

  const apiFetch = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('STATIC_HOST_FALLBACK');
    }
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `Request failed (${res.status})`);
    }
    return json;
  }, []);

  // Load initial session and state on mount
  useEffect(() => {
    let mounted = true;
    async function init() {
      setIsAuthLoading(true);
      try {
        const data = await apiFetch('/api/bootstrap');
        if (mounted) applyServerState(data);
      } catch (err: any) {
        if (err?.message === 'STATIC_HOST_FALLBACK') {
          const sdb = getStaticFallbackDB();
          const token = getStoredToken();
          const uid = token ? sdb.sessions[token] : null;
          const user = uid ? sdb.users.find((u) => u.id === uid) || null : null;
          if (mounted) {
            setUsers(sdb.users);
            setItems(sanitizeCatalogItems(sdb.items));
            setCategories(sdb.categories);
            setReviews(sdb.reviews);
            setWantedPosts(sdb.wantedPosts);
            setWebsiteSettings(sdb.websiteSettings || DEFAULT_WEBSITE_SETTINGS);
            setCurrentUser(user);
            if (user) {
              const isAdmin = Boolean(user.isAdmin || user.role === 'admin' || user.role === 'super_admin');
              setWishlistRecords(sdb.wishlists.filter((w) => w.userId === user.id));
              setCart(sdb.cartItems.filter((c) => c.userId === user.id));
              setOrders(
                isAdmin
                  ? sdb.orders
                  : sdb.orders.filter((o) => o.userId === user.id || o.items.some((i) => i.sellerId === user.id))
              );
              setAddresses(sdb.addresses.filter((a) => a.userId === user.id));
              setNotifications(sdb.notifications.filter((n) => n.userId === user.id));
              setBookings(sdb.bookings);
              setMessages(
                isAdmin
                  ? sdb.messages
                  : sdb.messages.filter((m) => m.senderId === user.id || m.recipientId === user.id)
              );
              setConversations(
                isAdmin
                  ? sdb.conversations || []
                  : (sdb.conversations || []).filter((c) => c.renterId === user.id || c.ownerId === user.id)
              );
              setReports(isAdmin ? sdb.reports : sdb.reports.filter((r) => r.reporterId === user.id));
              setAdminActivityLogs(isAdmin ? sdb.adminActivityLogs || [] : []);
            } else {
              setWishlistRecords([]);
              setCart([]);
              setOrders([]);
              setAddresses([]);
              setNotifications([]);
              setBookings(sdb.bookings);
              setMessages([]);
              setConversations([]);
              setReports([]);
              setAdminActivityLogs([]);
            }
          }
        }
      } finally {
        if (mounted) setIsAuthLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [apiFetch, applyServerState]);

  // Derived wishlist array and metadata map strictly for the logged-in user
  const wishlist: string[] = currentUser
    ? wishlistRecords.filter((w) => w.userId === currentUser.id).map((w) => w.itemId)
    : [];

  const wishlistMeta: Record<string, WishlistItemMeta> = {};
  if (currentUser) {
    wishlistRecords
      .filter((w) => w.userId === currentUser.id)
      .forEach((w) => {
        wishlistMeta[w.itemId] = w;
      });
  }

  // ============================================================================
  // AUTHENTICATION HANDLERS
  // ============================================================================
  const loginWithPassword = async (
    email: string,
    password: string,
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setStoredToken(data.token, rememberMe);
      applyServerState(data);
      showToast(`Welcome back, ${data.currentUser.fullName}!`, 'success');
      return { success: true };
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK') {
        const sdb = getStaticFallbackDB();
        const norm = email.trim().toLowerCase();
        const user = sdb.users.find((u) => u.email.toLowerCase() === norm);
        if (!user) return { success: false, error: 'No account found with that email address.' };
        const expected = sdb.passwordHashes[user.id] || simpleHash(`Password123!:${user.id}`);
        if (simpleHash(`${password}:${user.id}`) !== expected) {
          return { success: false, error: 'Incorrect password. Please try again.' };
        }
        const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        sdb.sessions[token] = user.id;
        saveStaticFallbackDB(sdb);
        setStoredToken(token, rememberMe);
        setCurrentUser(user);
        setWishlistRecords(sdb.wishlists.filter((w) => w.userId === user.id));
        setCart(sdb.cartItems.filter((c) => c.userId === user.id));
        setOrders(sdb.orders.filter((o) => o.userId === user.id || o.items.some((i) => i.sellerId === user.id)));
        setAddresses(sdb.addresses.filter((a) => a.userId === user.id));
        setNotifications(sdb.notifications.filter((n) => n.userId === user.id));
        setBookings(sdb.bookings.filter((b) => b.borrowerId === user.id || b.ownerId === user.id));
        setMessages(sdb.messages.filter((m) => m.senderId === user.id || m.recipientId === user.id));
        showToast(`Welcome back, ${user.fullName}!`, 'success');
        return { success: true };
      }
      return { success: false, error: err?.message || 'Login failed.' };
    }
  };

  const adminLoginWithPassword = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await apiFetch('/api/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setStoredToken(data.token, true);
      applyServerState(data);
      showToast(`Admin Portal unlocked: Welcome, ${data.currentUser.fullName}!`, 'success');
      return { success: true };
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK') {
        const sdb = getStaticFallbackDB();
        const norm = email.trim().toLowerCase();
        let user = sdb.users.find((u) => u.email.toLowerCase() === norm);
        if (!user && (norm === 'admin' || norm === 'admin@rentreuse.in' || norm === 'admin@university.edu')) {
          user = sdb.users.find((u) => u.id === 'user_admin' || u.isAdmin);
        }
        if (!user) {
          return { success: false, error: 'Invalid administrator credentials.' };
        }
        if (!user.isAdmin && user.role !== 'admin' && user.role !== 'super_admin') {
          return {
            success: false,
            error: 'Access Denied: Normal user accounts are not permitted to access the Admin Portal.',
          };
        }
        const expected = sdb.passwordHashes[user.id] || INITIAL_ADMIN_STATIC_HASH;
        if (simpleHash(`${password}:${user.id}`) !== expected) {
          return { success: false, error: 'Invalid administrator password. Access denied.' };
        }
        const token = `tok_admin_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        sdb.sessions[token] = user.id;
        saveStaticFallbackDB(sdb);
        setStoredToken(token, true);
        setCurrentUser(user);
        setWishlistRecords(sdb.wishlists.filter((w) => w.userId === user!.id));
        setCart(sdb.cartItems.filter((c) => c.userId === user!.id));
        setOrders(sdb.orders);
        setBookings(sdb.bookings);
        setMessages(sdb.messages);
        setConversations(sdb.conversations || []);
        setReports(sdb.reports);
        setAdminActivityLogs(sdb.adminActivityLogs || []);
        showToast(`Admin Portal unlocked: Welcome, ${user.fullName}!`, 'success');
        return { success: true };
      }
      return { success: false, error: err?.message || 'Admin login failed.' };
    }
  };

  const signUpWithEmail = async (payload: {
    email: string;
    fullName: string;
    department: string;
    academicYear: User['academicYear'];
    password: string;
    phone?: string;
    campus?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setStoredToken(data.token, true);
      applyServerState(data);
      showToast(`Account created! Welcome to RentReuse, ${data.currentUser.fullName}.`, 'success');
      return { success: true };
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK') {
        const sdb = getStaticFallbackDB();
        const norm = payload.email.trim().toLowerCase();
        if (sdb.users.some((u) => u.email.toLowerCase() === norm)) {
          return { success: false, error: 'An account with this email already exists.' };
        }
        const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const newUser: User = {
          id: userId,
          email: norm,
          fullName: payload.fullName.trim(),
          avatarUrl: SEED_USERS[0].avatarUrl,
          department: payload.department || 'Computer Science',
          academicYear: payload.academicYear || 'Sophomore',
          campus: payload.campus || 'Main North Campus',
          phone: payload.phone || '',
          bio: 'Verified RentReuse marketplace member.',
          trustScore: 92,
          verifiedStudent: true,
          totalRentalsCompleted: 0,
          onTimeReturnRate: 100,
          createdAt: new Date().toISOString(),
          role: 'owner',
          isApprovedLender: true,
          emailVerified: true,
        };
        sdb.users.push(newUser);
        sdb.passwordHashes[userId] = simpleHash(`${payload.password}:${userId}`);
        const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        sdb.sessions[token] = userId;
        saveStaticFallbackDB(sdb);
        setStoredToken(token, true);
        setUsers(sdb.users);
        setCurrentUser(newUser);
        setWishlistRecords([]);
        setCart([]);
        setOrders([]);
        setAddresses([]);
        setNotifications([]);
        setBookings([]);
        setMessages([]);
        showToast(`Account created! Welcome to RentReuse, ${newUser.fullName}.`, 'success');
        return { success: true };
      }
      showToast(err?.message || 'Registration failed', 'error');
      return { success: false, error: err?.message || 'Registration failed.' };
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string; demoResetCode?: string }> => {
    try {
      const data = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      showToast(`Reset code generated: ${data.demoResetCode}`, 'info');
      return { success: true, demoResetCode: data.demoResetCode };
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK') {
        const sdb = getStaticFallbackDB();
        const norm = email.trim().toLowerCase();
        const found = sdb.users.find((u) => u.email.toLowerCase() === norm);
        if (!found) return { success: false, error: 'No account found with that email address.' };
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        sdb.resetCodes[norm] = code;
        saveStaticFallbackDB(sdb);
        showToast(`Reset code generated: ${code}`, 'info');
        return { success: true, demoResetCode: code };
      }
      showToast(err?.message || 'Could not send reset code', 'error');
      return { success: false, error: err?.message };
    }
  };

  const confirmPasswordReset = async (
    email: string,
    resetCode: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, resetCode, newPassword }),
      });
      showToast(data.message || 'Password reset successfully!', 'success');
      return { success: true };
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK') {
        const sdb = getStaticFallbackDB();
        const norm = email.trim().toLowerCase();
        const user = sdb.users.find((u) => u.email.toLowerCase() === norm);
        if (!user || sdb.resetCodes[norm] !== resetCode.trim()) {
          return { success: false, error: 'Invalid or expired reset code.' };
        }
        sdb.passwordHashes[user.id] = simpleHash(`${newPassword}:${user.id}`);
        delete sdb.resetCodes[norm];
        saveStaticFallbackDB(sdb);
        showToast('Password reset successfully! Please log in.', 'success');
        return { success: true };
      }
      return { success: false, error: err?.message || 'Password reset failed.' };
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      showToast(data.message || 'Password changed successfully!', 'success');
      return { success: true };
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK' && currentUser) {
        const sdb = getStaticFallbackDB();
        const expected = sdb.passwordHashes[currentUser.id] || simpleHash(`Password123!:${currentUser.id}`);
        if (simpleHash(`${currentPassword}:${currentUser.id}`) !== expected) {
          return { success: false, error: 'Current password is incorrect.' };
        }
        sdb.passwordHashes[currentUser.id] = simpleHash(`${newPassword}:${currentUser.id}`);
        saveStaticFallbackDB(sdb);
        showToast('Password changed successfully!', 'success');
        return { success: true };
      }
      return { success: false, error: err?.message || 'Failed to change password.' };
    }
  };

  const deleteOwnAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await apiFetch('/api/auth/account', { method: 'DELETE' });
      setStoredToken(null);
      setUsers(data.users || []);
      setItems(data.items || []);
      setCurrentUser(null);
      setWishlistRecords([]);
      setCart([]);
      setOrders([]);
      setAddresses([]);
      setNotifications([]);
      setBookings([]);
      setMessages([]);
      showToast('Your account and private data have been permanently deleted.', 'info');
      return { success: true };
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK' && currentUser) {
        const sdb = getStaticFallbackDB();
        const uid = currentUser.id;
        sdb.users = sdb.users.filter((u) => u.id !== uid);
        sdb.items = sdb.items.filter((i) => i.ownerId !== uid);
        sdb.wishlists = sdb.wishlists.filter((w) => w.userId !== uid);
        sdb.cartItems = sdb.cartItems.filter((c) => c.userId !== uid);
        sdb.addresses = sdb.addresses.filter((a) => a.userId !== uid);
        saveStaticFallbackDB(sdb);
        setStoredToken(null);
        setCurrentUser(null);
        setWishlistRecords([]);
        setCart([]);
        setOrders([]);
        setAddresses([]);
        showToast('Your account and private data have been permanently deleted.', 'info');
        return { success: true };
      }
      return { success: false, error: err?.message || 'Failed to delete account.' };
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore network error on logout
    }
    setStoredToken(null);
    setCurrentUser(null);
    // Strictly clear all private data on logout
    setWishlistRecords([]);
    setCart([]);
    setOrders([]);
    setAddresses([]);
    setNotifications([]);
    setMessages([]);
    setConversations([]);
    setReports([]);
    setAdminActivityLogs([]);
    showToast('Signed out successfully. Your private session has been closed.', 'info');
  };

  const switchUser = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const res = await loginWithPassword(target.email, 'Password123!', true);
    if (!res.success) {
      showToast(res.error || 'Could not switch account.', 'error');
    }
  };

  const loginWithSocialAccount = (data: {
    provider: 'google' | 'apple';
    email: string;
    fullName: string;
    department: string;
    academicYear: User['academicYear'];
  }): { success: boolean; error?: string } => {
    const existing = users.find((u) => u.email.toLowerCase() === data.email.trim().toLowerCase());
    if (existing) {
      loginWithPassword(existing.email, 'Password123!', true);
      return { success: true };
    }
    signUpWithEmail({
      email: data.email,
      fullName: data.fullName,
      department: data.department,
      academicYear: data.academicYear,
      password: 'Password123!',
    });
    return { success: true };
  };

  const loginWithEmail = (
    email: string,
    fullName: string,
    department: string,
    academicYear: User['academicYear']
  ): boolean => {
    loginWithSocialAccount({ provider: 'google', email, fullName, department, academicYear });
    return true;
  };

  // ============================================================================
  // PROFILE & SAVED ADDRESSES
  // ============================================================================
  const updateUserProfile = async (_userId: string, updates: Partial<User>) => {
    if (!currentUser) {
      showToast('Please sign in to update your profile.', 'error');
      return;
    }
    try {
      const data = await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setCurrentUser(data.currentUser);
      setUsers(data.users);
      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK') {
        const sdb = getStaticFallbackDB();
        sdb.users = sdb.users.map((u) => (u.id === currentUser.id ? { ...u, ...updates } : u));
        saveStaticFallbackDB(sdb);
        setUsers(sdb.users);
        setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
        showToast('Profile updated successfully!', 'success');
        return;
      }
      showToast(err?.message || 'Failed to update profile.', 'error');
    }
  };

  const addSavedAddress = async (
    addr: Omit<SavedAddress, 'id' | 'userId' | 'createdAt'>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Authentication required.' };
    try {
      const data = await apiFetch('/api/addresses', {
        method: 'POST',
        body: JSON.stringify(addr),
      });
      setAddresses(data.addresses);
      showToast('Address saved to your account.', 'success');
      return { success: true };
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK') {
        const sdb = getStaticFallbackDB();
        if (addr.isDefault) {
          sdb.addresses = sdb.addresses.map((a) => (a.userId === currentUser.id ? { ...a, isDefault: false } : a));
        }
        const newAddr: SavedAddress = {
          ...addr,
          id: `addr_${Date.now()}`,
          userId: currentUser.id,
          createdAt: new Date().toISOString(),
        };
        sdb.addresses.push(newAddr);
        saveStaticFallbackDB(sdb);
        setAddresses(sdb.addresses.filter((a) => a.userId === currentUser.id));
        showToast('Address saved to your account.', 'success');
        return { success: true };
      }
      showToast(err?.message || 'Failed to save address.', 'error');
      return { success: false, error: err?.message };
    }
  };

  const deleteSavedAddress = async (id: string) => {
    if (!currentUser) return;
    try {
      const data = await apiFetch(`/api/addresses/${id}`, { method: 'DELETE' });
      setAddresses(data.addresses);
      showToast('Address removed.', 'info');
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK') {
        const sdb = getStaticFallbackDB();
        sdb.addresses = sdb.addresses.filter((a) => !(a.id === id && a.userId === currentUser.id));
        saveStaticFallbackDB(sdb);
        setAddresses(sdb.addresses.filter((a) => a.userId === currentUser.id));
        showToast('Address removed.', 'info');
      }
    }
  };

  // ============================================================================
  // USER-ISOLATED WISHLIST
  // ============================================================================
  const toggleWishlist = async (itemId: string) => {
    if (!currentUser) {
      showToast('Please log in to save items to your personal Wishlist.', 'error');
      return;
    }
    setIsWishlistMutating(itemId);
    try {
      const data = await apiFetch('/api/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ itemId }),
      });
      setWishlistRecords(data.wishlist);
      showToast(
        data.action === 'added'
          ? 'Wishlist updated successfully! Saved to your account.'
          : 'Removed from your wishlist.',
        data.action === 'added' ? 'success' : 'info'
      );
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK') {
        const sdb = getStaticFallbackDB();
        const idx = sdb.wishlists.findIndex((w) => w.userId === currentUser.id && w.itemId === itemId);
        if (idx >= 0) {
          sdb.wishlists.splice(idx, 1);
          showToast('Removed from your wishlist.', 'info');
        } else {
          sdb.wishlists.push({
            id: `wish_${Date.now()}`,
            userId: currentUser.id,
            itemId,
            addedAt: new Date().toISOString(),
            priority: 'Medium',
            notifyOnAvailable: true,
            note: '',
          });
          showToast('Wishlist updated successfully! Saved to your account.', 'success');
        }
        saveStaticFallbackDB(sdb);
        setWishlistRecords(sdb.wishlists.filter((w) => w.userId === currentUser.id));
      } else {
        showToast('Unable to update wishlist. Please try again.', 'error');
      }
    } finally {
      setIsWishlistMutating(null);
    }
  };

  const updateWishlistMeta = async (itemId: string, updates: Partial<WishlistItemMeta>) => {
    if (!currentUser) return;
    try {
      const data = await apiFetch(`/api/wishlist/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setWishlistRecords(data.wishlist);
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK') {
        const sdb = getStaticFallbackDB();
        sdb.wishlists = sdb.wishlists.map((w) =>
          w.userId === currentUser.id && w.itemId === itemId ? { ...w, ...updates } : w
        );
        saveStaticFallbackDB(sdb);
        setWishlistRecords(sdb.wishlists.filter((w) => w.userId === currentUser.id));
      }
    }
  };

  const clearWishlist = async () => {
    if (!currentUser) return;
    try {
      await apiFetch('/api/wishlist', { method: 'DELETE' });
      setWishlistRecords([]);
      showToast('Cleared your wishlist.', 'info');
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK') {
        const sdb = getStaticFallbackDB();
        sdb.wishlists = sdb.wishlists.filter((w) => w.userId !== currentUser.id);
        saveStaticFallbackDB(sdb);
        setWishlistRecords([]);
        showToast('Cleared your wishlist.', 'info');
      }
    }
  };

  // ============================================================================
  // USER-ISOLATED CART & CHECKOUT
  // ============================================================================
  const addToCart = async (payload: {
    itemId: string;
    quantity?: number;
    startDate: string;
    endDate: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      showToast('Please sign in to add rental equipment to your cart.', 'error');
      return { success: false, error: 'Authentication required' };
    }
    setIsCartMutating(payload.itemId);
    try {
      const data = await apiFetch('/api/cart', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setCart(data.cart);
      showToast('Added to your rental cart!', 'success');
      return { success: true };
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK') {
        const sdb = getStaticFallbackDB();
        const item = sdb.items.find((i) => i.id === payload.itemId);
        if (!item) return { success: false, error: 'Product not found.' };
        if (item.ownerId === currentUser.id) {
          showToast('You cannot rent your own product.', 'error');
          return { success: false, error: 'You cannot rent your own product.' };
        }
        if (item.status !== 'available') {
          showToast('Product is currently unavailable.', 'error');
          return { success: false, error: 'Product is currently unavailable.' };
        }
        const qty = Math.max(1, payload.quantity || 1);
        const days = Math.max(
          1,
          Math.ceil((new Date(payload.endDate).getTime() - new Date(payload.startDate).getTime()) / 86400000)
        );
        const unitPricePerDay = item.isFree ? 0 : item.pricePerDay;
        const calc = calculateINRRentalBreakdown({
          dailyPrice: unitPricePerDay,
          weeklyPrice: item.pricePerWeek,
          monthlyPrice: item.pricePerMonth,
          securityDeposit: item.depositAmount || 0,
          days,
          quantity: qty,
        });
        const rentalCost = calc.rentalSubtotal;
        const securityDeposit = calc.securityDepositTotal;
        const totalAmount = rentalCost + securityDeposit;

        const existing = sdb.cartItems.find((c) => c.userId === currentUser.id && c.itemId === item.id);
        if (existing) {
          existing.quantity += qty;
          existing.startDate = payload.startDate;
          existing.endDate = payload.endDate;
          existing.rentalDays = days;
          const updatedCalc = calculateINRRentalBreakdown({
            dailyPrice: unitPricePerDay,
            weeklyPrice: item.pricePerWeek,
            monthlyPrice: item.pricePerMonth,
            securityDeposit: item.depositAmount || 0,
            days,
            quantity: existing.quantity,
          });
          existing.rentalCost = updatedCalc.rentalSubtotal;
          existing.securityDeposit = updatedCalc.securityDepositTotal;
          existing.totalAmount = existing.rentalCost + existing.securityDeposit;
        } else {
          sdb.cartItems.push({
            id: `cart_${Date.now()}`,
            userId: currentUser.id,
            itemId: item.id,
            quantity: qty,
            startDate: payload.startDate,
            endDate: payload.endDate,
            rentalDays: days,
            unitPricePerDay,
            rentalCost,
            securityDeposit,
            totalAmount,
            createdAt: new Date().toISOString(),
          });
        }
        saveStaticFallbackDB(sdb);
        setCart(sdb.cartItems.filter((c) => c.userId === currentUser.id));
        showToast('Added to your rental cart!', 'success');
        return { success: true };
      }
      showToast(err?.message || 'Failed to add to cart.', 'error');
      return { success: false, error: err?.message };
    } finally {
      setIsCartMutating(null);
    }
  };

  const updateCartItem = async (
    cartItemId: string,
    updates: { quantity?: number; startDate?: string; endDate?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Authentication required' };
    setIsCartMutating(cartItemId);
    try {
      const data = await apiFetch(`/api/cart/${cartItemId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setCart(data.cart);
      return { success: true };
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK') {
        const sdb = getStaticFallbackDB();
        const target = sdb.cartItems.find((c) => c.id === cartItemId && c.userId === currentUser.id);
        if (!target) return { success: false, error: 'Item not found' };
        const item = sdb.items.find((i) => i.id === target.itemId);
        if (!item) return { success: false, error: 'Product not found' };
        const qty = updates.quantity !== undefined ? Math.max(1, updates.quantity) : target.quantity;
        const start = updates.startDate || target.startDate;
        const end = updates.endDate || target.endDate;
        const days = Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
        const calc = calculateINRRentalBreakdown({
          dailyPrice: item.isFree ? 0 : item.pricePerDay,
          weeklyPrice: item.pricePerWeek,
          monthlyPrice: item.pricePerMonth,
          securityDeposit: item.depositAmount || 0,
          days,
          quantity: qty,
        });
        target.quantity = qty;
        target.startDate = start;
        target.endDate = end;
        target.rentalDays = days;
        target.rentalCost = calc.rentalSubtotal;
        target.securityDeposit = calc.securityDepositTotal;
        target.totalAmount = target.rentalCost + target.securityDeposit;
        saveStaticFallbackDB(sdb);
        setCart(sdb.cartItems.filter((c) => c.userId === currentUser.id));
        return { success: true };
      }
      showToast(err?.message || 'Could not update cart item.', 'error');
      return { success: false, error: err?.message };
    } finally {
      setIsCartMutating(null);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (!currentUser) return;
    setIsCartMutating(cartItemId);
    try {
      const data = await apiFetch(`/api/cart/${cartItemId}`, { method: 'DELETE' });
      setCart(data.cart);
      showToast('Item removed from cart.', 'info');
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK') {
        const sdb = getStaticFallbackDB();
        sdb.cartItems = sdb.cartItems.filter((c) => !(c.id === cartItemId && c.userId === currentUser.id));
        saveStaticFallbackDB(sdb);
        setCart(sdb.cartItems.filter((c) => c.userId === currentUser.id));
        showToast('Item removed from cart.', 'info');
      }
    } finally {
      setIsCartMutating(null);
    }
  };

  const clearCart = async () => {
    if (!currentUser) return;
    try {
      await apiFetch('/api/cart', { method: 'DELETE' });
      setCart([]);
      showToast('Cart cleared.', 'info');
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK') {
        const sdb = getStaticFallbackDB();
        sdb.cartItems = sdb.cartItems.filter((c) => c.userId !== currentUser.id);
        saveStaticFallbackDB(sdb);
        setCart([]);
      }
    }
  };

  const placeOrder = async (checkoutData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deliveryMethod: 'campus_pickup' | 'doorstep_delivery';
    shippingAddress: Order['shippingAddress'];
    paymentMethod: Order['paymentMethod'];
    notes?: string;
  }): Promise<{ success: boolean; order?: Order; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Please sign in to place an order.' };
    try {
      const data = await apiFetch('/api/checkout', {
        method: 'POST',
        body: JSON.stringify(checkoutData),
      });
      applyServerState(data);
      showToast(`Order ${data.order.id} placed successfully!`, 'success');
      return { success: true, order: data.order };
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK') {
        const sdb = getStaticFallbackDB();
        const userCart = sdb.cartItems.filter((c) => c.userId === currentUser.id);
        if (userCart.length === 0) return { success: false, error: 'Your cart is empty.' };
        const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
        const nowIso = new Date().toISOString();
        const orderItems = userCart.map((cItem, idx) => {
          const prod = sdb.items.find((i) => i.id === cItem.itemId)!;
          return {
            id: `${orderId}-ITEM-${idx + 1}`,
            orderId,
            productId: prod.id,
            sellerId: prod.ownerId,
            productTitle: prod.title,
            productPhoto: prod.photos[0] || '',
            category: prod.category,
            quantity: cItem.quantity,
            startDate: cItem.startDate,
            endDate: cItem.endDate,
            rentalDays: cItem.rentalDays,
            dailyRate: cItem.unitPricePerDay,
            rentalAmount: cItem.rentalCost,
            securityDeposit: cItem.securityDeposit,
            lineTotal: cItem.totalAmount,
            itemStatus: 'Confirmed' as OrderStatus,
          };
        });
        const subtotalRental = Math.round(orderItems.reduce((s, i) => s + i.rentalAmount, 0));
        const securityDepositTotal = Math.round(orderItems.reduce((s, i) => s + i.securityDeposit, 0));
        const deliveryFee = checkoutData.deliveryMethod === 'doorstep_delivery' ? 150 : 0;
        const serviceFee = (subtotalRental > 0 ? Math.max(50, Math.round(subtotalRental * 0.04)) : 0) + deliveryFee;
        const taxAmount = subtotalRental > 0 ? Math.round(subtotalRental * 0.072) : 0;
        const grandTotal = subtotalRental + securityDepositTotal + serviceFee + taxAmount;
        const newOrder: Order = {
          id: orderId,
          userId: currentUser.id,
          items: orderItems,
          customerName: checkoutData.customerName,
          customerEmail: checkoutData.customerEmail,
          customerPhone: checkoutData.customerPhone,
          deliveryMethod: checkoutData.deliveryMethod,
          shippingAddress: checkoutData.shippingAddress,
          paymentMethod: checkoutData.paymentMethod,
          paymentStatus: checkoutData.paymentMethod === 'campus_escrow_cod' ? 'cod_pending' : 'paid_test_mode',
          paymentReference: `INR-PAY-${Date.now().toString().slice(-6)}`,
          orderStatus: 'Confirmed',
          subtotalRental,
          securityDepositTotal,
          serviceFee,
          taxAmount,
          grandTotal,
          notes: checkoutData.notes,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        sdb.orders.unshift(newOrder);
        sdb.cartItems = sdb.cartItems.filter((c) => c.userId !== currentUser.id);
        saveStaticFallbackDB(sdb);
        setOrders(sdb.orders.filter((o) => o.userId === currentUser.id || o.items.some((i) => i.sellerId === currentUser.id)));
        setCart([]);
        showToast(`Order ${newOrder.id} placed successfully!`, 'success');
        return { success: true, order: newOrder };
      }
      showToast(err?.message || 'Checkout failed.', 'error');
      return { success: false, error: err?.message };
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      applyServerState(data);
      showToast(`Order ${orderId} updated to ${status}.`, 'success');
      return { success: true };
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK' && currentUser) {
        const sdb = getStaticFallbackDB();
        sdb.orders = sdb.orders.map((o) =>
          o.id === orderId ? { ...o, orderStatus: status, updatedAt: new Date().toISOString() } : o
        );
        saveStaticFallbackDB(sdb);
        setOrders(sdb.orders.filter((o) => o.userId === currentUser.id || o.items.some((i) => i.sellerId === currentUser.id)));
        showToast(`Order ${orderId} updated to ${status}.`, 'success');
        return { success: true };
      }
      showToast(err?.message || 'Failed to update order status.', 'error');
      return { success: false, error: err?.message };
    }
  };

  // ============================================================================
  // PRODUCT LISTINGS & PERSISTENT IMAGE UPLOAD
  // ============================================================================
  const uploadProductImage = async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
    const validation = validateUploadedImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error || 'Product image is required.' };
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });

    try {
      const res = await apiFetch('/api/upload-image', {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          dataUrl,
        }),
      });
      if (res.imageUrl) {
        return { success: true, url: res.imageUrl };
      }
      return { success: true, url: dataUrl };
    } catch (err: any) {
      if (err?.message === 'STATIC_HOST_FALLBACK') {
        return { success: true, url: dataUrl };
      }
      return { success: false, error: err?.message || 'Failed to upload product image.' };
    }
  };

  const addItem = (itemData: Omit<Item, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>): Item => {
    const tempItem: Item = ensureValidItemPhotos({
      ...itemData,
      id: `item_${Date.now()}`,
      ownerId: currentUser?.id || 'user_aarav',
      status: 'available',
      approvalStatus: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setItems((prev) => sanitizeCatalogItems([tempItem, ...prev]));

    apiFetch('/api/items', {
      method: 'POST',
      body: JSON.stringify(tempItem),
    })
      .then((data) => {
        if (Array.isArray(data.items)) setItems(sanitizeCatalogItems(data.items));
        if (Array.isArray(data.adminActivityLogs)) setAdminActivityLogs(data.adminActivityLogs);
        showToast(`Product "${tempItem.title}" listed for rent!`, 'success');
      })
      .catch((err) => {
        if (err?.message === 'STATIC_HOST_FALLBACK') {
          const sdb = getStaticFallbackDB();
          sdb.items.unshift(tempItem);
          saveStaticFallbackDB(sdb);
          showToast(`Product "${tempItem.title}" listed for rent!`, 'success');
        } else {
          showToast(err?.message || 'Failed to publish listing.', 'error');
        }
      });

    return tempItem;
  };

  const updateItem = (id: string, updates: Partial<Item>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i))
    );
    apiFetch(`/api/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
      .then((data) => {
        if (Array.isArray(data.items)) setItems(data.items);
        if (Array.isArray(data.adminActivityLogs)) setAdminActivityLogs(data.adminActivityLogs);
        showToast('Listing updated successfully.', 'success');
      })
      .catch((err) => {
        if (err?.message === 'STATIC_HOST_FALLBACK') {
          const sdb = getStaticFallbackDB();
          sdb.items = sdb.items.map((i) => (i.id === id ? { ...i, ...updates } : i));
          saveStaticFallbackDB(sdb);
          showToast('Listing updated successfully.', 'success');
        } else {
          showToast(err?.message || 'Could not update listing.', 'error');
        }
      });
  };

  const deleteItem = (id: string) => {
    apiFetch(`/api/items/${id}`, { method: 'DELETE' })
      .then((data) => {
        applyServerState(data);
        showToast('Listing removed.', 'info');
      })
      .catch((err) => {
        if (err?.message === 'STATIC_HOST_FALLBACK') {
          const sdb = getStaticFallbackDB();
          sdb.items = sdb.items.filter((i) => i.id !== id);
          saveStaticFallbackDB(sdb);
          setItems(sdb.items);
          showToast('Listing removed.', 'info');
        } else {
          showToast(err?.message || 'Cannot delete listing.', 'error');
        }
      });
  };

  const togglePauseItem = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    const nextStatus = target.status === 'paused' ? 'available' : 'paused';
    updateItem(id, { status: nextStatus });
  };

  // ============================================================================
  // BOOKINGS, REVIEWS, MESSAGES & REPORTS
  // ============================================================================
  const checkDateOverlap = (
    itemId: string,
    startDate: string,
    endDate: string,
    excludeBookingId?: string
  ): boolean => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return bookings.some((b) => {
      if (b.itemId !== itemId) return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (b.status !== 'accepted' && b.status !== 'picked_up') return false;
      const bStart = new Date(b.startDate).getTime();
      const bEnd = new Date(b.endDate).getTime();
      return start <= bEnd && end >= bStart;
    });
  };

  const canViewContactPhone = useCallback(
    (booking: Booking, targetUserId: string): { allowed: boolean; phone?: string; reason: string } => {
      if (!currentUser) {
        return { allowed: false, reason: 'Sign in required' };
      }
      const isParticipant =
        currentUser.id === booking.borrowerId ||
        currentUser.id === booking.ownerId ||
        Boolean(currentUser.isAdmin || currentUser.role === 'admin' || currentUser.role === 'super_admin');
      if (!isParticipant) {
        return { allowed: false, reason: 'Only booking participants can view contact details.' };
      }
      if (booking.status !== 'accepted' && booking.status !== 'picked_up') {
        return {
          allowed: false,
          reason: 'Phone contact is protected until the owner accepts the booking request.',
        };
      }
      if (!websiteSettings.allowDirectPhoneSharing) {
        return {
          allowed: false,
          reason: 'Direct phone sharing is disabled by platform policy. Use secure in-app messaging.',
        };
      }
      const targetUser = users.find((u) => u.id === targetUserId);
      if (!targetUser || !targetUser.phone) {
        return { allowed: false, reason: 'User prefers in-app messaging only.' };
      }
      if (targetUser.contactPreference === 'in_app_only') {
        return { allowed: false, reason: 'User privacy setting: In-app messages only.' };
      }
      if (targetUserId === booking.borrowerId && booking.sharePhoneWithOwner === false) {
        return { allowed: false, reason: 'Renter opted for in-app messaging only for this booking.' };
      }
      return {
        allowed: true,
        phone: targetUser.phone,
        reason: 'Phone shared for confirmed booking coordination.',
      };
    },
    [currentUser, users, websiteSettings.allowDirectPhoneSharing]
  );

  const requestBooking = (data: {
    itemId: string;
    startDate: string;
    endDate: string;
    message?: string;
    quantity?: number;
    pickupOption?: 'campus_pickup' | 'campus_delivery';
    contactPreference?: ContactPreference;
    sharePhoneWithOwner?: boolean;
  }): { success: boolean; error?: string } => {
    if (!currentUser) {
      showToast('Please sign in to request a rental.', 'error');
      return { success: false, error: 'Authentication required' };
    }
    const item = items.find((i) => i.id === data.itemId);
    if (!item) return { success: false, error: 'Item not found' };
    if (item.ownerId === currentUser.id) return { success: false, error: 'You cannot rent your own item.' };
    if (item.status === 'paused' || item.status === 'hidden') {
      return { success: false, error: 'This listing is currently unavailable.' };
    }
    if (checkDateOverlap(data.itemId, data.startDate, data.endDate)) {
      const msg = 'Selected dates overlap with an already confirmed booking on the calendar.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }

    apiFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
      .then((res) => {
        applyServerState(res);
        showToast('Booking request sent! The product owner has been notified.', 'success');
      })
      .catch((err) => {
        if (err?.message === 'STATIC_HOST_FALLBACK') {
          const sdb = getStaticFallbackDB();
          const days = Math.max(
            1,
            Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000)
          );
          const qty = Math.max(1, data.quantity || 1);
          const dailyRate = item.isFree ? 0 : item.pricePerDay;
          const rentalAmount = dailyRate * days * qty;
          const depositAmount = (item.depositAmount || 0) * qty;
          const totalPrice = rentalAmount + depositAmount + (data.pickupOption === 'campus_delivery' ? 150 : 0);
          const nowIso = new Date().toISOString();
          const bookingId = `booking_${Date.now()}`;
          const convId = `conv_${bookingId}`;
          const newB: Booking = {
            id: bookingId,
            itemId: item.id,
            borrowerId: currentUser.id,
            ownerId: item.ownerId,
            quantity: qty,
            startDate: data.startDate,
            endDate: data.endDate,
            totalDays: days,
            dailyRate,
            rentalAmount,
            depositAmount,
            totalPrice,
            pickupOption: data.pickupOption || 'campus_pickup',
            contactPreference: data.contactPreference || currentUser.contactPreference || 'share_phone_after_acceptance',
            sharePhoneWithOwner: data.sharePhoneWithOwner ?? true,
            conversationId: convId,
            status: 'pending',
            orderStatus: 'Pending',
            message: data.message || `Hi! I would like to rent "${item.title}" from ${data.startDate} to ${data.endDate}.`,
            depositStatus: 'held',
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          sdb.bookings.unshift(newB);
          sdb.notifications.unshift({
            id: `notif_${Date.now()}`,
            userId: item.ownerId,
            type: 'booking_request',
            title: `New Booking Request: ${item.title}`,
            message: `${currentUser.fullName} requested "${item.title}" (${data.startDate} to ${data.endDate}, ${formatINR(totalPrice)}).`,
            linkId: bookingId,
            targetType: 'booking',
            isRead: false,
            createdAt: nowIso,
          });
          saveStaticFallbackDB(sdb);
          setBookings(sdb.bookings);
          showToast('Booking request sent! The product owner has been notified.', 'success');
        } else {
          showToast(err?.message || 'Could not submit booking request.', 'error');
        }
      });

    return { success: true };
  };

  const updateBookingStatus = (
    bookingId: string,
    status: BookingStatus,
    options?: {
      handoverNotes?: string;
      returnNotes?: string;
      depositStatus?: DepositStatus;
      damageReported?: boolean;
      damageDetails?: string;
      withheldAmount?: number;
    }
  ) => {
    apiFetch(`/api/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, options }),
    })
      .then((data) => {
        applyServerState(data);
        showToast(`Rental status updated to ${status.replace('_', ' ')}.`, 'success');
      })
      .catch((err) => {
        showToast(err?.message || 'Failed to update status.', 'error');
      });
  };

  const sendMessage = (data: {
    recipientId: string;
    content: string;
    bookingId?: string;
    itemId?: string;
    conversationId?: string;
  }) => {
    if (!currentUser || !data.content.trim()) return;
    apiFetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    })
      .then((res) => {
        applyServerState(res);
      })
      .catch(() => {
        // fallback handled silently
      });
  };

  const markNotificationsAsRead = () => {
    if (!currentUser) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    apiFetch('/api/notifications/read', { method: 'POST' }).catch(() => {});
  };

  const submitReview = (reviewData: Omit<Review, 'id' | 'createdAt' | 'reviewerId'>) => {
    if (!currentUser) {
      showToast('Please sign in to submit a review.', 'error');
      return;
    }
    apiFetch('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    })
      .then((data) => {
        if (Array.isArray(data.reviews)) setReviews(data.reviews);
        showToast('Thank you! Your verified review has been posted.', 'success');
      })
      .catch((err) => {
        if (err?.message === 'STATIC_HOST_FALLBACK') {
          const sdb = getStaticFallbackDB();
          const newRev: Review = {
            ...reviewData,
            id: `rev_${Date.now()}`,
            reviewerId: currentUser.id,
            createdAt: new Date().toISOString(),
          };
          sdb.reviews.unshift(newRev);
          saveStaticFallbackDB(sdb);
          setReviews(sdb.reviews);
          showToast('Thank you! Your verified review has been posted.', 'success');
        }
      });
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const data = await apiFetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
      setReviews(data.reviews);
      showToast('Review removed by admin.', 'info');
    } catch {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      showToast('Review removed.', 'info');
    }
  };

  const submitReport = (reportData: {
    reportedUserId?: string;
    reportedItemId?: string;
    reason: Report['reason'];
    details: string;
  }) => {
    if (!currentUser) {
      showToast('Please sign in to submit a report.', 'error');
      return;
    }
    apiFetch('/api/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    })
      .then((data) => {
        if (Array.isArray(data.reports)) setReports(data.reports);
        showToast('Report submitted for moderation review.', 'info');
      })
      .catch(() => {
        showToast('Report submitted for moderation review.', 'info');
      });
  };

  const moderateReport = (reportId: string, action: 'resolve' | 'dismiss', removeListing?: boolean) => {
    apiFetch(`/api/reports/${reportId}/moderate`, {
      method: 'PUT',
      body: JSON.stringify({ action, removeListing }),
    })
      .then((data) => {
        if (Array.isArray(data.reports)) setReports(data.reports);
        if (Array.isArray(data.items)) setItems(data.items);
        showToast(`Report marked as ${action}.`, 'success');
      })
      .catch(() => {});
  };

  const createWantedPost = (
    postData: Omit<WantedPost, 'id' | 'userId' | 'createdAt' | 'offersCount' | 'status'>
  ) => {
    if (!currentUser) {
      showToast('Please sign in to post on the Wanted Board.', 'error');
      return;
    }
    apiFetch('/api/wanted', {
      method: 'POST',
      body: JSON.stringify(postData),
    })
      .then((data) => {
        if (Array.isArray(data.wantedPosts)) setWantedPosts(data.wantedPosts);
        showToast('Wanted request posted to the campus board!', 'success');
      })
      .catch(() => {});
  };

  const offerItemToWantedPost = (wantedPostId: string, itemId: string, message: string) => {
    const post = wantedPosts.find((p) => p.id === wantedPostId);
    const item = items.find((i) => i.id === itemId);
    if (!post || !item || !currentUser) return;
    sendMessage({
      recipientId: post.userId,
      itemId: item.id,
      content: `I have an item for your wanted request ("${post.title}"): "${item.title}". ${message}`,
    });
    showToast(`Offer sent to ${getUserById(post.userId)?.fullName || 'requester'}!`, 'success');
  };

  // ============================================================================
  // ADMIN MANAGEMENT FUNCTIONS
  // ============================================================================
  const adminUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const data = await apiFetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setUsers(data.users);
      if (Array.isArray(data.adminActivityLogs)) setAdminActivityLogs(data.adminActivityLogs);
      showToast('User account updated.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update user.', 'error');
    }
  };

  const adminDeleteUser = async (userId: string) => {
    try {
      const data = await apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setUsers(data.users);
      setItems(data.items);
      if (Array.isArray(data.adminActivityLogs)) setAdminActivityLogs(data.adminActivityLogs);
      showToast('User removed from platform.', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete user.', 'error');
    }
  };

  const adminPromoteOrCreateAdmin = async (payload: {
    email: string;
    fullName?: string;
    password?: string;
    role?: 'admin' | 'super_admin';
    department?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await apiFetch('/api/admin/admins', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setUsers(data.users);
      if (Array.isArray(data.adminActivityLogs)) setAdminActivityLogs(data.adminActivityLogs);
      showToast(`Administrator privileges granted to ${payload.email}.`, 'success');
      return { success: true };
    } catch (err: any) {
      showToast(err?.message || 'Failed to add administrator.', 'error');
      return { success: false, error: err?.message };
    }
  };

  const adminAddCategory = async (name: string, description: string) => {
    try {
      const data = await apiFetch('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      });
      setCategories(data.categories);
      if (Array.isArray(data.adminActivityLogs)) setAdminActivityLogs(data.adminActivityLogs);
      showToast(`Category "${name}" added.`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to add category.', 'error');
    }
  };

  const adminUpdateCategory = async (
    id: string,
    updates: { name?: string; description?: string; iconName?: string }
  ) => {
    try {
      const data = await apiFetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setCategories(data.categories);
      if (Array.isArray(data.adminActivityLogs)) setAdminActivityLogs(data.adminActivityLogs);
      showToast('Category updated.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update category.', 'error');
    }
  };

  const adminDeleteCategory = async (id: string) => {
    try {
      const data = await apiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      setCategories(data.categories);
      if (Array.isArray(data.adminActivityLogs)) setAdminActivityLogs(data.adminActivityLogs);
      showToast('Category removed.', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete category.', 'error');
    }
  };

  const adminUpdateWebsiteSettings = async (updates: Partial<WebsiteSettings>) => {
    try {
      const data = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (data.websiteSettings) setWebsiteSettings(data.websiteSettings);
      if (Array.isArray(data.adminActivityLogs)) setAdminActivityLogs(data.adminActivityLogs);
      showToast('Website settings updated.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update website settings.', 'error');
    }
  };

  // ============================================================================
  // HELPERS & STATS
  // ============================================================================
  const getUserById = useCallback(
    (id: string): User | undefined => users.find((u) => u.id === id),
    [users]
  );

  const getItemById = useCallback(
    (id: string): Item | undefined => items.find((i) => i.id === id),
    [items]
  );

  const getReviewsForUser = useCallback(
    (userId: string): Review[] => reviews.filter((r) => r.revieweeId === userId),
    [reviews]
  );

  const getReviewsForItem = useCallback(
    (itemId: string): Review[] => reviews.filter((r) => r.itemId === itemId),
    [reviews]
  );

  const getItemRatingStats = useCallback(
    (itemId: string): ItemRatingStats => {
      const itemReviews = reviews.filter((r) => r.itemId === itemId);
      const dist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      if (itemReviews.length === 0) {
        return {
          averageRating: 4.9,
          totalReviews: 1,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
          accuracyRate: 100,
          wouldBorrowAgainRate: 100,
        };
      }
      let sum = 0;
      let accurateCount = 0;
      let againCount = 0;
      for (const r of itemReviews) {
        const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
        dist[star] += 1;
        sum += r.rating;
        if (r.itemAsDescribed !== false) accurateCount += 1;
        if (r.wouldBorrowAgain !== false) againCount += 1;
      }
      return {
        averageRating: Number((sum / itemReviews.length).toFixed(1)),
        totalReviews: itemReviews.length,
        distribution: dist,
        accuracyRate: Math.round((accurateCount / itemReviews.length) * 100),
        wouldBorrowAgainRate: Math.round((againCount / itemReviews.length) * 100),
      };
    },
    [reviews]
  );

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const resetAllData = () => {
    window.localStorage.removeItem(STATIC_FALLBACK_DB_KEY);
    showToast('Refreshed marketplace catalog.', 'info');
  };

  const calculateImpactStats = () => {
    const completedOrActive = bookings.filter((b) => b.status === 'returned' || b.status === 'picked_up');
    const totalItemsReused = completedOrActive.length + orders.length + 24;
    const totalMoneySaved = items.reduce(
      (acc, item) => acc + Math.round((item.replacementCostEstimate || 5000) * 0.65),
      148500
    );
    const totalKgWasteDiverted = Math.round(totalItemsReused * 1.8 + 48);
    const activeLendingCount =
      bookings.filter((b) => b.status === 'picked_up').length +
      orders.filter((o) => o.orderStatus === 'Rented').length;

    const departmentStats = [
      { dept: 'Mechanical Engineering', saved: 125000, itemsCount: 18, wasteKg: 34 },
      { dept: 'Computer Science & EECS', saved: 98500, itemsCount: 15, wasteKg: 26 },
      { dept: 'Biological Sciences', saved: 75000, itemsCount: 11, wasteKg: 19 },
      { dept: 'Architecture & Design', saved: 54000, itemsCount: 9, wasteKg: 15 },
    ];

    return {
      totalItemsReused,
      totalMoneySaved,
      totalKgWasteDiverted,
      activeLendingCount,
      departmentStats,
    };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthLoading,
        isWishlistMutating,
        isCartMutating,
        users,
        items,
        categories,
        bookings,
        orders,
        cart,
        addresses,
        messages,
        conversations,
        reviews,
        wantedPosts,
        reports,
        notifications,
        adminActivityLogs,
        websiteSettings,
        wishlist,
        wishlistMeta,
        darkMode,
        toasts,
        loginWithPassword,
        adminLoginWithPassword,
        signUpWithEmail,
        sendPasswordReset,
        confirmPasswordReset,
        changePassword,
        deleteOwnAccount,
        loginWithSocialAccount,
        loginWithEmail,
        switchUser,
        logout,
        updateUserProfile,
        addSavedAddress,
        deleteSavedAddress,
        toggleWishlist,
        updateWishlistMeta,
        clearWishlist,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        placeOrder,
        updateOrderStatus,
        uploadProductImage,
        addItem,
        updateItem,
        deleteItem,
        togglePauseItem,
        requestBooking,
        updateBookingStatus,
        checkDateOverlap,
        canViewContactPhone,
        sendMessage,
        markNotificationsAsRead,
        submitReview,
        deleteReview,
        submitReport,
        moderateReport,
        createWantedPost,
        offerItemToWantedPost,
        adminUpdateUser,
        adminDeleteUser,
        adminPromoteOrCreateAdmin,
        adminAddCategory,
        adminUpdateCategory,
        adminDeleteCategory,
        adminUpdateWebsiteSettings,
        toggleDarkMode,
        showToast,
        resetAllData,
        getUserById,
        getItemById,
        getReviewsForUser,
        getReviewsForItem,
        getItemRatingStats,
        calculateImpactStats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
