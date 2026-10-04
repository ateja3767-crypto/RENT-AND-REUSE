import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  User,
  Item,
  Booking,
  Message,
  Review,
  WantedPost,
  Notification,
  Report,
  WishlistItemMeta,
  CartItem,
  Order,
  OrderItem,
  SavedAddress,
  CategoryRecord,
  OrderStatus,
  Conversation,
  AdminActivityLog,
  WebsiteSettings,
  ContactPreference,
} from './src/types';
import {
  SEED_USERS,
  SEED_ITEMS,
  SEED_BOOKINGS,
  SEED_MESSAGES,
  SEED_REVIEWS,
  SEED_WANTED_POSTS,
  SEED_NOTIFICATIONS,
  SEED_REPORTS,
  SEED_CATEGORIES,
} from './src/data/seedData';
import { formatINR, calculateINRRentalBreakdown } from './src/utils/currency';
import {
  sanitizeCatalogItems,
  ensureValidItemPhotos,
  isValidImageUrl,
  getFallbackProductImage,
} from './src/utils/imageValidation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'images', 'uploads');

// Precomputed scrypt parameters for initial administrator credential (never stored in plaintext)
const INITIAL_ADMIN_SALT = 'a9f4e2c81b7d3056e4a1928374650fb1';
const INITIAL_ADMIN_SCRYPT_HASH =
  'd0dcc0a6f4ccd945b6a9c1c5ca5a0506b810f67dea2e6c1fa17a61e2e6f30366743269c1ee72afd66cdd5dfe5f932f8c30acff250c9830ccd90db357fa2fe99c';

interface StoredUserCredential {
  userId: string;
  passwordSalt: string;
  passwordHash: string;
  resetCode?: string;
  resetExpiresAt?: number;
}

interface SessionRecord {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

interface DatabaseSchema {
  users: User[];
  credentials: StoredUserCredential[];
  sessions: SessionRecord[];
  items: Item[];
  categories: CategoryRecord[];
  wishlists: WishlistItemMeta[]; // Strictly keyed by userId + itemId
  cartItems: CartItem[]; // Strictly keyed by userId
  orders: Order[]; // Strictly keyed by userId
  addresses: SavedAddress[]; // Strictly keyed by userId
  bookings: Booking[];
  conversations: Conversation[];
  messages: Message[];
  reviews: Review[];
  wantedPosts: WantedPost[];
  notifications: Notification[];
  reports: Report[];
  adminActivityLogs: AdminActivityLog[];
  websiteSettings: WebsiteSettings;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function createCredential(userId: string, plainPassword: string): StoredUserCredential {
  const passwordSalt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(plainPassword, passwordSalt);
  return { userId, passwordSalt, passwordHash };
}

const DEFAULT_WEBSITE_SETTINGS: WebsiteSettings = {
  siteName: 'Rent & Reuse Campus Marketplace',
  supportEmail: 'admin@campus.edu',
  platformFeePercent: 4,
  taxPercent: 7.2,
  defaultMaxRentalDays: 30,
  allowNewRegistrations: true,
  requireEmailVerification: true,
  announcementBanner: 'Indian Rupee (₹ INR) peer-to-peer campus equipment rentals with verified student IDs.',
  smsGatewayEnabled: true,
  updatedAt: '2026-10-01T00:00:00Z',
};

function createInitialDatabase(): DatabaseSchema {
  // Normal demo student accounts use hashed "Password123!"; initial admin uses precomputed scrypt hash
  const credentials: StoredUserCredential[] = SEED_USERS.map((u) => {
    if (u.id === 'user_admin' || u.isAdmin) {
      return {
        userId: u.id,
        passwordSalt: INITIAL_ADMIN_SALT,
        passwordHash: INITIAL_ADMIN_SCRYPT_HASH,
      };
    }
    return createCredential(u.id, 'Password123!');
  });

  const initialConversations: Conversation[] = SEED_BOOKINGS.map((b) => ({
    id: `conv_${b.id}`,
    bookingId: b.id,
    productId: b.itemId,
    ownerId: b.ownerId,
    renterId: b.borrowerId,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }));

  const initialActivityLogs: AdminActivityLog[] = [
    {
      id: 'log_init_1',
      adminId: 'user_admin',
      adminName: 'Campus Sustainability Office',
      adminEmail: 'admin@campus.edu',
      action: 'Initialized catalog & verified 17 campus equipment listings',
      targetType: 'settings',
      targetName: 'Product Catalog (INR ₹)',
      result: 'Success',
      details: 'All 17 listings audited with verified product images and Indian Rupee (₹) pricing.',
      createdAt: '2026-10-01T09:00:00Z',
    },
  ];

  return {
    users: JSON.parse(JSON.stringify(SEED_USERS)),
    credentials,
    sessions: [],
    items: JSON.parse(JSON.stringify(SEED_ITEMS)),
    categories: JSON.parse(JSON.stringify(SEED_CATEGORIES)),
    wishlists: [], // Every user starts with an empty, isolated wishlist
    cartItems: [], // Every user starts with an empty, isolated cart
    orders: [], // Every user starts with an empty, isolated order list
    addresses: [
      {
        id: 'addr_seed_aarav',
        userId: 'user_aarav',
        label: 'Dorm / Hostel',
        fullName: 'Aarav Sharma',
        phone: '+91 98765 43210',
        street: 'Hostel 4, Main North Campus Road',
        building: 'North Residence Hall, Room 312',
        city: 'Mumbai',
        state: 'MH',
        postalCode: '400076',
        isDefault: true,
        createdAt: '2026-09-01T10:00:00Z',
      },
      {
        id: 'addr_seed_maya',
        userId: 'user_maya',
        label: 'Department Lab',
        fullName: 'Maya Patel',
        phone: '+91 98765 43211',
        street: '210 Engineering Quad',
        building: 'Computer Science Building, Lab 204',
        city: 'Mumbai',
        state: 'MH',
        postalCode: '400076',
        isDefault: true,
        createdAt: '2026-09-02T10:00:00Z',
      },
    ],
    bookings: JSON.parse(JSON.stringify(SEED_BOOKINGS)),
    conversations: initialConversations,
    messages: JSON.parse(JSON.stringify(SEED_MESSAGES)),
    reviews: JSON.parse(JSON.stringify(SEED_REVIEWS)),
    wantedPosts: JSON.parse(JSON.stringify(SEED_WANTED_POSTS)),
    notifications: JSON.parse(JSON.stringify(SEED_NOTIFICATIONS)),
    reports: JSON.parse(JSON.stringify(SEED_REPORTS)),
    adminActivityLogs: initialActivityLogs,
    websiteSettings: { ...DEFAULT_WEBSITE_SETTINGS },
  };
}

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = createInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    const fallback = createInitialDatabase();
    let migratedItems =
      Array.isArray(parsed.items) && parsed.items.length > 0
        ? parsed.items.map((item) => {
            const seedMatch = fallback.items.find((s) => s.id === item.id);
            const hasSvgPlaceholder =
              Array.isArray(item.photos) &&
              item.photos.some((p) => typeof p === 'string' && p.startsWith('data:image/svg+xml'));
            if (
              seedMatch &&
              (hasSvgPlaceholder ||
                !Array.isArray(item.photos) ||
                item.photos.length === 0 ||
                (!item.isFree && item.pricePerDay < 50) ||
                (item.description && item.description.includes('$')))
            ) {
              return { ...seedMatch, status: item.status || seedMatch.status };
            }
            return ensureValidItemPhotos(item);
          })
        : fallback.items;

    // Ensure all seed items (including item_17 Canon Camera) exist in the catalog
    for (const seedItem of fallback.items) {
      if (!migratedItems.some((i) => i.id === seedItem.id)) {
        migratedItems.push(seedItem);
      }
    }
    migratedItems = sanitizeCatalogItems(migratedItems);
    const migratedWanted =
      Array.isArray(parsed.wantedPosts) && parsed.wantedPosts.length > 0
        ? parsed.wantedPosts.map((wp) => {
            const seedMatch = fallback.wantedPosts.find((s) => s.id === wp.id);
            if (seedMatch && wp.maxBudgetPerDay < 50) {
              return seedMatch;
            }
            return wp;
          })
        : fallback.wantedPosts;
    const migratedReviews =
      Array.isArray(parsed.reviews) && parsed.reviews.length > 0
        ? parsed.reviews.map((r) => ({
            ...r,
            comment: r.comment ? r.comment.replace(/\$140/g, '₹8,500').replace(/\$/g, '₹') : r.comment,
          }))
        : fallback.reviews;
    const migratedCredentials =
      Array.isArray(parsed.credentials) && parsed.credentials.length > 0
        ? parsed.credentials.map((c) => {
            if (c.userId === 'user_admin') {
              return {
                userId: 'user_admin',
                passwordSalt: INITIAL_ADMIN_SALT,
                passwordHash: INITIAL_ADMIN_SCRYPT_HASH,
              };
            }
            return c;
          })
        : fallback.credentials;

    return {
      users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : fallback.users,
      credentials: migratedCredentials,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      items: migratedItems,
      categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : fallback.categories,
      wishlists: Array.isArray(parsed.wishlists) ? parsed.wishlists : [],
      cartItems: Array.isArray(parsed.cartItems) ? parsed.cartItems : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      addresses: Array.isArray(parsed.addresses) ? parsed.addresses : fallback.addresses,
      bookings: Array.isArray(parsed.bookings) && parsed.bookings.length > 0 ? parsed.bookings : fallback.bookings,
      conversations:
        Array.isArray(parsed.conversations) && parsed.conversations.length > 0
          ? parsed.conversations
          : fallback.conversations,
      messages: Array.isArray(parsed.messages) && parsed.messages.length > 0 ? parsed.messages : fallback.messages,
      reviews: migratedReviews,
      wantedPosts: migratedWanted,
      notifications:
        Array.isArray(parsed.notifications) && parsed.notifications.length > 0
          ? parsed.notifications
          : fallback.notifications,
      reports: Array.isArray(parsed.reports) ? parsed.reports : fallback.reports,
      adminActivityLogs:
        Array.isArray(parsed.adminActivityLogs) && parsed.adminActivityLogs.length > 0
          ? parsed.adminActivityLogs
          : fallback.adminActivityLogs,
      websiteSettings: parsed.websiteSettings
        ? { ...DEFAULT_WEBSITE_SETTINGS, ...parsed.websiteSettings }
        : fallback.websiteSettings,
    };
  } catch (err) {
    console.error('Failed to load database, initializing fresh:', err);
    return createInitialDatabase();
  }
}

