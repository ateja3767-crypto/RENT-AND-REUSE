import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Category, Item, ItemCondition, OrderStatus, User } from '../types';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { formatINR } from '../utils/currency';
import {
  Shield,
  Users,
  Package,
  AlertTriangle,
  Check,
  Trash2,
  Ban,
  Search,
  CheckCircle2,
  ClipboardList,
  Tags,
  Star,
  Plus,
  Edit3,
  Eye,
  EyeOff,
  UserPlus,
  Settings,
  Activity,
  X,
  IndianRupee,
  Lock,
  RefreshCw,
} from 'lucide-react';

interface AdminPageProps {
  setCurrentTab: (tab: string) => void;
  setSelectedItemId: (id: string) => void;
}

const ALL_CATEGORIES: Category[] = [
  'Engineering Tools',
  'Books',
  'Electronics',
  'Lab Equipment',
  'Furniture',
  'Clothing',
  'Sports',
  'Other',
];

const ALL_CONDITIONS: ItemCondition[] = ['Like New', 'Gently Used', 'Good', 'Fair'];

export const AdminPage: React.FC<AdminPageProps> = ({ setCurrentTab, setSelectedItemId }) => {
  const {
    currentUser,
    users,
    items,
    categories,
    bookings,
    orders,
    reviews,
    reports,
    adminActivityLogs,
    websiteSettings,
    moderateReport,
    updateItem,
    deleteItem,
    updateOrderStatus,
    updateBookingStatus,
    deleteReview,
    adminUpdateUser,
    adminDeleteUser,
    adminPromoteOrCreateAdmin,
    adminAddCategory,
    adminUpdateCategory,
    adminDeleteCategory,
    adminUpdateWebsiteSettings,
    changePassword,
    uploadProductImage,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'listings'
    | 'users'
    | 'admins'
    | 'orders'
    | 'categories'
    | 'reviews'
    | 'reports'
    | 'settings'
    | 'logs'
  >('overview');

  const [searchQuery, setSearchQuery] = useState('');

  // Product Delete Confirmation Modal State
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  // Product Edit Modal State
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('Electronics');
  const [editCondition, setEditCondition] = useState<ItemCondition>('Like New');
  const [editDescription, setEditDescription] = useState('');
  const [editPriceDay, setEditPriceDay] = useState(0);
  const [editPriceWeek, setEditPriceWeek] = useState(0);
  const [editPriceMonth, setEditPriceMonth] = useState(0);
  const [editDeposit, setEditDeposit] = useState(0);
  const [editLocation, setEditLocation] = useState('');
  const [editOwnerId, setEditOwnerId] = useState('');
  const [editStatus, setEditStatus] = useState<Item['status']>('available');
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  // User Inspection Modal
  const [inspectingUser, setInspectingUser] = useState<User | null>(null);

  // Multi-Admin Management State
  const [promoteEmail, setPromoteEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'super_admin'>('admin');
  const [newAdminDept, setNewAdminDept] = useState('Marketplace Operations');

  // Category Management State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');

  // Website Settings State
  const [siteName, setSiteName] = useState(websiteSettings.siteName);
  const [announcementBanner, setAnnouncementBanner] = useState(websiteSettings.announcementBanner);
  const [supportEmail, setSupportEmail] = useState(websiteSettings.supportEmail);
  const [supportPhone, setSupportPhone] = useState(websiteSettings.supportPhone);
  const [platformFeePercent, setPlatformFeePercent] = useState(websiteSettings.platformFeePercent);
  const [taxPercent, setTaxPercent] = useState(websiteSettings.taxPercent);
  const [deliveryChargeINR, setDeliveryChargeINR] = useState(websiteSettings.deliveryChargeINR);
  const [allowDirectPhoneSharing, setAllowDirectPhoneSharing] = useState(
    websiteSettings.allowDirectPhoneSharing
  );
  const [requireListingApproval, setRequireListingApproval] = useState(
    websiteSettings.requireListingApproval
  );

  // Admin Password Change State
  const [currentAdminPwd, setCurrentAdminPwd] = useState('');
  const [newAdminPwd, setNewAdminPwd] = useState('');

  const isAuthorizedAdmin = Boolean(
    currentUser && (currentUser.isAdmin || currentUser.role === 'admin' || currentUser.role === 'super_admin')
  );

  if (!isAuthorizedAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Restricted Administrator Area
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Access Denied: Only authenticated administrators with role-based privileges can view the Admin Dashboard.
        </p>
        <button
          onClick={() => setCurrentTab('admin-portal')}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer"
        >
          Go to Admin Portal Login
        </button>
      </div>
    );
  }

  // Open Edit Product Modal
  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditCondition(item.condition);
    setEditDescription(item.description);
    setEditPriceDay(item.pricePerDay);
    setEditPriceWeek(item.pricePerWeek || Math.round(item.pricePerDay * 5.5));
    setEditPriceMonth(item.pricePerMonth || Math.round(item.pricePerDay * 20));
    setEditDeposit(item.depositAmount);
    setEditLocation(item.pickupLocation);
    setEditOwnerId(item.ownerId);
    setEditStatus(item.status);
    setEditPhotos([...item.photos]);
    setNewPhotoUrl('');
  };

  const handleSaveEditedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (editPhotos.length === 0) {
      showToast('At least one valid product image is required.', 'error');
      return;
    }
    updateItem(editingItem.id, {
      title: editTitle.trim(),
      category: editCategory,
      condition: editCondition,
      description: editDescription.trim(),
      pricePerDay: Number(editPriceDay) || 0,
      pricePerWeek: Number(editPriceWeek) || 0,
      pricePerMonth: Number(editPriceMonth) || 0,
      isFree: Number(editPriceDay) === 0,
      depositAmount: Number(editDeposit) || 0,
      pickupLocation: editLocation.trim(),
      ownerId: editOwnerId,
      status: editStatus,
      photos: editPhotos,
    });
    setEditingItem(null);
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await uploadProductImage(file);
    if (res.success && res.url) {
      setEditPhotos((prev) => [res.url!, ...prev]);
      showToast('Product image uploaded and added.', 'success');
    } else {
      showToast(res.error || 'Could not upload image.', 'error');
    }
  };

  // Dashboard Metrics
  const pendingReports = reports.filter((r) => r.status === 'pending');
  const activeListingsCount = items.filter((i) => i.status === 'available').length;
  const hiddenListingsCount = items.filter((i) => i.status === 'hidden' || i.status === 'paused').length;
  const pendingOrdersCount =
    orders.filter((o) => o.orderStatus === 'Pending' || o.orderStatus === 'Confirmed').length +
    bookings.filter((b) => b.status === 'pending').length;
  const completedRentalsCount =
    orders.filter((o) => o.orderStatus === 'Completed' || o.orderStatus === 'Returned').length +
    bookings.filter((b) => b.status === 'returned').length;
  const cancelledOrdersCount =
    orders.filter((o) => o.orderStatus === 'Cancelled').length +
    bookings.filter((b) => b.status === 'cancelled' || b.status === 'declined').length;

  const totalPlatformRevenue =
    orders
      .filter((o) => o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + o.subtotalRental + o.serviceFee, 0) +
    bookings
      .filter((b) => b.status === 'accepted' || b.status === 'picked_up' || b.status === 'returned')
      .reduce((sum, b) => sum + (b.rentalAmount ?? Math.max(0, b.totalPrice - b.depositAmount)), 0);

  const filteredItems = items.filter(
    (i) =>
      !searchQuery.trim() ||
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      !searchQuery.trim() ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const adminUsers = users.filter(
    (u) => u.isAdmin || u.role === 'admin' || u.role === 'super_admin'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Admin Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-rose-800/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-300 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Admin Portal &amp; Control Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/30 text-rose-200 border border-rose-400/30">
                {currentUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Signed in as <span className="font-semibold text-white">{currentUser?.fullName}</span> ({currentUser?.email}) • All financial metrics in Indian Rupees (₹ INR)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCurrentTab('post')}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Manage Admins ({adminUsers.length})</span>
          </button>
        </div>
      </div>

      {/* Key Marketplace KPI Cards (Section 3 Requirement) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Users</div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
            {users.length}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Products</div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
            {items.length}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active Listings</div>
          <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
            {activeListingsCount}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Rentals</div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
            {orders.length + bookings.length}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending Orders</div>
          <div className="text-xl font-extrabold text-amber-600 mt-1 tabular-nums">
            {pendingOrdersCount}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Completed</div>
          <div className="text-xl font-extrabold text-teal-600 mt-1 tabular-nums">
            {completedRentalsCount}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Cancelled</div>
          <div className="text-xl font-extrabold text-rose-600 mt-1 tabular-nums">
            {cancelledOrdersCount}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/30">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Total Revenue
          </div>
          <div className="text-lg font-extrabold text-emerald-800 dark:text-emerald-300 mt-1 tabular-nums">
            {formatINR(totalPlatformRevenue)}
          </div>
        </div>
      </div>

      {/* Navigation Tabs + Search */}
      <div className="flex flex-col lg:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'listings', label: `Products (${items.length})`, icon: Package },
            { id: 'users', label: `Users (${users.length})`, icon: Users },
            { id: 'admins', label: `Admins (${adminUsers.length})`, icon: Shield },
            { id: 'orders', label: `Orders & Bookings (${orders.length + bookings.length})`, icon: ClipboardList },
            { id: 'categories', label: `Categories (${categories.length})`, icon: Tags },
            { id: 'reviews', label: `Reviews (${reviews.length})`, icon: Star },
            { id: 'reports', label: `Reports (${pendingReports.length})`, icon: AlertTriangle },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'logs', label: `Activity Log (${adminActivityLogs.length})`, icon: RefreshCw },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === t.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {(activeTab === 'listings' || activeTab === 'users') && (
          <div className="relative w-full lg:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        )}
      </div>

      {/* 1. OVERVIEW TAB: Recent Users, Recent Products, Recent Orders & Reports */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Products */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Recent Products</span>
              </h2>
              <button
                onClick={() => setActiveTab('listings')}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Manage All →
              </button>
            </div>
            <div className="space-y-3">
              {items.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ImageWithFallback
                      src={item.photos[0]}
                      alt={item.title}
                      itemId={item.id}
                      title={item.title}
                      category={item.category}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-500">{formatINR(item.pricePerDay)}/day</div>
                    </div>
                  </div>
                  <button
                    onClick={() => openEditModal(item)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Users */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Recent Users</span>
              </h2>
              <button
                onClick={() => setActiveTab('users')}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {users.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={u.avatarUrl}
                      alt={u.fullName}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{u.fullName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setInspectingUser(u)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Inspect
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders & Bookings */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-amber-600" />
                <span>Recent Bookings &amp; Orders</span>
              </h2>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Manage All →
              </button>
            </div>
            <div className="space-y-3">
              {bookings.slice(0, 5).map((b) => {
                const item = items.find((i) => i.id === b.itemId);
                const renter = users.find((u) => u.id === b.borrowerId);
                return (
                  <div
                    key={b.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {item?.title || 'Product'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {renter?.fullName || 'Renter'} • {b.startDate} → {b.endDate}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${
                        b.status === 'accepted' || b.status === 'picked_up'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : b.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. PRODUCT MANAGEMENT TAB (Section 4 Requirement) */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Showing <span className="font-bold text-slate-900 dark:text-white">{filteredItems.length}</span> products ({activeListingsCount} active, {hiddenListingsCount} paused/hidden). Admins can add, edit prices/images/owners, hide/restore, or permanently delete products.
            </div>
            <button
              onClick={() => setCurrentTab('post')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product Listing</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Owner</th>
                  <th className="py-3.5 px-4">Rates (₹ INR)</th>
                  <th className="py-3.5 px-4">Availability</th>
                  <th className="py-3.5 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filteredItems.map((item) => {
                  const owner = users.find((u) => u.id === item.ownerId);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <ImageWithFallback
                            src={item.photos[0]}
                            alt={item.title}
                            itemId={item.id}
                            title={item.title}
                            category={item.category}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <button
                              onClick={() => {
                                setSelectedItemId(item.id);
                                setCurrentTab('detail');
                              }}
                              className="font-bold text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 text-left cursor-pointer"
                            >
                              {item.title}
                            </button>
                            <div className="text-[11px] text-slate-400">
                              {item.pickupLocation} • {item.photos.length} photo(s)
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {item.category}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {owner?.fullName || 'Student'}
                        </div>
                        <div className="text-[10px] text-slate-400">{owner?.email}</div>
                      </td>
                      <td className="py-3 px-4 tabular-nums">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.isFree ? 'Free' : `${formatINR(item.pricePerDay)}/day`}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Dep: {formatINR(item.depositAmount)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            item.status === 'available'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : item.status === 'rented'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                            title="Edit product details, prices, images, category, owner"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() =>
                              updateItem(item.id, {
                                status: item.status === 'available' ? 'hidden' : 'available',
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                            title={item.status === 'available' ? 'Hide / Unpublish' : 'Restore Listing'}
                          >
                            {item.status === 'available' ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Hide</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600">Restore</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => setItemToDelete(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 font-semibold inline-flex items-center gap-1 cursor-pointer"
                            title="Permanently Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. USER MANAGEMENT TAB (Section 5 Requirement) */}
      {activeTab === 'users' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Department &amp; Year</th>
                <th className="py-3.5 px-4">Role &amp; Verification</th>
                <th className="py-3.5 px-4">Activity</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredUsers.map((user) => {
                const userListingsCount = items.filter((i) => i.ownerId === user.id).length;
                const userRentalsCount = bookings.filter((b) => b.borrowerId === user.id).length;
                return (
                  <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            <span>{user.fullName}</span>
                            {user.verifiedStudent && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          </div>
                          <div className="text-[11px] text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {user.department} · {user.academicYear}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          user.isAdmin || user.role === 'admin' || user.role === 'super_admin'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {user.role || (user.isAdmin ? 'admin' : 'user')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {userListingsCount} listings · {userRentalsCount} rentals
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          user.isSuspended
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {user.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setInspectingUser(user)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          History
                        </button>
                        <button
                          onClick={() =>
                            adminUpdateUser(user.id, { verifiedStudent: !user.verifiedStudent })
                          }
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 cursor-pointer"
                        >
                          {user.verifiedStudent ? 'Verified' : 'Verify'}
                        </button>
                        {user.id !== currentUser?.id && (
                          <>
                            <button
                              onClick={() =>
                                adminUpdateUser(user.id, { isSuspended: !user.isSuspended })
                              }
                              className={`px-2.5 py-1 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer ${
                                user.isSuspended
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                              }`}
                            >
                              <Ban className="w-3 h-3" />
                              <span>{user.isSuspended ? 'Reactivate' : 'Suspend'}</span>
                            </button>
                            <button
                              onClick={() => adminDeleteUser(user.id)}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 cursor-pointer"
                              title="Delete User Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. MULTI-ADMIN ROLE MANAGEMENT TAB (Section 6 Requirement) */}
      {activeTab === 'admins' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add or Promote Admin Form */}
          <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 h-fit">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Add or Promote Administrator
                </h2>
                <p className="text-[11px] text-slate-500">
                  Enter an existing user&apos;s email to promote them, or fill out details to create a new admin account.
                </p>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!promoteEmail.trim()) return;
                const res = await adminPromoteOrCreateAdmin({
                  email: promoteEmail.trim(),
                  fullName: newAdminName.trim() || undefined,
                  password: newAdminPassword || undefined,
                  role: newAdminRole,
                  department: newAdminDept,
                });
                if (res.success) {
                  setPromoteEmail('');
                  setNewAdminName('');
                  setNewAdminPassword('');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  User Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={promoteEmail}
                  onChange={(e) => setPromoteEmail(e.target.value)}
                  placeholder="e.g., priya.nair@campus.edu or newadmin@campus.edu"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Role Level
                </label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as 'admin' | 'super_admin')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="admin">Admin — Manage products, users, orders &amp; reports</option>
                  <option value="super_admin">Super Admin — Full system &amp; multi-admin control</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="text-[11px] font-semibold text-slate-500">
                  For New Admin Accounts (optional if promoting an existing user):
                </div>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Full Name (for new account)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Initial Password (min 6 chars)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer"
              >
                Grant Administrator Privileges
              </button>
            </form>
          </div>

          {/* Current Administrators List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active Platform Administrators ({adminUsers.length})
                </h3>
                <span className="text-[11px] text-slate-500">
                  Last remaining admin is protected from removal
                </span>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {adminUsers.map((adm) => (
                  <div key={adm.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={adm.avatarUrl}
                        alt={adm.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{adm.fullName}</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            {adm.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {adm.email} • {adm.department}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {adm.id !== currentUser?.id && adminUsers.length > 1 ? (
                        <button
                          onClick={() =>
                            adminUpdateUser(adm.id, { isAdmin: false, role: 'owner' })
                          }
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          Revoke Admin Role
                        </button>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">
                          {adm.id === currentUser?.id ? 'Current Session' : 'Protected'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Promote Existing Standard Users */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Quick-Promote Registered Users to Admin
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {users
                  .filter((u) => !u.isAdmin && u.role !== 'admin' && u.role !== 'super_admin')
                  .map((u) => (
                    <div
                      key={u.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {u.fullName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{u.email}</div>
                      </div>
                      <button
                        onClick={() =>
                          adminUpdateUser(u.id, { isAdmin: true, role: 'admin' })
                        }
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 shrink-0 cursor-pointer"
                      >
                        Make Admin
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. ORDERS & RENTALS MANAGEMENT TAB (Section 7 Requirement) */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Direct Booking Requests */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Direct Product Booking Requests ({bookings.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.map((b) => {
                const item = items.find((i) => i.id === b.itemId);
                const renter = users.find((u) => u.id === b.borrowerId);
                const owner = users.find((u) => u.id === b.ownerId);
                return (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item?.title || 'Product'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {b.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Renter: <span className="font-semibold text-slate-700 dark:text-slate-300">{renter?.fullName}</span> • Owner:{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{owner?.fullName}</span>
                      </div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        Dates: {b.startDate} → {b.endDate} ({b.totalDays} days) • Total: {formatINR(b.totalPrice)}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {(['pending', 'accepted', 'picked_up', 'returned', 'declined', 'cancelled'] as const).map(
                        (st) => (
                          <button
                            key={st}
                            onClick={() => updateBookingStatus(b.id, st)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${
                              b.status === st
                                ? 'bg-emerald-700 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {st.replace('_', ' ')}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Checkout Orders */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Checkout Rental Orders ({orders.length})
            </h2>
            {orders.length === 0 ? (
              <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500">
                No checkout orders placed yet.
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {order.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        {order.orderStatus}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatINR(order.grandTotal)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Customer: <span className="font-semibold text-slate-700 dark:text-slate-300">{order.customerName}</span> ({order.customerEmail})
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      ['Confirmed', 'Preparing', 'Rented', 'Returned', 'Completed', 'Cancelled'] as OrderStatus[]
                    ).map((st) => (
                      <button
                        key={st}
                        onClick={() => updateOrderStatus(order.id, st)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          order.orderStatus === st
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. CATEGORY MANAGEMENT TAB (Section 8 Requirement) */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 h-fit">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Tags className="w-4 h-4 text-emerald-700" />
              <span>Add New Category</span>
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCatName.trim()) return;
                adminAddCategory(newCatName.trim(), newCatDesc.trim());
                setNewCatName('');
                setNewCatDesc('');
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g., Robotics & Drones"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Short description of equipment"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer"
              >
                Create Category
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-3"
              >
                {editingCatId === cat.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                    />
                    <input
                      type="text"
                      value={editCatDesc}
                      onChange={(e) => setEditCatDesc(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          adminUpdateCategory(cat.id, {
                            name: editCatName,
                            description: editCatDesc,
                          });
                          setEditingCatId(null);
                        }}
                        className="px-3 py-1 rounded-lg bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {cat.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{cat.description}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setEditCatName(cat.name);
                          setEditCatDesc(cat.description);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => adminDeleteCategory(cat.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. REVIEWS MODERATION TAB (Section 9 Requirement) */}
      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {reviews.map((rev) => {
            const reviewer = users.find((u) => u.id === rev.reviewerId);
            const item = items.find((i) => i.id === rev.itemId);
            return (
              <div
                key={rev.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {reviewer?.fullName || 'Campus User'}
                    </span>
                    <span className="text-xs font-bold text-amber-500">★ {rev.rating}.0</span>
                    {item && (
                      <span className="text-[11px] text-slate-400">on {item.title}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{rev.comment}</p>
                </div>
                <button
                  onClick={() => deleteReview(rev.id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Review</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 8. REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="p-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No moderation reports in queue
              </p>
            </div>
          ) : (
            reports.map((report) => {
              const reporter = users.find((u) => u.id === report.reporterId);
              const reportedItem = report.reportedItemId
                ? items.find((i) => i.id === report.reportedItemId)
                : undefined;

              return (
                <div
                  key={report.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-rose-600 uppercase">
                      {report.reason.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-slate-500">
                      Reported by {reporter?.fullName || 'Student'} on{' '}
                      {report.createdAt.split('T')[0]}
                    </div>
                    {reportedItem && (
                      <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Listing: {reportedItem.title}</span>
                        <button
                          onClick={() => {
                            setSelectedItemId(reportedItem.id);
                            setCurrentTab('detail');
                          }}
                          className="text-emerald-700 underline text-[11px] cursor-pointer"
                        >
                          Inspect
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      &ldquo;{report.details}&rdquo;
                    </p>
                  </div>

                  {report.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      {reportedItem && (
                        <button
                          onClick={() => moderateReport(report.id, 'resolve', true)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer"
                        >
                          Remove Listing &amp; Resolve
                        </button>
                      )}
                      <button
                        onClick={() => moderateReport(report.id, 'resolve')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      <span>{report.status}</span>
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 9. WEBSITE SETTINGS & ADMIN PASSWORD TAB (Section 10 Requirement) */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-600" />
              <span>Website &amp; Rental Rules Configuration (₹ INR)</span>
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                adminUpdateWebsiteSettings({
                  siteName,
                  announcementBanner,
                  supportEmail,
                  supportPhone,
                  platformFeePercent,
                  taxPercent,
                  deliveryChargeINR,
                  allowDirectPhoneSharing,
                  requireListingApproval,
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default Currency
                  </label>
                  <div className="px-3 py-2 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>Indian Rupee (₹ — INR)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Banner Text
                </label>
                <input
                  type="text"
                  value={announcementBanner}
                  onChange={(e) => setAnnouncementBanner(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Platform Fee (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={platformFeePercent}
                    onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GST / Tax (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Delivery Charge (₹)
                  </label>
                  <input
                    type="number"
                    value={deliveryChargeINR}
                    onChange={(e) => setDeliveryChargeINR(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Support Phone
                  </label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowDirectPhoneSharing}
                    onChange={(e) => setAllowDirectPhoneSharing(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700"
                  />
                  <span>Allow optional phone sharing after booking request is accepted</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireListingApproval}
                    onChange={(e) => setRequireListingApproval(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700"
                  />
                  <span>Require admin review for newly submitted listings</span>
                </label>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer"
              >
                Save Website Settings
              </button>
            </form>
          </div>

          {/* Change Administrator Password Card */}
          <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 h-fit">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-600" />
              <span>Change Administrator Password</span>
            </h2>
            <p className="text-xs text-slate-500">
              Update your administrator credential. Passwords are salted and scrypt-hashed on the backend.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await changePassword(currentAdminPwd, newAdminPwd);
                if (res.success) {
                  setCurrentAdminPwd('');
                  setNewAdminPwd('');
                } else {
                  showToast(res.error || 'Could not update password.', 'error');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Admin Password
                </label>
                <input
                  type="password"
                  required
                  value={currentAdminPwd}
                  onChange={(e) => setCurrentAdminPwd(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Admin Password (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newAdminPwd}
                  onChange={(e) => setNewAdminPwd(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer"
              >
                Update Admin Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 10. ADMIN ACTIVITY LOG TAB (Section 11 Requirement) */}
      {activeTab === 'logs' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Administrator Audit &amp; Activity Log
            </h2>
            <span className="text-xs text-slate-500">{adminActivityLogs.length} recorded events</span>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {adminActivityLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No admin actions logged yet.</div>
            ) : (
              adminActivityLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {log.action} — <span className="text-emerald-700 dark:text-emerald-400">{log.targetLabel}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      By {log.adminName} • Target: {log.targetType.toUpperCase()}
                      {log.details ? ` • ${log.details}` : ''}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 tabular-nums shrink-0">
                    {new Date(log.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG BEFORE DELETING PRODUCT (Section 4 Requirement) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Confirm Permanent Deletion
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Are you sure you want to permanently delete this item?
                </p>
                <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white">
                  {itemToDelete.title} ({formatINR(itemToDelete.pricePerDay)}/day)
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteItem(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Yes, Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN EDIT PRODUCT MODAL (Section 4 Requirement) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Edit Product Listing — {editingItem.title}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as Category)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {ALL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Price/Day (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editPriceDay}
                    onChange={(e) => setEditPriceDay(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Price/Week (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editPriceWeek}
                    onChange={(e) => setEditPriceWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Price/Month (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editPriceMonth}
                    onChange={(e) => setEditPriceMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deposit (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editDeposit}
                    onChange={(e) => setEditDeposit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Product Owner
                  </label>
                  <select
                    value={editOwnerId}
                    onChange={(e) => setEditOwnerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Availability Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as Item['status'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="available">Available</option>
                    <option value="paused">Paused</option>
                    <option value="rented">Rented</option>
                    <option value="hidden">Hidden / Unpublished</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Condition
                  </label>
                  <select
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value as ItemCondition)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {ALL_CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pickup Location
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {/* Manage Product Images */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Product Images ({editPhotos.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {editPhotos.map((photo, idx) => (
                    <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                      <ImageWithFallback
                        src={photo}
                        alt={editTitle}
                        title={editTitle}
                        category={editCategory}
                        className="w-full h-full object-cover"
                      />
                      {editPhotos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-90 hover:opacity-100 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="Paste image URL (https://...)"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newPhotoUrl.trim()) {
                        setEditPhotos((prev) => [...prev, newPhotoUrl.trim()]);
                        setNewPhotoUrl('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold cursor-pointer"
                  >
                    Add URL
                  </button>
                  <label className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-bold cursor-pointer">
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleEditImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                >
                  Save Product Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER INSPECTION MODAL (Section 5 Requirement: View user listings, orders, rental history) */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={inspectingUser.avatarUrl}
                  alt={inspectingUser.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {inspectingUser.fullName}
                  </h3>
                  <div className="text-xs text-slate-500">
                    {inspectingUser.email} • {inspectingUser.department}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectingUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                  User&apos;s Product Listings ({items.filter((i) => i.ownerId === inspectingUser.id).length})
                </h4>
                <div className="space-y-2">
                  {items
                    .filter((i) => i.ownerId === inspectingUser.id)
                    .map((it) => (
                      <div
                        key={it.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between"
                      >
                        <span className="font-semibold">{it.title}</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {formatINR(it.pricePerDay)}/day ({it.status})
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                  User&apos;s Rental History &amp; Bookings (
                  {bookings.filter((b) => b.borrowerId === inspectingUser.id).length})
                </h4>
                <div className="space-y-2">
                  {bookings
                    .filter((b) => b.borrowerId === inspectingUser.id)
                    .map((b) => {
                      const prod = items.find((i) => i.id === b.itemId);
                      return (
                        <div
                          key={b.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between"
                        >
                          <span>
                            {prod?.title || 'Item'} ({b.startDate} → {b.endDate})
                          </span>
                          <span className="font-bold uppercase text-[10px]">
                            {b.status} • {formatINR(b.totalPrice)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
