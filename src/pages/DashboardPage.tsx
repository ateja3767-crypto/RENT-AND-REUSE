import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Booking, DepositStatus, Item, ConditionAccuracy, OrderStatus } from '../types';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { InteractiveStarPicker } from '../components/common/StarRating';
import { PostItemPage } from './PostItemPage';
import { formatINR } from '../utils/currency';
import {
  Inbox,
  Send,
  Clock,
  Package,
  History,
  MessageSquare,
  Pause,
  Play,
  Trash2,
  ExternalLink,
  GraduationCap,
  Star,
  Check,
  Calendar,
  Edit3,
  X,
  ShoppingBag,
  MapPin,
  CreditCard,
  ShieldCheck,
  Heart,
  ShoppingCart,
  Bell,
  User as UserIcon,
  Settings,
  LogOut,
  IndianRupee,
  PlusCircle,
} from 'lucide-react';

interface DashboardPageProps {
  setCurrentTab: (tab: string) => void;
  setSelectedItemId: (id: string) => void;
  setSelectedUserId: (userId: string) => void;
}

type DashboardSection =
  | 'my_orders'
  | 'active_borrows'
  | 'my_requests'
  | 'incoming'
  | 'my_listings'
  | 'earnings'
  | 'history'
  | 'addresses'
  | 'notifications';