let db: DatabaseSchema = loadDatabase();

function saveDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}

function sanitizePublicUser(u: User, viewerId?: string): User {
  const copy = { ...u };
  // Never expose users' phone numbers publicly on product cards or public profiles
  if (viewerId !== u.id) {
    delete copy.phone;
  }
  return copy;
}

function recordAdminActivity(
  admin: User,
  action: string,
  targetType: AdminActivityLog['targetType'],
  targetName: string,
  targetId?: string,
  details?: string,
  result: 'Success' | 'Failed' = 'Success'
) {
  const entry: AdminActivityLog = {
    id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    adminId: admin.id,
    adminName: admin.fullName,
    adminEmail: admin.email,
    action,
    targetType,
    targetName,
    targetId,
    result,
    details,
    createdAt: new Date().toISOString(),
  };
  db.adminActivityLogs.unshift(entry);
}

function enrichBookingForViewer(b: Booking, viewer: User): Booking {
  const copy: Booking = { ...b };
  const isOwner = viewer.id === b.ownerId;
  const isBorrower = viewer.id === b.borrowerId;

  // Administrators monitoring bookings do NOT have private phone numbers exposed unless they are a party
  if (!isOwner && !isBorrower) {
    delete copy.authorizedOwnerPhone;
    delete copy.authorizedRenterPhone;
    return copy;
  }

  const owner = db.users.find((u) => u.id === b.ownerId);
  const renter = db.users.find((u) => u.id === b.borrowerId);
  const ownerPref = b.ownerContactPreference || owner?.contactPreference || 'share_phone_after_acceptance';
  const renterPref = b.renterContactPreference || renter?.contactPreference || 'share_phone_after_acceptance';

  const isAcceptedOrActive = b.status === 'accepted' || b.status === 'picked_up' || b.status === 'returned';

  const canSeeOwnerPhone =
    isOwner ||
    ownerPref === 'allow_both' ||
    (isAcceptedOrActive && ownerPref === 'share_phone_after_acceptance');

  const canSeeRenterPhone =
    isBorrower ||
    renterPref === 'allow_both' ||
    (isAcceptedOrActive && renterPref === 'share_phone_after_acceptance');

  copy.authorizedOwnerPhone = canSeeOwnerPhone ? owner?.phone || undefined : undefined;
  copy.authorizedRenterPhone = canSeeRenterPhone ? renter?.phone || undefined : undefined;
  copy.ownerContactPreference = ownerPref;
  copy.renterContactPreference = renterPref;
  return copy;
}

function getAuthenticatedUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const now = Date.now();
  const session = db.sessions.find((s) => s.token === token && s.expiresAt > now);
  if (!session) return null;

  const user = db.users.find((u) => u.id === session.userId);
  if (!user || user.isSuspended) return null;
  return user;
}

interface AuthedRequest extends Request {
  user?: User;
  token?: string;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please log in to access this resource.' });
    return;
  }
  req.user = user;
  req.token = req.headers.authorization?.slice(7).trim();
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user || (!user.isAdmin && user.role !== 'admin' && user.role !== 'super_admin')) {
    res.status(403).json({ error: 'Admin access required. Insufficient permissions.' });
    return;
  }
  req.user = user;
  next();
}

function getPublicReservedSlots() {
  return db.bookings
    .filter((b) => b.status === 'accepted' || b.status === 'picked_up')
    .map((b) => ({
      id: b.id,
      itemId: b.itemId,
      startDate: b.startDate,
      endDate: b.endDate,
      status: b.status,
    }));
}

function getIsolatedUserState(user: User) {
  const isAdmin = Boolean(user.isAdmin || user.role === 'admin' || user.role === 'super_admin');
  const visibleBookings = isAdmin
    ? db.bookings.map((b) => enrichBookingForViewer(b, user))
    : db.bookings
        .filter((b) => b.borrowerId === user.id || b.ownerId === user.id)
        .map((b) => enrichBookingForViewer(b, user));

  return {
    currentUser: sanitizePublicUser(user, user.id),
    // STRICT ISOLATION: Only records matching user.id
    wishlist: db.wishlists.filter((w) => w.userId === user.id),
    cart: db.cartItems.filter((c) => c.userId === user.id),
    orders: isAdmin
      ? db.orders
      : db.orders.filter(
          (o) => o.userId === user.id || o.items.some((item) => item.sellerId === user.id)
        ),
    addresses: db.addresses.filter((a) => a.userId === user.id),
    notifications: db.notifications.filter((n) => n.userId === user.id),
    bookings: visibleBookings,
    conversations: db.conversations.filter((c) => c.ownerId === user.id || c.renterId === user.id),
    // Private user messages are strictly restricted to sender and recipient (never exposed globally)
    messages: db.messages.filter((m) => m.senderId === user.id || m.recipientId === user.id),
    reports: isAdmin ? db.reports : db.reports.filter((r) => r.reporterId === user.id),
    adminActivityLogs: isAdmin ? db.adminActivityLogs : [],
    websiteSettings: db.websiteSettings,
    reservedSlots: getPublicReservedSlots(),
  };
}

function createAvatarSvg(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] || 'U') + (parts[1]?.[0] || '')).toUpperCase();
  const colors = ['#047857', '#0f766e', '#1d4ed8', '#4338ca', '#b45309', '#be123c'];
  const color = colors[name.length % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <rect width="256" height="256" rx="128" fill="${color}"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Plus Jakarta Sans, sans-serif" font-weight="700" font-size="84">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // ============================================================================
  // 1. BOOTSTRAP & PUBLIC / AUTHENTICATED STATE
  // ============================================================================
  app.get('/api/bootstrap', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const publicPayload = {
      users: db.users.map((u) => sanitizePublicUser(u, user?.id)),
      items: db.items,
      categories: db.categories,
      reviews: db.reviews,
      wantedPosts: db.wantedPosts,
      websiteSettings: db.websiteSettings,
      reservedSlots: getPublicReservedSlots(),
    };

    if (!user) {
      res.json({
        ...publicPayload,
        currentUser: null,
        wishlist: [],
        cart: [],
        orders: [],
        addresses: [],
        notifications: [],
        bookings: [],
        conversations: [],
        messages: [],
        reports: [],
        adminActivityLogs: [],
      });
      return;
    }

    res.json({
      ...publicPayload,
      ...getIsolatedUserState(user),
    });
  });

  // ============================================================================
  // 2. REAL AUTHENTICATION (SIGN UP, LOGIN, LOGOUT, PASSWORD RESET, DELETE)
  // ============================================================================
  app.post('/api/auth/signup', (req: Request, res: Response) => {
    const { email, password, fullName, department, academicYear, phone, campus } = req.body || {};
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({ error: 'Full name is required (at least 2 characters).' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
      return;
    }

    const userId = `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const newUser: User = {
      id: userId,
      email: normalizedEmail,
      fullName: fullName.trim(),
      avatarUrl: createAvatarSvg(fullName.trim()),
      department: (department || 'Computer Science').trim(),
      academicYear: academicYear || 'Sophomore',
      campus: (campus || 'Main North Campus').trim(),
      phone: phone ? String(phone).trim() : '',
      bio: 'Verified RentReuse marketplace member.',
      trustScore: 92,
      verifiedStudent: true,
      totalRentalsCompleted: 0,
      onTimeReturnRate: 100,
      createdAt: new Date().toISOString(),
      isAdmin: false,
      role: 'owner',
      isApprovedLender: true,
      provider: 'email',
      emailVerified: true,
    };

    const cred = createCredential(userId, password);
    const token = crypto.randomBytes(32).toString('hex');
    const session: SessionRecord = {
      token,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
    };

    db.users.push(newUser);
    db.credentials.push(cred);
    db.sessions.push(session);
    saveDatabase();

    res.status(201).json({
      token,
      users: db.users.map((u) => sanitizePublicUser(u)),
      ...getIsolatedUserState(newUser),
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      res.status(401).json({ error: 'No account found with that email address. Please sign up first.' });
      return;
    }
    if (user.isSuspended) {
      res.status(403).json({
        error: 'This account has been suspended by an administrator. Please contact campus support.',
      });
      return;
    }

    let cred = db.credentials.find((c) => c.userId === user.id);
    if (!cred) {
      cred =
        user.id === 'user_admin' || user.isAdmin
          ? {
              userId: user.id,
              passwordSalt: INITIAL_ADMIN_SALT,
              passwordHash: INITIAL_ADMIN_SCRYPT_HASH,
            }
          : createCredential(user.id, 'Password123!');
      db.credentials.push(cred);
    }

    const attemptedHash = hashPassword(String(password), cred.passwordSalt);
    if (attemptedHash !== cred.passwordHash) {
      res.status(401).json({ error: 'Incorrect password. Please check your credentials and try again.' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    db.sessions.push({
      token,
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });
    saveDatabase();

    res.json({
      token,
      users: db.users.map((u) => sanitizePublicUser(u, user.id)),
      ...getIsolatedUserState(user),
    });
  });

  app.post('/api/auth/admin-login', (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Administrator email and password are required.' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    let user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (
      !user &&
      (normalizedEmail === 'admin' ||
        normalizedEmail === 'admin@rentreuse.in' ||
        normalizedEmail === 'admin@university.edu')
    ) {
      user = db.users.find((u) => u.id === 'user_admin' || u.isAdmin);
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({ error: 'This administrator account is currently suspended.' });
      return;
    }

    const isAuthorizedAdmin = Boolean(
      user.isAdmin || user.role === 'admin' || user.role === 'super_admin'
    );
    if (!isAuthorizedAdmin) {
      res.status(403).json({
        error: 'Access Denied: Normal user accounts are not permitted to access the Admin Portal.',
      });
      return;
    }

    let cred = db.credentials.find((c) => c.userId === user.id);
    if (!cred) {
      cred = {
        userId: user.id,
        passwordSalt: INITIAL_ADMIN_SALT,
        passwordHash: INITIAL_ADMIN_SCRYPT_HASH,
      };
      db.credentials.push(cred);
    }

    const attemptedHash = hashPassword(String(password), cred.passwordSalt);
    if (attemptedHash !== cred.passwordHash) {
      res.status(401).json({ error: 'Invalid administrator password. Access denied.' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    db.sessions.push({
      token,
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 12, // 12-hour secure admin session
    });

    recordAdminActivity(
      user,
      'Admin signed into Admin Portal',
      'admin',
      user.email,
      user.id,
      'Authenticated via role-based Admin Portal login'
    );
    saveDatabase();

    res.json({
      token,
      users: db.users.map((u) => sanitizePublicUser(u, user.id)),
      ...getIsolatedUserState(user),
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      db.sessions = db.sessions.filter((s) => s.token !== token);
      saveDatabase();
    }
    res.json({ success: true });
  });

  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Please enter your registered email address.' });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      res.status(404).json({ error: 'No registered user found with that email address.' });
      return;
    }

    let cred = db.credentials.find((c) => c.userId === user.id);
    if (!cred) {
      cred = createCredential(user.id, 'Password123!');
      db.credentials.push(cred);
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    cred.resetCode = resetCode;
    cred.resetExpiresAt = Date.now() + 1000 * 60 * 15; // 15 minutes
    saveDatabase();

    res.json({
      success: true,
      message: `Password reset code generated for ${normalizedEmail}.`,
      demoResetCode: resetCode, // Provided so user can complete reset in sandbox without external SMTP
    });
  });

  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { email, resetCode, newPassword } = req.body || {};
    if (!email || !resetCode || !newPassword) {
      res.status(400).json({ error: 'Email, reset code, and new password are required.' });
      return;
    }
    if (String(newPassword).length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const cred = db.credentials.find((c) => c.userId === user.id);
    if (
      !cred ||
      !cred.resetCode ||
      cred.resetCode !== String(resetCode).trim() ||
      !cred.resetExpiresAt ||
      cred.resetExpiresAt < Date.now()
    ) {
      res.status(400).json({ error: 'Invalid or expired password reset code.' });
      return;
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    cred.passwordSalt = newSalt;
    cred.passwordHash = hashPassword(String(newPassword), newSalt);
    delete cred.resetCode;
    delete cred.resetExpiresAt;
    saveDatabase();

    res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
  });

  app.post('/api/auth/change-password', requireAuth, (req: AuthedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body || {};
    const user = req.user!;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Both current password and new password are required.' });
      return;
    }
    if (String(newPassword).length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    let cred = db.credentials.find((c) => c.userId === user.id);
    if (!cred) {
      cred = createCredential(user.id, 'Password123!');
      db.credentials.push(cred);
    }

    const currentHash = hashPassword(String(currentPassword), cred.passwordSalt);
    if (currentHash !== cred.passwordHash) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    cred.passwordSalt = newSalt;
    cred.passwordHash = hashPassword(String(newPassword), newSalt);
    saveDatabase();

    res.json({ success: true, message: 'Password updated successfully.' });
  });

  app.delete('/api/auth/account', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    db.users = db.users.filter((u) => u.id !== user.id);
    db.credentials = db.credentials.filter((c) => c.userId !== user.id);
    db.sessions = db.sessions.filter((s) => s.userId !== user.id);
    db.wishlists = db.wishlists.filter((w) => w.userId !== user.id);
    db.cartItems = db.cartItems.filter((c) => c.userId !== user.id);
    db.addresses = db.addresses.filter((a) => a.userId !== user.id);
    db.notifications = db.notifications.filter((n) => n.userId !== user.id);
    db.items = db.items.filter((i) => i.ownerId !== user.id);
    saveDatabase();

    res.json({ success: true, users: db.users.map((u) => sanitizePublicUser(u)), items: db.items });
  });

  // ============================================================================
  // 3. USER PROFILE & SAVED ADDRESSES (USER-ISOLATED)
  // ============================================================================
  app.put('/api/profile', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const {
      fullName,
      department,
      academicYear,
      campus,
      phone,
      bio,
      avatarUrl,
      contactPreference,
      smsNotificationsEnabled,
    } = req.body || {};

    db.users = db.users.map((u) => {
      if (u.id !== user.id) return u;
      return {
        ...u,
        ...(fullName !== undefined && { fullName: String(fullName).trim() }),
        ...(department !== undefined && { department: String(department).trim() }),
        ...(academicYear !== undefined && { academicYear }),
        ...(campus !== undefined && { campus: String(campus).trim() }),
        ...(phone !== undefined && { phone: String(phone).trim() }),
        ...(bio !== undefined && { bio: String(bio).trim() }),
        ...(avatarUrl !== undefined && { avatarUrl: String(avatarUrl) }),
        ...(contactPreference !== undefined && { contactPreference }),
        ...(smsNotificationsEnabled !== undefined && {
          smsNotificationsEnabled: Boolean(smsNotificationsEnabled),
        }),
      };
    });
    saveDatabase();

    const updated = db.users.find((u) => u.id === user.id)!;
    res.json({
      currentUser: sanitizePublicUser(updated, user.id),
      users: db.users.map((u) => sanitizePublicUser(u, user.id)),
    });
  });

  app.post('/api/addresses', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const { label, fullName, phone, street, building, city, state, postalCode, isDefault } = req.body || {};

    if (!fullName || !phone || !street || !city || !postalCode) {
      res.status(400).json({ error: 'Name, phone, street, city, and postal code are required.' });
      return;
    }

    const userAddresses = db.addresses.filter((a) => a.userId === user.id);
    const shouldBeDefault = Boolean(isDefault) || userAddresses.length === 0;

    if (shouldBeDefault) {
      db.addresses = db.addresses.map((a) => (a.userId === user.id ? { ...a, isDefault: false } : a));
    }

    const newAddr: SavedAddress = {
      id: `addr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: user.id,
      label: label || 'Dorm / Hostel',
      fullName: String(fullName).trim(),
      phone: String(phone).trim(),
      street: String(street).trim(),
      building: String(building || '').trim(),
      city: String(city).trim(),
      state: String(state || 'MH').trim(),
      postalCode: String(postalCode).trim(),
      isDefault: shouldBeDefault,
      createdAt: new Date().toISOString(),
    };

    db.addresses.push(newAddr);
    saveDatabase();

    res.status(201).json({
      addresses: db.addresses.filter((a) => a.userId === user.id),
    });
  });

  app.delete('/api/addresses/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const addrId = req.params.id;
    const target = db.addresses.find((a) => a.id === addrId && a.userId === user.id);
    if (!target) {
      res.status(404).json({ error: 'Address not found.' });
      return;
    }
    db.addresses = db.addresses.filter((a) => !(a.id === addrId && a.userId === user.id));
    saveDatabase();

    res.json({
      addresses: db.addresses.filter((a) => a.userId === user.id),
    });
  });

  // ============================================================================
  // 4. USER-SPECIFIC WISHLIST (STRICT ISOLATION BY req.user.id)
  // ============================================================================
  app.post('/api/wishlist/toggle', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const { itemId } = req.body || {};
    if (!itemId || typeof itemId !== 'string') {
      res.status(400).json({ error: 'Valid itemId is required.' });
      return;
    }

    const itemExists = db.items.some((i) => i.id === itemId);
    if (!itemExists) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const existingIdx = db.wishlists.findIndex(
      (w) => w.userId === user.id && w.itemId === itemId
    );

    let action: 'added' | 'removed' = 'added';
    if (existingIdx >= 0) {
      db.wishlists.splice(existingIdx, 1);
      action = 'removed';
    } else {
      db.wishlists.push({
        id: `wish_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        userId: user.id,
        itemId,
        addedAt: new Date().toISOString(),
        priority: 'Medium',
        notifyOnAvailable: true,
        note: '',
      });
      action = 'added';
    }

    saveDatabase();
    res.json({
      action,
      wishlist: db.wishlists.filter((w) => w.userId === user.id),
    });
  });

  app.put('/api/wishlist/:itemId', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const { itemId } = req.params;
    const { priority, notifyOnAvailable, note } = req.body || {};

    db.wishlists = db.wishlists.map((w) => {
      if (w.userId === user.id && w.itemId === itemId) {
        return {
          ...w,
          ...(priority !== undefined && { priority }),
          ...(notifyOnAvailable !== undefined && { notifyOnAvailable: Boolean(notifyOnAvailable) }),
          ...(note !== undefined && { note: String(note) }),
        };
      }
      return w;
    });

    saveDatabase();
    res.json({
      wishlist: db.wishlists.filter((w) => w.userId === user.id),
    });
  });

  app.delete('/api/wishlist', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    db.wishlists = db.wishlists.filter((w) => w.userId !== user.id);
    saveDatabase();
    res.json({ wishlist: [] });
  });

  // ============================================================================
  // 5. USER-SPECIFIC CART (STRICT ISOLATION BY req.user.id)
  // ============================================================================
  function calculateCartItemPricing(item: Item, quantity: number, startDate: string, endDate: string) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const rentalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const unitPricePerDay = item.isFree ? 0 : item.pricePerDay;
    const calc = calculateINRRentalBreakdown({
      dailyPrice: unitPricePerDay,
      weeklyPrice: item.pricePerWeek,
      monthlyPrice: item.pricePerMonth,
      securityDeposit: item.depositAmount || 0,
      days: rentalDays,
      quantity,
    });
    const rentalCost = calc.rentalSubtotal;
    const securityDeposit = calc.securityDepositTotal;
    const totalAmount = rentalCost + securityDeposit;
    return { rentalDays, unitPricePerDay, rentalCost, securityDeposit, totalAmount };
  }

  app.post('/api/cart', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const { itemId, quantity = 1, startDate, endDate } = req.body || {};

    const item = db.items.find((i) => i.id === itemId);
    if (!item) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    if (item.ownerId === user.id) {
      res.status(400).json({ error: 'You cannot add your own listing to your rental cart.' });
      return;
    }
    if (item.status !== 'available') {
      res.status(400).json({ error: 'This product is currently unavailable for rent.' });
      return;
    }

    const qty = Math.max(1, Math.min(item.quantityAvailable || 5, Number(quantity) || 1));
    const todayStr = new Date().toISOString().split('T')[0];
    const validStart = startDate && startDate >= todayStr ? startDate : todayStr;
    const defaultEnd = new Date(new Date(validStart).getTime() + 86400000 * 3).toISOString().split('T')[0];
    const validEnd = endDate && endDate >= validStart ? endDate : defaultEnd;

    const pricing = calculateCartItemPricing(item, qty, validStart, validEnd);
    if (pricing.rentalDays > item.maxRentalDays) {
      res.status(400).json({
        error: `Rental duration (${pricing.rentalDays} days) exceeds maximum allowed (${item.maxRentalDays} days).`,
      });
      return;
    }

    const existing = db.cartItems.find((c) => c.userId === user.id && c.itemId === itemId);
    if (existing) {
      const updatedQty = Math.min(item.quantityAvailable || 5, existing.quantity + qty);
      const updatedPricing = calculateCartItemPricing(item, updatedQty, validStart, validEnd);
      existing.quantity = updatedQty;
      existing.startDate = validStart;
      existing.endDate = validEnd;
      existing.rentalDays = updatedPricing.rentalDays;
      existing.unitPricePerDay = updatedPricing.unitPricePerDay;
      existing.rentalCost = updatedPricing.rentalCost;
      existing.securityDeposit = updatedPricing.securityDeposit;
      existing.totalAmount = updatedPricing.totalAmount;
    } else {
      db.cartItems.push({
        id: `cart_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        userId: user.id,
        itemId: item.id,
        quantity: qty,
        startDate: validStart,
        endDate: validEnd,
        ...pricing,
        createdAt: new Date().toISOString(),
      });
    }

    saveDatabase();
    res.json({
      cart: db.cartItems.filter((c) => c.userId === user.id),
    });
  });

  app.put('/api/cart/:cartItemId', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const { cartItemId } = req.params;
    const { quantity, startDate, endDate } = req.body || {};

    const target = db.cartItems.find((c) => c.id === cartItemId && c.userId === user.id);
    if (!target) {
      res.status(404).json({ error: 'Cart item not found.' });
      return;
    }

    const item = db.items.find((i) => i.id === target.itemId);
    if (!item) {
      res.status(404).json({ error: 'Product no longer exists.' });
      return;
    }

    const nextQty = quantity !== undefined ? Math.max(1, Math.min(item.quantityAvailable || 5, Number(quantity))) : target.quantity;
    const nextStart = startDate || target.startDate;
    const nextEnd = endDate || target.endDate;

    if (new Date(nextEnd).getTime() < new Date(nextStart).getTime()) {
      res.status(400).json({ error: 'End date cannot be before start date.' });
      return;
    }

    const pricing = calculateCartItemPricing(item, nextQty, nextStart, nextEnd);
    if (pricing.rentalDays > item.maxRentalDays) {
      res.status(400).json({
        error: `Maximum rental duration for "${item.title}" is ${item.maxRentalDays} days.`,
      });
      return;
    }

    target.quantity = nextQty;
    target.startDate = nextStart;
    target.endDate = nextEnd;
    target.rentalDays = pricing.rentalDays;
    target.unitPricePerDay = pricing.unitPricePerDay;
    target.rentalCost = pricing.rentalCost;
    target.securityDeposit = pricing.securityDeposit;
    target.totalAmount = pricing.totalAmount;

    saveDatabase();
    res.json({
      cart: db.cartItems.filter((c) => c.userId === user.id),
    });
  });

  app.delete('/api/cart/:cartItemId', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const { cartItemId } = req.params;
    db.cartItems = db.cartItems.filter((c) => !(c.id === cartItemId && c.userId === user.id));
    saveDatabase();
    res.json({
      cart: db.cartItems.filter((c) => c.userId === user.id),
    });
  });

  app.delete('/api/cart', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    db.cartItems = db.cartItems.filter((c) => c.userId !== user.id);
    saveDatabase();
    res.json({ cart: [] });
  });

  // ============================================================================
  // 6. CHECKOUT & ORDER MANAGEMENT (USER-ISOLATED)
  // ============================================================================
  app.post('/api/checkout', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryMethod,
      shippingAddress,
      paymentMethod,
      notes,
    } = req.body || {};

    const userCart = db.cartItems.filter((c) => c.userId === user.id);
    if (userCart.length === 0) {
      res.status(400).json({ error: 'Your cart is empty. Add items before checking out.' });
      return;
    }

    if (!customerName || !customerEmail || !customerPhone) {
      res.status(400).json({ error: 'Customer name, email, and phone number are required.' });
      return;
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode) {
      res.status(400).json({ error: 'Valid delivery or campus pickup address is required.' });
      return;
    }

    // Validate all items in cart are still available
    for (const cItem of userCart) {
      const product = db.items.find((i) => i.id === cItem.itemId);
      if (!product || product.status !== 'available') {
        res.status(400).json({
          error: `"${product?.title || 'An item'}" in your cart is no longer available.`,
        });
        return;
      }
    }

    const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();

    const orderItems: OrderItem[] = userCart.map((cItem, idx) => {
      const product = db.items.find((i) => i.id === cItem.itemId)!;
      return {
        id: `${orderId}-ITEM-${idx + 1}`,
        orderId,
        productId: product.id,
        sellerId: product.ownerId,
        productTitle: product.title,
        productPhoto: isValidImageUrl(product.photos?.[0])
          ? product.photos[0]
          : getFallbackProductImage(product.title, product.category, product.id),
        category: product.category,
        quantity: cItem.quantity,
        startDate: cItem.startDate,
        endDate: cItem.endDate,
        rentalDays: cItem.rentalDays,
        dailyRate: cItem.unitPricePerDay,
        rentalAmount: cItem.rentalCost,
        securityDeposit: cItem.securityDeposit,
        lineTotal: cItem.totalAmount,
        itemStatus: 'Confirmed',
      };
    });

    const subtotalRental = Math.round(orderItems.reduce((sum, i) => sum + i.rentalAmount, 0));
    const securityDepositTotal = Math.round(orderItems.reduce((sum, i) => sum + i.securityDeposit, 0));
    const deliveryCharge = deliveryMethod === 'campus_delivery' ? 150 : 0;
    const serviceFee = (subtotalRental > 0 ? Math.max(50, Math.round(subtotalRental * 0.04)) : 0) + deliveryCharge;
    const taxAmount = subtotalRental > 0 ? Math.round(subtotalRental * 0.072) : 0;
    const grandTotal = subtotalRental + securityDepositTotal + serviceFee + taxAmount;

    const paymentStatus = paymentMethod === 'campus_escrow_cod' ? 'cod_pending' : 'paid_test_mode';
    const paymentReference =
      paymentMethod === 'campus_escrow_cod'
        ? `INR-COD-${Date.now().toString().slice(-6)}`
        : `INR-PAY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const newOrder: Order = {
      id: orderId,
      userId: user.id,
      items: orderItems,
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim(),
      customerPhone: String(customerPhone).trim(),
      deliveryMethod: deliveryMethod || 'campus_pickup',
      shippingAddress: {
        label: String(shippingAddress.label || 'Campus Address'),
        street: String(shippingAddress.street).trim(),
        building: String(shippingAddress.building || '').trim(),
        city: String(shippingAddress.city).trim(),
        state: String(shippingAddress.state || 'MH').trim(),
        postalCode: String(shippingAddress.postalCode).trim(),
      },
      paymentMethod: paymentMethod || 'test_card',
      paymentStatus,
      paymentReference,
      orderStatus: 'Confirmed',
      subtotalRental,
      securityDepositTotal,
      serviceFee,
      taxAmount,
      grandTotal,
      notes: notes ? String(notes).trim() : '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.orders.unshift(newOrder);

    // Create corresponding Booking records for each item so owners can manage rental lifecycle
    for (const oItem of orderItems) {
      const bookingId = `booking_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const newBooking: Booking = {
        id: bookingId,
        orderId: newOrder.id,
        itemId: oItem.productId,
        borrowerId: user.id,
        ownerId: oItem.sellerId,
        quantity: oItem.quantity,
        startDate: oItem.startDate,
        endDate: oItem.endDate,
        totalDays: oItem.rentalDays,
        dailyRate: oItem.dailyRate,
        depositAmount: oItem.securityDeposit,
        totalPrice: oItem.lineTotal,
        status: 'accepted',
        orderStatus: 'Confirmed',
        paymentStatus,
        message: notes || `Order ${newOrder.id} confirmed via Checkout.`,
        depositStatus: 'held',
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      db.bookings.unshift(newBooking);

      // Notify product owner
      db.notifications.unshift({
        id: `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        userId: oItem.sellerId,
        type: 'order_placed',
        title: `New Rental Order (${newOrder.id})`,
        message: `${user.fullName} rented "${oItem.productTitle}" (${oItem.startDate} to ${oItem.endDate}).`,
        linkId: newOrder.id,
        targetType: 'order',
        isRead: false,
        createdAt: nowIso,
      });
    }

    // Notify buyer
    db.notifications.unshift({
      id: `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: user.id,
      type: 'order_placed',
      title: `Order ${newOrder.id} Confirmed`,
      message: `Your rental order of ${orderItems.length} item(s) totaling ${formatINR(grandTotal)} (INR) is confirmed.`,
      linkId: newOrder.id,
      targetType: 'order',
      isRead: false,
      createdAt: nowIso,
    });

    // Clear ONLY this user's cart
    db.cartItems = db.cartItems.filter((c) => c.userId !== user.id);
    saveDatabase();

    res.status(201).json({
      order: newOrder,
      ...getIsolatedUserState(user),
      items: db.items,
    });
  });

  app.put('/api/orders/:orderId/status', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const { orderId } = req.params;
    const { status } = req.body as { status: OrderStatus };

    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const isBuyer = order.userId === user.id;
    const isSeller = order.items.some((i) => i.sellerId === user.id);
    const isAdmin = Boolean(user.isAdmin || user.role === 'admin');

    if (!isBuyer && !isSeller && !isAdmin) {
      res.status(403).json({ error: 'Not authorized to modify this order.' });
      return;
    }

    if (isBuyer && !isSeller && !isAdmin) {
      // Buyers can only cancel Pending/Confirmed orders or mark Returned
      if (status !== 'Cancelled' && status !== 'Returned') {
        res.status(403).json({ error: 'Borrowers can only cancel eligible orders or initiate return.' });
        return;
      }
      if (status === 'Cancelled' && order.orderStatus !== 'Pending' && order.orderStatus !== 'Confirmed') {
        res.status(400).json({ error: 'Cannot cancel an order after equipment has already been prepared or rented.' });
        return;
      }
    }

    const nowIso = new Date().toISOString();
    order.orderStatus = status;
    order.updatedAt = nowIso;
    order.items = order.items.map((item) => ({ ...item, itemStatus: status }));

    if (status === 'Cancelled' || status === 'Completed') {
      if (order.paymentStatus === 'paid_test_mode' && status === 'Cancelled') {
        order.paymentStatus = 'refunded';
      }
    }

    // Sync related bookings & item statuses
    const bookingStatusMap: Record<OrderStatus, Booking['status']> = {
      Pending: 'pending',
      Confirmed: 'accepted',
      Preparing: 'accepted',
      Rented: 'picked_up',
      Returned: 'returned',
      Completed: 'returned',
      Cancelled: 'cancelled',
    };

    db.bookings = db.bookings.map((b) => {
      if (b.orderId === order.id) {
        return {
          ...b,
          status: bookingStatusMap[status] || b.status,
          orderStatus: status,
          depositStatus: status === 'Completed' || status === 'Returned' || status === 'Cancelled' ? 'refunded' : b.depositStatus,
          updatedAt: nowIso,
        };
      }
      return b;
    });

    for (const oItem of order.items) {
      db.items = db.items.map((prod) => {
        if (prod.id !== oItem.productId) return prod;
        if (status === 'Rented') return { ...prod, status: 'rented', updatedAt: nowIso };
        if (status === 'Returned' || status === 'Completed' || status === 'Cancelled') {
          return { ...prod, status: 'available', updatedAt: nowIso };
        }
        return prod;
      });
    }

    // Notify buyer
    db.notifications.unshift({
      id: `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: order.userId,
      type: 'order_status',
      title: `Order ${order.id} Status: ${status}`,
      message: `Your rental order ${order.id} has been updated to "${status}".`,
      linkId: order.id,
      targetType: 'order',
      isRead: false,
      createdAt: nowIso,
    });

    saveDatabase();
    res.json({
      items: db.items,
      ...getIsolatedUserState(user),
    });
  });

  // ============================================================================
  // 7. PRODUCT LISTINGS & IMAGE UPLOAD STORAGE
  // ============================================================================
  app.post('/api/upload-image', requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const { fileName, mimeType, dataUrl } = req.body || {};
      if (!dataUrl || typeof dataUrl !== 'string') {
        res.status(400).json({ error: 'Product image is required.' });
        return;
      }

      const match = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
      if (!match) {
        res.status(400).json({
          error: 'Invalid image format. Only JPG, JPEG, PNG, and WEBP image files are allowed.',
        });
        return;
      }

      const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      if (buffer.length === 0) {
        res.status(400).json({ error: 'Uploaded image file is empty.' });
        return;
      }
      if (buffer.length > 10 * 1024 * 1024) {
        res.status(400).json({ error: 'Image size must be 10 MB or smaller.' });
        return;
      }

      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }

      const safeBase = String(fileName || 'product')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 32);
      const uniqueName = `${safeBase}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, uniqueName);
      fs.writeFileSync(filePath, buffer);

      // Also copy to dist/images/uploads if running a production build
      const distUploadsDir = path.join(__dirname, 'dist', 'images', 'uploads');
      if (fs.existsSync(path.join(__dirname, 'dist'))) {
        fs.mkdirSync(distUploadsDir, { recursive: true });
        fs.writeFileSync(path.join(distUploadsDir, uniqueName), buffer);
      }

      const publicUrl = `/images/uploads/${uniqueName}`;
      res.status(201).json({
        success: true,
        imageUrl: publicUrl,
        mimeType: mimeType || `image/${ext}`,
      });
    } catch (err) {
      console.error('Image upload error:', err);
      res.status(500).json({ error: 'Failed to store uploaded product image.' });
    }
  });

  app.post('/api/items', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const itemData = req.body || {};

    if (!itemData.title || !itemData.description || !itemData.category) {
      res.status(400).json({ error: 'Title, category, and description are required.' });
      return;
    }

    const validPhotos = Array.isArray(itemData.photos)
      ? itemData.photos.filter((p: unknown) => typeof p === 'string' && isValidImageUrl(p))
      : [];

    if (validPhotos.length === 0) {
      res.status(400).json({ error: 'Product image is required.' });
      return;
    }

    const priceDay = itemData.isFree ? 0 : Math.max(0, Number(itemData.pricePerDay) || 0);
    const priceWeek = itemData.isFree ? 0 : Math.max(0, Number(itemData.pricePerWeek) || Number((priceDay * 5.5).toFixed(2)));
    const priceMonth = itemData.isFree ? 0 : Math.max(0, Number(itemData.pricePerMonth) || Number((priceDay * 20).toFixed(2)));

    const nowIso = new Date().toISOString();
    const newItem: Item = {
      id: `item_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      ownerId: user.id,
      title: String(itemData.title).trim(),
      category: itemData.category,
      description: String(itemData.description).trim(),
      photos: validPhotos,
      condition: itemData.condition || 'Like New',
      pricePerDay: priceDay,
      pricePerWeek: priceWeek,
      pricePerMonth: priceMonth,
      isFree: Boolean(itemData.isFree),
      depositAmount: Math.max(0, Number(itemData.depositAmount) || 0),
      maxRentalDays: Math.max(1, Number(itemData.maxRentalDays) || 30),
      quantityAvailable: Math.max(1, Number(itemData.quantityAvailable) || 1),
      pickupLocation: String(itemData.pickupLocation || 'Central Library Foyer').trim(),
      campusSpotPreset: itemData.campusSpotPreset || itemData.pickupLocation || 'Central Library Foyer',
      isSeniorsSale: Boolean(itemData.isSeniorsSale),
      status: 'available',
      approvalStatus: 'approved',
      createdAt: nowIso,
      updatedAt: nowIso,
      replacementCostEstimate: Math.max(0, Number(itemData.replacementCostEstimate) || 5000),
      viewsCount: 1,
    };

    db.items.unshift(newItem);
    const isAdminUser = Boolean(user.isAdmin || user.role === 'admin' || user.role === 'super_admin');
    if (isAdminUser) {
      recordAdminActivity(user, 'Added new product listing', 'product', newItem.title, newItem.id);
    }
    saveDatabase();

    res.status(201).json({
      item: newItem,
      items: db.items,
      adminActivityLogs: isAdminUser ? db.adminActivityLogs : [],
    });
  });

  app.put('/api/items/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const itemId = req.params.id;
    const updates = req.body || {};

    const existing = db.items.find((i) => i.id === itemId);
    if (!existing) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }

    const isAdminUser = Boolean(user.isAdmin || user.role === 'admin' || user.role === 'super_admin');
    if (existing.ownerId !== user.id && !isAdminUser) {
      res.status(403).json({ error: 'You can only edit your own listings.' });
      return;
    }

    if (updates.photos !== undefined) {
      const validPhotos = Array.isArray(updates.photos)
        ? updates.photos.filter((p: unknown) => typeof p === 'string' && isValidImageUrl(p))
        : [];
      if (validPhotos.length === 0) {
        res.status(400).json({ error: 'Product image is required.' });
        return;
      }
      updates.photos = validPhotos;
    }

    db.items = db.items.map((item) => {
      if (item.id !== itemId) return item;
      return ensureValidItemPhotos({
        ...item,
        ...updates,
        ownerId: isAdminUser && updates.ownerId ? updates.ownerId : item.ownerId,
        id: item.id,
        updatedAt: new Date().toISOString(),
      });
    });

    if (isAdminUser) {
      const actionDesc =
        updates.status === 'hidden'
          ? 'Hidden/unpublished product listing'
          : updates.status === 'available' && existing.status === 'hidden'
          ? 'Restored product listing'
          : 'Updated product listing';
      recordAdminActivity(user, actionDesc, 'product', existing.title, existing.id);
    }

    saveDatabase();
    res.json({
      items: db.items,
      adminActivityLogs: isAdminUser ? db.adminActivityLogs : [],
    });
  });

  app.delete('/api/items/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const itemId = req.params.id;

    const existing = db.items.find((i) => i.id === itemId);
    if (!existing) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }

    const isAdminUser = Boolean(user.isAdmin || user.role === 'admin' || user.role === 'super_admin');
    if (existing.ownerId !== user.id && !isAdminUser) {
      res.status(403).json({ error: 'You can only delete your own listings.' });
      return;
    }

    const hasActiveBooking = db.bookings.some(
      (b) => b.itemId === itemId && (b.status === 'pending' || b.status === 'accepted' || b.status === 'picked_up')
    );
    if (hasActiveBooking && !isAdminUser) {
      res.status(400).json({ error: 'Cannot delete listing with active bookings. Pause the listing instead.' });
      return;
    }

    db.items = db.items.filter((i) => i.id !== itemId);
    db.wishlists = db.wishlists.filter((w) => w.itemId !== itemId);
    db.cartItems = db.cartItems.filter((c) => c.itemId !== itemId);

    if (isAdminUser) {
      recordAdminActivity(user, 'Permanently deleted product listing', 'product', existing.title, itemId);
    }
    saveDatabase();

    res.json({
      items: db.items,
      ...getIsolatedUserState(user),
    });
  });

  // ============================================================================
  // 8. BOOKINGS / DIRECT RENTAL REQUESTS, CALENDAR & REVIEWS
  // ============================================================================
  const hasBookingDateConflict = (
    itemId: string,
    startStr: string,
    endStr: string,
    excludeBookingId?: string
  ): Booking | undefined => {
    const reqStart = new Date(startStr).getTime();
    const reqEnd = new Date(endStr).getTime();
    if (isNaN(reqStart) || isNaN(reqEnd)) return undefined;

    return db.bookings.find((b) => {
      if (b.itemId !== itemId) return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (b.status !== 'accepted' && b.status !== 'picked_up') return false;
      const bStart = new Date(b.startDate).getTime();
      const bEnd = new Date(b.endDate).getTime();
      return reqStart <= bEnd && reqEnd >= bStart;
    });
  };

  app.get('/api/items/:id/calendar', (req: Request, res: Response) => {
    const itemId = req.params.id;
    const itemBookings = db.bookings
      .filter(
        (b) =>
          b.itemId === itemId &&
          (b.status === 'accepted' || b.status === 'picked_up' || b.status === 'pending')
      )
      .map((b) => ({
        id: b.id,
        itemId: b.itemId,
        startDate: b.startDate,
        endDate: b.endDate,
        status: b.status,
      }));
    res.json({ bookings: itemBookings });
  });

  app.post('/api/bookings', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const {
      itemId,
      startDate,
      endDate,
      message,
      quantity = 1,
      pickupOption = 'campus_pickup',
      contactPreference,
      sharePhoneWithOwner,
    } = req.body || {};

    const item = db.items.find((i) => i.id === itemId);
    if (!item) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    if (item.ownerId === user.id) {
      res.status(400).json({ error: 'You cannot rent your own product.' });
      return;
    }
    if (item.status === 'paused' || item.status === 'hidden') {
      res.status(400).json({ error: 'This listing is currently unavailable for booking.' });
      return;
    }

    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Both rental start date and return date are required.' });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      res.status(400).json({ error: 'Return date must be on or after the start date.' });
      return;
    }

    // Check overlapping reserved dates
    const conflictingBooking = hasBookingDateConflict(item.id, startDate, endDate);
    if (conflictingBooking) {
      res.status(409).json({
        error: `Selected dates (${startDate} to ${endDate}) overlap with an already confirmed reservation (${conflictingBooking.startDate} to ${conflictingBooking.endDate}). Please choose available dates on the calendar.`,
      });
      return;
    }

    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    if (days > item.maxRentalDays) {
      res.status(400).json({ error: `Rental duration exceeds maximum of ${item.maxRentalDays} days.` });
      return;
    }

    const qty = Math.max(1, Number(quantity) || 1);
    const breakdown = calculateINRRentalBreakdown({
      dailyPrice: item.isFree ? 0 : item.pricePerDay,
      weeklyPrice: item.isFree ? 0 : item.pricePerWeek,
      monthlyPrice: item.isFree ? 0 : item.pricePerMonth,
      days,
      quantity: qty,
      securityDeposit: item.depositAmount || 0,
    });

    const dailyRate = item.isFree ? 0 : item.pricePerDay;
    const rentalAmount = breakdown.rentalSubtotal;
    const depositAmount = breakdown.securityDepositTotal;
    const totalPrice = rentalAmount + depositAmount + (pickupOption === 'campus_delivery' ? 150 : 0);
    const nowIso = new Date().toISOString();
    const effectivePref: ContactPreference =
      contactPreference || user.contactPreference || 'share_phone_after_acceptance';

    const bookingId = `booking_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const convId = `conv_${bookingId}`;

    const newBooking: Booking = {
      id: bookingId,
      itemId: item.id,
      borrowerId: user.id,
      ownerId: item.ownerId,
      quantity: qty,
      startDate,
      endDate,
      totalDays: days,
      dailyRate,
      rentalAmount,
      depositAmount,
      totalPrice,
      pickupOption,
      contactPreference: effectivePref,
      sharePhoneWithOwner:
        sharePhoneWithOwner !== undefined
          ? Boolean(sharePhoneWithOwner)
          : effectivePref !== 'in_app_only',
      conversationId: convId,
      status: 'pending',
      orderStatus: 'Pending',
      message: message ? String(message).trim() : `Hi! I would like to rent "${item.title}" from ${startDate} to ${endDate}.`,
      depositStatus: 'held',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.bookings.unshift(newBooking);

    // Create dedicated conversation thread between renter and owner
    const initialMsgText = newBooking.message || `Booking request for "${item.title}" (${startDate} to ${endDate}).`;
    const newConversation: Conversation = {
      id: convId,
      productId: item.id,
      bookingId: newBooking.id,
      renterId: user.id,
      ownerId: item.ownerId,
      status: 'active',
      lastMessagePreview: initialMsgText,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    db.conversations.unshift(newConversation);

    db.messages.push({
      id: `msg_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      conversationId: convId,
      bookingId: newBooking.id,
      itemId: item.id,
      senderId: user.id,
      recipientId: item.ownerId,
      content: `Booking Request for "${item.title}" (${startDate} → ${endDate}, ${days} day${days > 1 ? 's' : ''}, Total: ${formatINR(totalPrice)}): ${initialMsgText}`,
      createdAt: nowIso,
      isRead: false,
    });

    // Notify product owner immediately with full details
    db.notifications.unshift({
      id: `notif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId: item.ownerId,
      type: 'booking_request',
      title: `New Booking Request: ${item.title}`,
      message: `${user.fullName} requested "${item.title}" from ${startDate} to ${endDate} (${days} days • ${formatINR(totalPrice)}). Message: "${initialMsgText.slice(0, 90)}"`,
      linkId: newBooking.id,
      targetType: 'booking',
      isRead: false,
      createdAt: nowIso,
    });

    saveDatabase();
    res.status(201).json({
      booking: newBooking,
      conversation: newConversation,
      users: db.users.map((u) => sanitizePublicUser(u, user.id)),
      ...getIsolatedUserState(user),
    });
  });

  app.put('/api/bookings/:id/status', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const bookingId = req.params.id;
    const { status, options } = req.body || {};

    const booking = db.bookings.find((b) => b.id === bookingId);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    const isAdminUser = Boolean(user.isAdmin || user.role === 'admin' || user.role === 'super_admin');
    if (booking.borrowerId !== user.id && booking.ownerId !== user.id && !isAdminUser) {
      res.status(403).json({ error: 'Not authorized to update this booking.' });
      return;
    }

    // Only owner or admin can accept or decline a pending booking request
    if ((status === 'accepted' || status === 'declined') && booking.ownerId !== user.id && !isAdminUser) {
      res.status(403).json({ error: 'Only the product owner can accept or reject a booking request.' });
      return;
    }

    const item = db.items.find((i) => i.id === booking.itemId);

    // If accepting, verify dates don't conflict with another already-accepted booking
    if (status === 'accepted') {
      const conflict = hasBookingDateConflict(booking.itemId, booking.startDate, booking.endDate, booking.id);
      if (conflict) {
        res.status(409).json({
          error: `Cannot accept: dates (${booking.startDate} to ${booking.endDate}) already conflict with another confirmed booking.`,
        });
        return;
      }
    }

    const nowIso = new Date().toISOString();
    booking.status = status;
    booking.updatedAt = nowIso;
    if (options?.handoverNotes !== undefined) booking.handoverNotes = options.handoverNotes;
    if (options?.returnNotes !== undefined) booking.returnNotes = options.returnNotes;
    if (options?.depositStatus !== undefined) booking.depositStatus = options.depositStatus;
    if (options?.damageReported !== undefined) booking.damageReported = options.damageReported;
    if (options?.damageDetails !== undefined) booking.damageDetails = options.damageDetails;
    if (options?.withheldAmount !== undefined) booking.withheldAmount = options.withheldAmount;

    if (status === 'declined' || status === 'cancelled' || status === 'returned') {
      if (!options?.depositStatus) {
        booking.depositStatus = 'refunded';
      }
    }

    // Sync item status
    if (item) {
      if (status === 'picked_up') item.status = 'rented';
      else if (status === 'returned' || status === 'cancelled' || status === 'declined') item.status = 'available';
      item.updatedAt = nowIso;
    }

    // Ensure a Conversation thread exists for this booking
    const foundConv = db.conversations.find((c) => c.bookingId === booking.id);
    const conv: Conversation =
      foundConv ||
      (() => {
        const created: Conversation = {
          id: booking.conversationId || `conv_${booking.id}`,
          productId: booking.itemId,
          bookingId: booking.id,
          renterId: booking.borrowerId,
          ownerId: booking.ownerId,
          status: 'active',
          createdAt: booking.createdAt,
          updatedAt: nowIso,
        };
        booking.conversationId = created.id;
        db.conversations.unshift(created);
        return created;
      })();

    // If Owner accepts a direct booking request that doesn't yet have an Order record, create one so it appears in Orders & Rental History
    if (status === 'accepted' && !booking.orderId && item) {
      const borrower = db.users.find((u) => u.id === booking.borrowerId);
      const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const rentalAmt = booking.rentalAmount ?? Math.max(0, booking.totalPrice - booking.depositAmount);
      const createdOrder: Order = {
        id: orderId,
        userId: booking.borrowerId,
        items: [
          {
            id: `${orderId}-ITEM-1`,
            orderId,
            productId: item.id,
            sellerId: item.ownerId,
            productTitle: item.title,
            productPhoto: isValidImageUrl(item.photos?.[0])
              ? item.photos[0]
              : getFallbackProductImage(item.title, item.category, item.id),
            category: item.category,
            quantity: booking.quantity || 1,
            startDate: booking.startDate,
            endDate: booking.endDate,
            rentalDays: booking.totalDays,
            dailyRate: booking.dailyRate,
            rentalAmount: rentalAmt,
            securityDeposit: booking.depositAmount,
            lineTotal: booking.totalPrice,
            itemStatus: 'Confirmed',
          },
        ],
        customerName: borrower?.fullName || 'Campus Renter',
        customerEmail: borrower?.email || '',
        customerPhone: borrower?.phone || 'Protected via In-App Chat',
        deliveryMethod:
          booking.pickupOption === 'campus_delivery' || booking.pickupOption === 'doorstep_delivery'
            ? 'doorstep_delivery'
            : 'campus_pickup',
        shippingAddress: {
          label: item.pickupLocation || 'Campus Pickup Spot',
          street: item.pickupLocation || 'Central Library Foyer',
          building: borrower?.campus || 'Main North Campus',
          city: 'Mumbai',
          state: 'MH',
          postalCode: '400076',
        },
        paymentMethod: 'campus_escrow_cod',
        paymentStatus: 'paid_test_mode',
        paymentReference: `INR-BK-${Date.now().toString().slice(-6)}`,
        orderStatus: 'Confirmed',
        subtotalRental: rentalAmt,
        securityDepositTotal: booking.depositAmount,
        serviceFee: 0,
        taxAmount: 0,
        grandTotal: booking.totalPrice,
        notes: booking.message || 'Confirmed via Direct Booking Calendar',
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      booking.orderId = orderId;
      booking.orderStatus = 'Confirmed';
      db.orders.unshift(createdOrder);
    }

    // Sync linked Order if any
    if (booking.orderId) {
      const orderStatusMap: Record<Booking['status'], OrderStatus> = {
        pending: 'Pending',
        accepted: 'Confirmed',
        picked_up: 'Rented',
        returned: 'Completed',
        declined: 'Cancelled',
        cancelled: 'Cancelled',
        expired: 'Cancelled',
      };
      const nextOrderStatus = orderStatusMap[status as Booking['status']];
      if (nextOrderStatus) {
        booking.orderStatus = nextOrderStatus;
        db.orders = db.orders.map((o) =>
          o.id === booking.orderId ? { ...o, orderStatus: nextOrderStatus, updatedAt: nowIso } : o
        );
      }
    }

    // Send tailored notification and system message in conversation
    const targetUserId = user.id === booking.ownerId ? booking.borrowerId : booking.ownerId;
    let notifTitle = `Rental Status Updated: ${String(status).replace('_', ' ')}`;
    let notifMessage = `Rental for "${item?.title || 'equipment'}" is now ${String(status).replace('_', ' ')}.`;
    let chatNotice = '';

    if (status === 'accepted') {
      notifTitle = `Booking Accepted: ${item?.title || 'Product'}`;
      notifMessage = `Your rental request for "${item?.title || 'Product'}" from ${booking.startDate} to ${booking.endDate} has been accepted! Dates are now reserved.`;
      chatNotice = `Booking Accepted! Dates ${booking.startDate} to ${booking.endDate} are now reserved for "${item?.title}". Pickup location: ${item?.pickupLocation || 'Campus Hub'}.`;
    } else if (status === 'declined') {
      notifTitle = `Booking Declined: ${item?.title || 'Product'}`;
      notifMessage = `Your rental request for "${item?.title || 'Product'}" (${booking.startDate} to ${booking.endDate}) was declined by the owner.${options?.returnNotes ? ` Reason: ${options.returnNotes}` : ''}`;
      chatNotice = `Booking request for ${booking.startDate} to ${booking.endDate} was declined.${options?.returnNotes ? ` Note: ${options.returnNotes}` : ''}`;
    } else if (status === 'picked_up') {
      notifTitle = `Rental Picked Up: ${item?.title || 'Product'}`;
      notifMessage = `"${item?.title}" has been marked as picked up. Return due on ${booking.endDate}.`;
      chatNotice = `Item handed over and marked as Picked Up. Scheduled return date: ${booking.endDate}.`;
    } else if (status === 'returned') {
      notifTitle = `Product Returned & Deposit Released`;
      notifMessage = `"${item?.title}" has been returned and your security deposit (${formatINR(booking.depositAmount)}) has been settled.`;
      chatNotice = `Product returned! Security deposit (${formatINR(booking.depositAmount)}) settled. Thank you for using Rent & Reuse!`;
    }

    if (chatNotice) {
      conv.lastMessagePreview = chatNotice;
      conv.updatedAt = nowIso;
      db.messages.push({
        id: `msg_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        conversationId: conv.id,
        bookingId: booking.id,
        itemId: booking.itemId,
        senderId: user.id,
        recipientId: targetUserId,
        content: chatNotice,
        createdAt: nowIso,
        isRead: false,
      });
    }

    db.notifications.unshift({
      id: `notif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId: targetUserId,
      type: 'booking_status',
      title: notifTitle,
      message: notifMessage,
      linkId: booking.id,
      targetType: 'booking',
      isRead: false,
      createdAt: nowIso,
    });

    if (isAdminUser && user.id !== booking.ownerId && user.id !== booking.borrowerId) {
      recordAdminActivity(
        user,
        `Updated booking status to ${status}`,
        'booking',
        item?.title || booking.id,
        booking.id
      );
    }

    saveDatabase();
    res.json({
      items: db.items,
      users: db.users.map((u) => sanitizePublicUser(u, user.id)),
      ...getIsolatedUserState(user),
    });
  });

  app.post('/api/reviews', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const reviewData = req.body || {};

    const newRev: Review = {
      ...reviewData,
      id: `rev_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      reviewerId: user.id,
      rating: Math.max(1, Math.min(5, Number(reviewData.rating) || 5)),
      comment: String(reviewData.comment || '').trim(),
      helpfulCount: 0,
      helpfulVoterIds: [],
      createdAt: new Date().toISOString(),
    };

    db.reviews.unshift(newRev);
    saveDatabase();

    res.status(201).json({
      reviews: db.reviews,
      users: db.users.map((u) => sanitizePublicUser(u, user.id)),
    });
  });

  app.delete('/api/reviews/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const revId = req.params.id;
    const rev = db.reviews.find((r) => r.id === revId);
    db.reviews = db.reviews.filter((r) => r.id !== revId);
    recordAdminActivity(req.user!, 'Deleted review', 'review', rev?.comment?.slice(0, 40) || revId, revId);
    saveDatabase();
    res.json({ reviews: db.reviews, adminActivityLogs: db.adminActivityLogs });
  });

  // ============================================================================
  // 9. MESSAGES, CONVERSATIONS, NOTIFICATIONS, WANTED BOARD & REPORTS
  // ============================================================================
  app.post('/api/messages', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const { recipientId, content, bookingId, itemId, conversationId } = req.body || {};
    if (!recipientId || !content || !String(content).trim()) {
      res.status(400).json({ error: 'Recipient and message content are required.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const trimmedContent = String(content).trim();

    // Find or create a conversation thread
    const existingConv = db.conversations.find(
      (c) =>
        (conversationId && c.id === conversationId) ||
        (bookingId && c.bookingId === bookingId) ||
        (itemId &&
          c.productId === itemId &&
          ((c.renterId === user.id && c.ownerId === recipientId) ||
            (c.ownerId === user.id && c.renterId === recipientId)))
    );

    let conv: Conversation;
    if (!existingConv) {
      const item = itemId ? db.items.find((i) => i.id === itemId) : undefined;
      const ownerId = item ? item.ownerId : recipientId;
      const renterId = ownerId === user.id ? recipientId : user.id;
      conv = {
        id: conversationId || `conv_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        productId: itemId || '',
        bookingId,
        renterId,
        ownerId,
        status: 'active',
        lastMessagePreview: trimmedContent,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      db.conversations.unshift(conv);
    } else {
      conv = existingConv;
      conv.lastMessagePreview = trimmedContent;
      conv.updatedAt = nowIso;
    }

    const newMsg: Message = {
      id: `msg_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      conversationId: conv.id,
      senderId: user.id,
      recipientId,
      bookingId: bookingId || conv.bookingId,
      itemId: itemId || conv.productId,
      content: trimmedContent,
      createdAt: nowIso,
      isRead: false,
    };

    db.messages.push(newMsg);
    db.notifications.unshift({
      id: `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: recipientId,
      type: 'new_message',
      title: `New Message from ${user.fullName}`,
      message: trimmedContent.slice(0, 90),
      linkId: bookingId || conv.bookingId || itemId || conv.id,
      targetType: 'message',
      isRead: false,
      createdAt: nowIso,
    });

    saveDatabase();
    res.status(201).json({
      ...getIsolatedUserState(user),
    });
  });

  app.post('/api/notifications/read', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    db.notifications = db.notifications.map((n) =>
      n.userId === user.id ? { ...n, isRead: true } : n
    );
    saveDatabase();
    res.json({
      notifications: db.notifications.filter((n) => n.userId === user.id),
    });
  });

  app.post('/api/wanted', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const postData = req.body || {};
    const newPost: WantedPost = {
      id: `wanted_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: user.id,
      title: String(postData.title || '').trim(),
      category: postData.category || 'Other',
      description: String(postData.description || '').trim(),
      maxBudgetPerDay: Number(postData.maxBudgetPerDay) || 0,
      neededBy: postData.neededBy || new Date().toISOString().split('T')[0],
      durationNeededDays: Number(postData.durationNeededDays) || 3,
      campusLocation: String(postData.campusLocation || 'Main Campus').trim(),
      status: 'open',
      offersCount: 0,
      createdAt: new Date().toISOString(),
    };
    db.wantedPosts.unshift(newPost);
    saveDatabase();
    res.status(201).json({ wantedPosts: db.wantedPosts });
  });

  app.post('/api/reports', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const { reportedUserId, reportedItemId, reason, details } = req.body || {};
    const newRep: Report = {
      id: `rep_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      reporterId: user.id,
      reportedUserId,
      reportedItemId,
      reason: reason || 'other',
      details: String(details || '').trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    db.reports.unshift(newRep);
    saveDatabase();
    res.status(201).json({
      reports: user.isAdmin ? db.reports : db.reports.filter((r) => r.reporterId === user.id),
    });
  });

  // ============================================================================
  // 10. ADMIN PORTAL & RBAC ROUTES
  // ============================================================================
  app.put('/api/reports/:id/moderate', requireAdmin, (req: AuthedRequest, res: Response) => {
    const reportId = req.params.id;
    const { action, removeListing } = req.body || {};
    const target = db.reports.find((r) => r.id === reportId);
    if (!target) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }
    target.status = action === 'resolve' ? 'resolved' : 'dismissed';
    if (action === 'resolve' && removeListing && target.reportedItemId) {
      const removedItem = db.items.find((i) => i.id === target.reportedItemId);
      db.items = db.items.filter((i) => i.id !== target.reportedItemId);
      recordAdminActivity(
        req.user!,
        'Removed reported product listing',
        'product',
        removedItem?.title || target.reportedItemId,
        target.reportedItemId
      );
    } else {
      recordAdminActivity(
        req.user!,
        `Moderated report (${target.status})`,
        'system',
        target.reason,
        target.id
      );
    }
    saveDatabase();
    res.json({
      reports: db.reports,
      items: db.items,
      adminActivityLogs: db.adminActivityLogs,
    });
  });

  app.put('/api/admin/users/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const adminUser = req.user!;
    const targetId = req.params.id;
    const updates = req.body || {};
    const targetUser = db.users.find((u) => u.id === targetId);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    // Prevent removing the last administrator
    if (updates.isAdmin === false || (updates.role && updates.role !== 'admin' && updates.role !== 'super_admin')) {
      const totalAdmins = db.users.filter(
        (u) => u.isAdmin || u.role === 'admin' || u.role === 'super_admin'
      ).length;
      const isTargetCurrentlyAdmin = Boolean(
        targetUser.isAdmin || targetUser.role === 'admin' || targetUser.role === 'super_admin'
      );
      if (isTargetCurrentlyAdmin && totalAdmins <= 1) {
        res.status(400).json({
          error: 'Cannot demote the last remaining administrator account.',
        });
        return;
      }
    }

    db.users = db.users.map((u) => {
      if (u.id !== targetId) return u;
      const updatedRole = updates.role !== undefined ? updates.role : u.role;
      const updatedIsAdmin =
        updates.isAdmin !== undefined
          ? Boolean(updates.isAdmin)
          : updatedRole === 'admin' || updatedRole === 'super_admin';
      return {
        ...u,
        ...updates,
        role: updatedRole,
        isAdmin: updatedIsAdmin,
        id: u.id,
      };
    });

    const actionSummary =
      updates.isSuspended !== undefined
        ? updates.isSuspended
          ? 'Suspended user account'
          : 'Reactivated user account'
        : updates.isAdmin !== undefined || updates.role !== undefined
        ? `Updated role/privileges to ${updates.role || (updates.isAdmin ? 'admin' : 'user')}`
        : 'Updated user profile/verification';

    recordAdminActivity(adminUser, actionSummary, 'user', targetUser.fullName, targetUser.id, targetUser.email);
    saveDatabase();
    res.json({
      users: db.users.map((u) => sanitizePublicUser(u, adminUser.id)),
      adminActivityLogs: db.adminActivityLogs,
    });
  });

  app.post('/api/admin/admins', requireAdmin, (req: AuthedRequest, res: Response) => {
    const adminUser = req.user!;
    const { email, fullName, password, role = 'admin', department = 'Marketplace Operations' } = req.body || {};

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email address is required to add or promote an administrator.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (existingUser) {
      // Promote existing user to admin
      existingUser.isAdmin = true;
      existingUser.role = role === 'super_admin' ? 'super_admin' : 'admin';
      existingUser.verifiedStudent = true;
      existingUser.isApprovedLender = true;
      if (password && String(password).length >= 6) {
        const newSalt = crypto.randomBytes(16).toString('hex');
        const newHash = hashPassword(String(password), newSalt);
        const existingCred = db.credentials.find((c) => c.userId === existingUser.id);
        if (existingCred) {
          existingCred.passwordSalt = newSalt;
          existingCred.passwordHash = newHash;
        } else {
          db.credentials.push({ userId: existingUser.id, passwordSalt: newSalt, passwordHash: newHash });
        }
      }
      recordAdminActivity(
        adminUser,
        `Promoted existing user to ${existingUser.role}`,
        'admin',
        existingUser.fullName,
        existingUser.id,
        existingUser.email
      );
      saveDatabase();
      res.json({
        users: db.users.map((u) => sanitizePublicUser(u, adminUser.id)),
        adminActivityLogs: db.adminActivityLogs,
      });
      return;
    }

    // Create a brand new administrator account
    if (!fullName || String(fullName).trim().length < 2) {
      res.status(400).json({ error: 'Full name is required when creating a new admin account.' });
      return;
    }
    if (!password || String(password).length < 6) {
      res.status(400).json({ error: 'Password (min 6 characters) is required for a new admin account.' });
      return;
    }

    const newAdminId = `user_admin_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newAdmin: User = {
      id: newAdminId,
      email: normalizedEmail,
      fullName: String(fullName).trim(),
      avatarUrl: createAvatarSvg(String(fullName).trim()),
      department: String(department).trim(),
      academicYear: 'Faculty',
      campus: 'Main North Campus',
      phone: '+91 98200 00000',
      contactPreference: 'in_app_only',
      smsNotificationsEnabled: true,
      bio: 'Authorized Rent & Reuse Marketplace Administrator.',
      trustScore: 100,
      verifiedStudent: true,
      totalRentalsCompleted: 0,
      onTimeReturnRate: 100,
      createdAt: new Date().toISOString(),
      isAdmin: true,
      role: role === 'super_admin' ? 'super_admin' : 'admin',
      isApprovedLender: true,
      provider: 'email',
      emailVerified: true,
    };

    db.users.push(newAdmin);
    db.credentials.push(createCredential(newAdminId, String(password)));
    recordAdminActivity(
      adminUser,
      `Created new ${newAdmin.role} account`,
      'admin',
      newAdmin.fullName,
      newAdmin.id,
      newAdmin.email
    );
    saveDatabase();

    res.status(201).json({
      users: db.users.map((u) => sanitizePublicUser(u, adminUser.id)),
      adminActivityLogs: db.adminActivityLogs,
    });
  });

  app.delete('/api/admin/users/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const adminUser = req.user!;
    const targetId = req.params.id;
    if (targetId === adminUser.id) {
      res.status(400).json({ error: 'Cannot delete your own active administrator account.' });
      return;
    }
    const target = db.users.find((u) => u.id === targetId);
    if (!target) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const isTargetAdmin = Boolean(target.isAdmin || target.role === 'admin' || target.role === 'super_admin');
    if (isTargetAdmin) {
      const adminCount = db.users.filter(
        (u) => u.isAdmin || u.role === 'admin' || u.role === 'super_admin'
      ).length;
      if (adminCount <= 1) {
        res.status(400).json({ error: 'Cannot delete the last remaining administrator.' });
        return;
      }
    }

    db.users = db.users.filter((u) => u.id !== targetId);
    db.credentials = db.credentials.filter((c) => c.userId !== targetId);
    db.sessions = db.sessions.filter((s) => s.userId !== targetId);
    db.items = db.items.filter((i) => i.ownerId !== targetId);
    db.wishlists = db.wishlists.filter((w) => w.userId !== targetId);
    db.cartItems = db.cartItems.filter((c) => c.userId !== targetId);

    recordAdminActivity(adminUser, 'Deleted user account & listings', 'user', target.fullName, targetId, target.email);
    saveDatabase();
    res.json({
      users: db.users.map((u) => sanitizePublicUser(u, adminUser.id)),
      items: db.items,
      adminActivityLogs: db.adminActivityLogs,
    });
  });

  app.post('/api/admin/categories', requireAdmin, (req: AuthedRequest, res: Response) => {
    const { name, description, iconName } = req.body || {};
    if (!name || !String(name).trim()) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }
    const newCat: CategoryRecord = {
      id: `cat_${Date.now()}`,
      name: String(name).trim(),
      description: String(description || 'Campus rental category').trim(),
      iconName: iconName || 'Package',
      createdAt: new Date().toISOString(),
    };
    db.categories.push(newCat);
    recordAdminActivity(req.user!, 'Created category', 'category', newCat.name, newCat.id);
    saveDatabase();
    res.status(201).json({ categories: db.categories, adminActivityLogs: db.adminActivityLogs });
  });

  app.put('/api/admin/categories/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const catId = req.params.id;
    const { name, description, iconName } = req.body || {};
    const target = db.categories.find((c) => c.id === catId);
    if (!target) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }
    if (name !== undefined && String(name).trim()) target.name = String(name).trim();
    if (description !== undefined) target.description = String(description).trim();
    if (iconName !== undefined) target.iconName = String(iconName).trim();

    recordAdminActivity(req.user!, 'Updated category', 'category', target.name, target.id);
    saveDatabase();
    res.json({ categories: db.categories, adminActivityLogs: db.adminActivityLogs });
  });

  app.delete('/api/admin/categories/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const target = db.categories.find((c) => c.id === req.params.id);
    db.categories = db.categories.filter((c) => c.id !== req.params.id);
    recordAdminActivity(req.user!, 'Deleted category', 'category', target?.name || req.params.id, req.params.id);
    saveDatabase();
    res.json({ categories: db.categories, adminActivityLogs: db.adminActivityLogs });
  });

  app.put('/api/admin/settings', requireAdmin, (req: AuthedRequest, res: Response) => {
    const updates = req.body || {};
    db.websiteSettings = {
      ...db.websiteSettings,
      ...(updates.siteName !== undefined && { siteName: String(updates.siteName).trim() }),
      ...(updates.announcementBanner !== undefined && {
        announcementBanner: String(updates.announcementBanner).trim(),
      }),
      ...(updates.supportEmail !== undefined && { supportEmail: String(updates.supportEmail).trim() }),
      ...(updates.supportPhone !== undefined && { supportPhone: String(updates.supportPhone).trim() }),
      ...(updates.platformFeePercent !== undefined && {
        platformFeePercent: Math.max(0, Math.min(30, Number(updates.platformFeePercent) || 0)),
      }),
      ...(updates.taxPercent !== undefined && {
        taxPercent: Math.max(0, Math.min(30, Number(updates.taxPercent) || 0)),
      }),
      ...(updates.deliveryChargeINR !== undefined && {
        deliveryChargeINR: Math.max(0, Number(updates.deliveryChargeINR) || 0),
      }),
      ...(updates.requireListingApproval !== undefined && {
        requireListingApproval: Boolean(updates.requireListingApproval),
      }),
      ...(updates.maintenanceMode !== undefined && {
        maintenanceMode: Boolean(updates.maintenanceMode),
      }),
      ...(updates.allowDirectPhoneSharing !== undefined && {
        allowDirectPhoneSharing: Boolean(updates.allowDirectPhoneSharing),
      }),
      updatedAt: new Date().toISOString(),
    };
    recordAdminActivity(
      req.user!,
      'Updated website platform settings',
      'settings',
      db.websiteSettings.siteName
    );
    saveDatabase();
    res.json({
      websiteSettings: db.websiteSettings,
      adminActivityLogs: db.adminActivityLogs,
    });
  });

  // Vite middleware in dev, static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RentReuse Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