const ORDER_STATUS_STEPS: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Rented',
  'Returned',
  'Completed',
];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  setCurrentTab,
  setSelectedItemId,
  setSelectedUserId,
}) => {
  const {
    currentUser,
    bookings,
    orders,
    cart,
    wishlist,
    addresses,
    notifications,
    items,
    getUserById,
    getItemById,
    updateBookingStatus,
    updateOrderStatus,
    togglePauseItem,
    deleteItem,
    submitReview,
    markNotificationsAsRead,
    deleteSavedAddress,
    logout,
    reviews,
  } = useApp();

  const [activeTab, setActiveTab] = useState<DashboardSection>('my_orders');

  // Edit item state
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Modal for Inspection & Return
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedBookingForInspect, setSelectedBookingForInspect] = useState<Booking | null>(null);
  const [depositSettlement, setDepositSettlement] = useState<DepositStatus>('refunded');
  const [damageReported, setDamageReported] = useState(false);
  const [damageDetails, setDamageDetails] = useState('');
  const [withheldAmount, setWithheldAmount] = useState('0');
  const [returnNotes, setReturnNotes] = useState('Item returned in great shape.');

  // Modal for Review
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [bookingForReview, setBookingForReview] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState(
    'Equipment worked flawlessly and handover was right on time.'
  );
  const [returnedOnTime, setReturnedOnTime] = useState(true);
  const [conditionAccuracy, setConditionAccuracy] = useState<ConditionAccuracy>('Exact Match');
  const [wouldBorrowAgain, setWouldBorrowAgain] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Clean & Well-Maintained',
    'Worked Flawlessly',
  ]);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Package className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Sign In Required
        </h2>
        <p className="text-xs text-slate-500">
          Please sign in with your account to access your private dashboard, orders, rentals, and listings.
        </p>
        <button
          onClick={() => setCurrentTab('auth')}
          className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  // Strictly isolated lists for the logged-in user
  const myOrders = orders.filter((o) => o.userId === currentUser.id);
  const sellerOrderItems = orders.flatMap((o) =>
    o.items
      .filter((item) => item.sellerId === currentUser.id && o.orderStatus !== 'Cancelled')
      .map((item) => ({ ...item, orderCreatedAt: o.createdAt, buyerName: o.customerName, orderStatus: o.orderStatus }))
  );
  const incomingRequests = bookings.filter(
    (b) => b.ownerId === currentUser.id && (b.status === 'pending' || b.status === 'accepted')
  );
  const activeLoans = bookings.filter(
    (b) => b.ownerId === currentUser.id && b.status === 'picked_up'
  );
  const myOutboundRequests = bookings.filter(
    (b) => b.borrowerId === currentUser.id && (b.status === 'pending' || b.status === 'accepted')
  );
  const activeBorrows = bookings.filter(
    (b) => b.borrowerId === currentUser.id && b.status === 'picked_up'
  );
  const myListings = items.filter((i) => i.ownerId === currentUser.id);
  const completedHistory = bookings.filter(
    (b) =>
      (b.ownerId === currentUser.id || b.borrowerId === currentUser.id) &&
      (b.status === 'returned' || b.status === 'declined' || b.status === 'cancelled')
  );
  const myNotifications = notifications.filter((n) => n.userId === currentUser.id);

  // Owner earnings calculation
  const completedOwnerBookings = bookings.filter(
    (b) => b.ownerId === currentUser.id && (b.status === 'returned' || b.status === 'picked_up')
  );
  const bookingEarnings = completedOwnerBookings.reduce(
    (sum, b) => sum + Math.max(0, b.totalPrice - b.depositAmount),
    0
  );
  const orderSellerEarnings = sellerOrderItems.reduce((sum, item) => sum + item.rentalAmount, 0);
  const totalOwnerEarnings = bookingEarnings + orderSellerEarnings;

  const handleInspectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForInspect) return;

    updateBookingStatus(selectedBookingForInspect.id, 'returned', {
      depositStatus: depositSettlement,
      damageReported,
      damageDetails: damageReported ? damageDetails : undefined,
      withheldAmount: damageReported ? parseFloat(withheldAmount) || 0 : 0,
      returnNotes,
    });

    setInspectModalOpen(false);
    setBookingForReview(selectedBookingForInspect);
    setReviewModalOpen(true);
    setSelectedBookingForInspect(null);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForReview) return;

    const isOwnerReviewing = currentUser.id === bookingForReview.ownerId;
    const revieweeId = isOwnerReviewing ? bookingForReview.borrowerId : bookingForReview.ownerId;

    submitReview({
      bookingId: bookingForReview.id,
      revieweeId,
      itemId: bookingForReview.itemId,
      rating: reviewRating,
      comment: reviewComment.trim(),
      role: isOwnerReviewing ? 'owner_to_borrower' : 'borrower_to_owner',
      returnedOnTime,
      itemAsDescribed: conditionAccuracy !== 'Not As Described',
      conditionAccuracy,
      wouldBorrowAgain,
      verifiedBooking: true,
      tags: isOwnerReviewing ? undefined : selectedTags,
    });

    setReviewModalOpen(false);
    setBookingForReview(null);
  };

  const hasReviewed = (bookingId: string) => {
    return reviews.some((r) => r.bookingId === bookingId && r.reviewerId === currentUser.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Isolated Account Workspace · {currentUser.fullName} ({currentUser.email})
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            User &amp; Seller Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your private orders, rentals, equipment listings, earnings, addresses, and account settings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentTab('post')}
            className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Product Listing</span>
          </button>
        </div>
      </div>

      {/* Main Sidebar + Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDEBAR NAVIGATION (Section 11 & 12) */}
        <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-24">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            {/* User Mini Card */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-emerald-500/20"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser.fullName}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Trust Score: {currentUser.trustScore}/100
                </div>
              </div>
            </div>

            {/* Renter / Buyer Section */}
            <div className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Renter &amp; Buyer
              </div>
              <button
                onClick={() => setActiveTab('my_orders')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'my_orders'
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Order History</span>
                </span>
                <span className="text-[11px] tabular-nums">{myOrders.length}</span>
              </button>

              <button
                onClick={() => setActiveTab('active_borrows')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'active_borrows'
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>My Active Rentals</span>
                </span>
                <span className="text-[11px] tabular-nums">{activeBorrows.length}</span>
              </button>

              <button
                onClick={() => setActiveTab('my_requests')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'my_requests'
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Send className="w-3.5 h-3.5" />
                  <span>Outbound Requests</span>
                </span>
                <span className="text-[11px] tabular-nums">{myOutboundRequests.length}</span>
              </button>

              <button
                onClick={() => setCurrentTab('wishlist')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>My Wishlist</span>
                </span>
                <span className="text-[11px] tabular-nums">{wishlist.length}</span>
              </button>

              <button
                onClick={() => setCurrentTab('cart')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
                  <span>My Cart</span>
                </span>
                <span className="text-[11px] tabular-nums">{cart.length}</span>
              </button>
            </div>

            {/* Owner / Seller Section */}
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Owner / Seller Console
              </div>

              <button
                onClick={() => setActiveTab('my_listings')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'my_listings'
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5" />
                  <span>My Listings</span>
                </span>
                <span className="text-[11px] tabular-nums">{myListings.length}</span>
              </button>

              <button
                onClick={() => setActiveTab('incoming')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'incoming'
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Rental Requests</span>
                </span>
                <span className="text-[11px] tabular-nums">
                  {incomingRequests.length + activeLoans.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('earnings')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'earnings'
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Earnings Summary</span>
                </span>
                <span className="text-[11px] tabular-nums font-bold">
                  {formatINR(totalOwnerEarnings)}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5" />
                  <span>Completed &amp; Reviews</span>
                </span>
                <span className="text-[11px] tabular-nums">{completedHistory.length}</span>
              </button>
            </div>

            {/* Account & Settings Section */}
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Account &amp; Settings
              </div>

              <button
                onClick={() => setActiveTab('addresses')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'addresses'
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Saved Addresses</span>
                </span>
                <span className="text-[11px] tabular-nums">{addresses.length}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('notifications');
                  markNotificationsAsRead();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'notifications'
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Notifications</span>
                </span>
                <span className="text-[11px] tabular-nums">{myNotifications.length}</span>
              </button>

              <button
                onClick={() => {
                  setSelectedUserId(currentUser.id);
                  setCurrentTab('profile');
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Profile &amp; Account Settings</span>
                </span>
                <UserIcon className="w-3 h-3 text-slate-400" />
              </button>

              <button
                onClick={async () => {
                  await logout();
                  setCurrentTab('landing');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB: MY CHECKOUT ORDERS */}
          {activeTab === 'my_orders' && (
            <div className="space-y-4">
              {myOrders.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto stroke-1" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    You haven&apos;t placed any rental orders yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Add equipment to your personal cart and complete checkout to track your rental orders here.
                  </p>
                  <button
                    onClick={() => setCurrentTab('browse')}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm cursor-pointer"
                  >
                    Browse Equipment Catalog
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {myOrders.map((order) => {
                    const canCancel =
                      order.orderStatus === 'Pending' ||
                      order.orderStatus === 'Confirmed' ||
                      order.orderStatus === 'Preparing';
                    const currentStepIdx = ORDER_STATUS_STEPS.indexOf(order.orderStatus);

                    return (
                      <div
                        key={order.id}
                        className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                                Order #{order.id}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                                  order.orderStatus === 'Cancelled'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                    : order.orderStatus === 'Completed' ||
                                      order.orderStatus === 'Returned'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                }`}
                              >
                                {order.orderStatus}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                              <span>Placed on {order.createdAt.split('T')[0]}</span>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1">
                                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{order.paymentMethod}</span>
                              </span>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                <span>
                                  {order.shippingAddress.street}, {order.shippingAddress.city}
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-slate-400">Grand Total Paid</div>
                            <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                              {formatINR(order.grandTotal)}
                            </div>
                            <div className="text-[11px] text-slate-400 tabular-nums">
                              Includes {formatINR(order.securityDepositTotal)} refundable deposit
                            </div>
                          </div>
                        </div>

                        {order.orderStatus !== 'Cancelled' && (
                          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
                            {ORDER_STATUS_STEPS.map((step, idx) => {
                              const done = currentStepIdx >= idx;
                              return (
                                <div
                                  key={step}
                                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-center border ${
                                    done
                                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                                  }`}
                                >
                                  {done ? '✓ ' : ''}
                                  {step}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="space-y-3">
                          {order.items.map((oi, idx) => (
                            <div
                              key={`${order.id}_${oi.productId}_${idx}`}
                              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                  <ImageWithFallback
                                    src={oi.productPhoto}
                                    alt={oi.productTitle}
                                    category={oi.category}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <div
                                    onClick={() => {
                                      setSelectedItemId(oi.productId);
                                      setCurrentTab('detail');
                                    }}
                                    className="text-xs font-bold text-slate-900 dark:text-white hover:text-emerald-700 cursor-pointer"
                                  >
                                    {oi.productTitle} (Qty: {oi.quantity})
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    Rental Period: <strong>{oi.startDate}</strong> to{' '}
                                    <strong>{oi.endDate}</strong> ({oi.rentalDays} days)
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    Pickup / Handover: {order.shippingAddress.street}
                                  </div>
                                </div>
                              </div>

                              <div className="text-left sm:text-right text-xs">
                                <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                                  {formatINR(oi.lineTotal)}
                                </div>
                                <div className="text-[11px] text-slate-400 tabular-nums">
                                  Rental: {formatINR(oi.rentalAmount)} + Dep:{' '}
                                  {formatINR(oi.securityDeposit)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="text-xs text-slate-500">
                            Recipient: <strong>{order.customerName}</strong> ({order.customerPhone})
                          </div>
                          <div className="flex items-center gap-2">
                            {order.orderStatus === 'Confirmed' && (
                              <button
                                type="button"
                                onClick={() => updateOrderStatus(order.id, 'Rented')}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors cursor-pointer"
                              >
                                Mark Picked Up / Active Rental
                              </button>
                            )}
                            {order.orderStatus === 'Rented' && (
                              <button
                                type="button"
                                onClick={() => updateOrderStatus(order.id, 'Returned')}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors cursor-pointer"
                              >
                                Mark Returned &amp; Complete
                              </button>
                            )}
                            {canCancel && (
                              <button
                                type="button"
                                onClick={() => updateOrderStatus(order.id, 'Cancelled')}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                              >
                                Cancel Rental Order
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: INCOMING OWNER REQUESTS */}
          {activeTab === 'incoming' && (
            <div className="space-y-4">
              {incomingRequests.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                  <Inbox className="w-10 h-10 text-slate-400 mx-auto stroke-1" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    No incoming rental requests right now
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When students request or order your equipment, they will appear here for you to manage.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incomingRequests.map((booking) => {
                    const item = getItemById(booking.itemId);
                    const borrower = getUserById(booking.borrowerId);

                    return (
                      <div
                        key={booking.id}
                        className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                            <ImageWithFallback
                              src={item?.photos[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                {item?.category}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                                {booking.status === 'pending'
                                  ? 'Pending Approval'
                                  : 'Accepted — Awaiting Handover'}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              {item?.title}
                            </h3>

                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {booking.startDate} to {booking.endDate} ({booking.totalDays} days)
                              </span>
                              <span>·</span>
                              <span className="tabular-nums font-semibold">
                                {formatINR(booking.totalPrice)} total (incl. {formatINR(booking.depositAmount)} deposit)
                              </span>
                            </div>

                            {booking.message && (
                              <p className="text-xs italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded mt-2">
                                &ldquo;{booking.message}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center gap-4 shrink-0">
                          <div
                            onClick={() => {
                              if (borrower) {
                                setSelectedUserId(borrower.id);
                                setCurrentTab('profile');
                              }
                            }}
                            className="cursor-pointer flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <img
                              src={borrower?.avatarUrl}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="text-left text-xs">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {borrower?.fullName}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {borrower?.department} ·{' '}
                                <span className="font-semibold text-emerald-600">
                                  {borrower?.trustScore}/100 Trust
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {booking.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => updateBookingStatus(booking.id, 'accepted')}
                                  className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                                >
                                  Accept Request
                                </button>
                                <button
                                  onClick={() => updateBookingStatus(booking.id, 'declined')}
                                  className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                                >
                                  Decline
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() =>
                                    updateBookingStatus(booking.id, 'picked_up', {
                                      handoverNotes: 'Handover complete at safe campus spot.',
                                    })
                                  }
                                  className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                                >
                                  Confirm Handover (Picked Up)
                                </button>
                                <button
                                  onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                                >
                                  Cancel Booking
                                </button>
                                <button
                                  onClick={() => setCurrentTab('messages')}
                                  className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Message</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Active Loans */}
              {activeLoans.length > 0 && (
                <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Equipment Currently Out on Loan ({activeLoans.length})</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">Awaiting return &amp; inspection</span>
                  </div>

                  <div className="space-y-3">
                    {activeLoans.map((booking) => {
                      const item = getItemById(booking.itemId);
                      const borrower = getUserById(booking.borrowerId);

                      return (
                        <div
                          key={booking.id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                              <ImageWithFallback
                                src={item?.photos[0]}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {item?.title}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Borrowed by: {borrower?.fullName} ({borrower?.department}) · Due:{' '}
                                {booking.endDate}
                              </div>
                              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                                Deposit held: {formatINR(booking.depositAmount)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedBookingForInspect(booking);
                                setInspectModalOpen(true);
                              }}
                              className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                            >
                              Inspect Return &amp; Settle Deposit
                            </button>
                            <button
                              onClick={() => setCurrentTab('messages')}
                              className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Message</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: ACTIVE BORROWS */}
          {activeTab === 'active_borrows' && (
            <div className="space-y-4">
              {activeBorrows.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                  <Clock className="w-10 h-10 text-slate-400 mx-auto stroke-1" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    No equipment currently in your possession
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Need tools for upcoming midterms or studio projects? Browse the catalog to rent.
                  </p>
                  <button
                    onClick={() => setCurrentTab('browse')}
                    className="px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Browse Items
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeBorrows.map((booking) => {
                    const item = getItemById(booking.itemId);
                    const owner = getUserById(booking.ownerId);

                    return (
                      <div
                        key={booking.id}
                        className="p-5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm space-y-4"
                      >
                        <div className="p-3 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                            <span>
                              <strong>Return Reminder:</strong> Due back on{' '}
                              <strong>{booking.endDate}</strong> to {owner?.fullName} at{' '}
                              {item?.pickupLocation}.
                            </span>
                          </div>
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">
                            Active Rental
                          </span>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg bg-white dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                              <ImageWithFallback
                                src={item?.photos[0]}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {item?.title}
                              </h3>
                              <div className="text-xs text-slate-500 mt-1">
                                Lender: {owner?.fullName} ({owner?.department}) · Deposit held:{' '}
                                {formatINR(booking.depositAmount)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedBookingForInspect(booking);
                                setInspectModalOpen(true);
                              }}
                              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer"
                            >
                              Complete Return &amp; Inspect
                            </button>
                            <button
                              onClick={() => setCurrentTab('messages')}
                              className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Message Owner</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: MY OUTBOUND REQUESTS */}
          {activeTab === 'my_requests' && (
            <div className="space-y-4">
              {myOutboundRequests.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                  <Send className="w-10 h-10 text-slate-400 mx-auto stroke-1" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    No pending outbound requests
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Items you request to rent or borrow will show their approval status here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myOutboundRequests.map((booking) => {
                    const item = getItemById(booking.itemId);
                    const owner = getUserById(booking.ownerId);

                    return (
                      <div
                        key={booking.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                            <ImageWithFallback
                              src={item?.photos[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              {item?.title}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Owner: {owner?.fullName} · {booking.startDate} to {booking.endDate}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-1 rounded text-xs font-bold ${
                              booking.status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {booking.status === 'accepted' ? 'Approved by Owner' : 'Pending Review'}
                          </span>

                          <button
                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                            className="text-xs text-rose-600 hover:underline cursor-pointer"
                          >
                            Cancel Request
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: MY LISTINGS (Owner / Seller) */}
          {activeTab === 'my_listings' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-xs text-slate-500">
                  Showing {myListings.length} equipment listings owned by your account.
                </div>
                <button
                  onClick={() => setCurrentTab('post')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer"
                >
                  + Add New Product
                </button>
              </div>

              {myListings.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                  <Package className="w-10 h-10 text-slate-400 mx-auto stroke-1" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    You have not listed any items yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Have drafting tools, textbooks, or lab equipment? Share it with campus peers!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myListings.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between"
                    >
                      <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                        <ImageWithFallback
                          src={item.photos[0]}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        {item.isSeniorsSale && (
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white flex items-center gap-1 shadow-sm">
                              <GraduationCap className="w-3 h-3" />
                              <span>Seniors&apos; Sale</span>
                            </span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              item.status === 'available'
                                ? 'bg-emerald-600 text-white'
                                : item.status === 'rented'
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-600 text-white'
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div>
                          <div className="text-[11px] text-slate-400">{item.category}</div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                            {item.title}
                          </h3>
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                            {item.isFree ? 'Free to borrow' : `${formatINR(item.pricePerDay)}/day`} ·{' '}
                            {formatINR(item.depositAmount)} deposit
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-emerald-700 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => togglePauseItem(item.id)}
                            className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            {item.status === 'paused' ? (
                              <Play className="w-3.5 h-3.5" />
                            ) : (
                              <Pause className="w-3.5 h-3.5" />
                            )}
                            <span>{item.status === 'paused' ? 'Resume' : 'Pause'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedItemId(item.id);
                              setCurrentTab('detail');
                            }}
                            className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold cursor-pointer"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {confirmDeleteId === item.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  deleteItem(item.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(item.id)}
                              className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: OWNER EARNINGS SUMMARY (Section 12) */}
          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <div className="text-xs font-semibold text-slate-500">Total Rental Earnings (INR)</div>
                  <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {formatINR(totalOwnerEarnings)}
                  </div>
                  <div className="text-[11px] text-slate-400">Net rental revenue from your listings</div>
                </div>
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <div className="text-xs font-semibold text-slate-500">Active Listings</div>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {myListings.filter((i) => i.status === 'available').length}
                  </div>
                  <div className="text-[11px] text-slate-400">Out of {myListings.length} total listings</div>
                </div>
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <div className="text-xs font-semibold text-slate-500">Completed Rentals</div>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {completedOwnerBookings.length + sellerOrderItems.length}
                  </div>
                  <div className="text-[11px] text-slate-400">Across peer requests &amp; orders</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Rental Transactions on Your Listings
                </h3>
                {sellerOrderItems.length === 0 && completedOwnerBookings.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No completed rental transactions on your listings yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {sellerOrderItems.map((si, idx) => (
                      <div
                        key={`${si.orderId}_${idx}`}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {si.productTitle} (Qty: {si.quantity})
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Rented by {si.buyerName} · {si.startDate} to {si.endDate} ({si.rentalDays} days)
                          </div>
                        </div>
                        <div className="text-right font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          +{formatINR(si.rentalAmount)}
                        </div>
                      </div>
                    ))}
                    {completedOwnerBookings.map((b) => {
                      const item = getItemById(b.itemId);
                      const borrower = getUserById(b.borrowerId);
                      return (
                        <div
                          key={b.id}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {item?.title || 'Equipment'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Borrowed by {borrower?.fullName} · {b.startDate} to {b.endDate}
                            </div>
                          </div>
                          <div className="text-right font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                            +{formatINR(Math.max(0, b.totalPrice - b.depositAmount))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: HISTORY & REVIEWS */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {completedHistory.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                  <History className="w-10 h-10 text-slate-400 mx-auto stroke-1" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    No past rental history yet
                  </h3>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedHistory.map((booking) => {
                    const item = getItemById(booking.itemId);
                    const isOwner = currentUser.id === booking.ownerId;
                    const otherParty = isOwner
                      ? getUserById(booking.borrowerId)
                      : getUserById(booking.ownerId);
                    const reviewed = hasReviewed(booking.id);

                    return (
                      <div
                        key={booking.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                            <ImageWithFallback
                              src={item?.photos[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              {item?.title}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {isOwner ? 'Lent to' : 'Borrowed from'} {otherParty?.fullName} ·{' '}
                              {booking.startDate} to {booking.endDate}
                            </div>
                            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                              Deposit Status: {booking.depositStatus}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {booking.status === 'returned' && !reviewed && (
                            <button
                              onClick={() => {
                                setBookingForReview(booking);
                                setReviewModalOpen(true);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-500" />
                              <span>Leave Peer Review</span>
                            </button>
                          )}

                          {reviewed && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Reviewed</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    My Saved Delivery &amp; Pickup Addresses ({addresses.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Stored against your private account ID for fast checkout.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedUserId(currentUser.id);
                    setCurrentTab('profile');
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer"
                >
                  + Add Address in Profile
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  No saved addresses yet. Add a dorm or campus pickup address in your Profile or during Checkout.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-slate-900 dark:text-white">{addr.label}</div>
                        <div className="text-slate-700 dark:text-slate-300">{addr.fullName}</div>
                        <div className="text-slate-500">
                          {addr.street}, {addr.city}, {addr.state} {addr.postalCode}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSavedAddress(addr.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Account Notifications ({myNotifications.length})
              </h3>
              {myNotifications.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  You have no notifications right now.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myNotifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white">{n.title}</div>
                        <div className="text-slate-600 dark:text-slate-300">{n.message}</div>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {n.createdAt.split('T')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* INSPECT & RETURN MODAL */}
      {inspectModalOpen && selectedBookingForInspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Inspect Item &amp; Settle Deposit
                </h3>
                <p className="text-xs text-slate-500">
                  Verify the physical condition of the returned equipment.
                </p>
              </div>
              <button
                onClick={() => setInspectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInspectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deposit Settlement Status *
                </label>
                <select
                  value={depositSettlement}
                  onChange={(e) => setDepositSettlement(e.target.value as DepositStatus)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                >
                  <option value="refunded">
                    Refund Deposit in Full ({formatINR(selectedBookingForInspect.depositAmount)})
                  </option>
                  <option value="withheld_partial">
                    Withhold Partial Deposit for Minor Damage
                  </option>
                  <option value="withheld_full">
                    Withhold Entire Deposit for Loss / Severe Damage
                  </option>
                </select>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={damageReported}
                    onChange={(e) => setDamageReported(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700"
                  />
                  <span>File a Handover Damage Report</span>
                </label>

                {damageReported && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Amount to withhold (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={selectedBookingForInspect.depositAmount}
                        value={withheldAmount}
                        onChange={(e) => setWithheldAmount(e.target.value)}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Damage details &amp; physical description
                      </label>
                      <textarea
                        rows={2}
                        value={damageDetails}
                        onChange={(e) => setDamageDetails(e.target.value)}
                        placeholder="e.g. Scratched lens, missing stylus..."
                        className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded p-2"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Handover &amp; Return Inspection Notes
                </label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInspectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                >
                  Confirm Return &amp; Deposit Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TWO-WAY REVIEW MODAL */}
      {reviewModalOpen && bookingForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Leave a Peer Review
                </h3>
                <p className="text-xs text-slate-500">
                  Your feedback influences their campus Trust Score.
                </p>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Star Rating
                </label>
                <InteractiveStarPicker
                  value={reviewRating}
                  onChange={(val) => setReviewRating(val)}
                  size="md"
                />
              </div>

              {currentUser.id !== bookingForReview.ownerId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Equipment Condition Accuracy
                  </label>
                  <select
                    value={conditionAccuracy}
                    onChange={(e) => setConditionAccuracy(e.target.value as ConditionAccuracy)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="Exact Match">Exact Match to Listing</option>
                    <option value="Better Than Expected">Better Than Expected</option>
                    <option value="Minor Wear">Minor Unlisted Wear</option>
                    <option value="Not As Described">Not As Described</option>
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={returnedOnTime}
                    onChange={(e) => setReturnedOnTime(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700"
                  />
                  <span>Handed over / returned on time</span>
                </label>

                {currentUser.id !== bookingForReview.ownerId && (
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wouldBorrowAgain}
                      onChange={(e) => setWouldBorrowAgain(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-700"
                    />
                    <span>I would borrow this equipment again</span>
                  </label>
                )}
              </div>

              {currentUser.id !== bookingForReview.ownerId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Equipment Quality Highlights
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Clean & Well-Maintained',
                      'Worked Flawlessly',
                      'Accurate Calibration',
                      'Battery 100%',
                      'Complete Kit',
                      'Saved Money',
                    ].map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            setSelectedTags((prev) =>
                              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                            )
                          }
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                            active
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {active ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Comments &amp; Equipment Feedback *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about equipment quality, calibration, punctuality, and care..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-2xl my-8">
            <PostItemPage
              initialItem={editingItem}
              onClose={() => setEditingItem(null)}
              setCurrentTab={setCurrentTab}
              setSelectedItemId={setSelectedItemId}
            />
          </div>
        </div>
      )}
    </div>
  );
};
