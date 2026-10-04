import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Category, WishlistPriority } from '../types';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { StarRatingDisplay } from '../components/common/StarRating';
import { formatINR } from '../utils/currency';
import {
  Heart,
  MoreVertical,
  Bell,
  BellOff,
  Trash2,
  ExternalLink,
  Calendar,
  MapPin,
  GraduationCap,
  CheckCircle2,
  Sparkles,
  Share2,
  MessageSquare,
  SlidersHorizontal,
  Edit3,
  Check,
  X,
  ArrowRight,
  Plus,
  User as UserIcon,
  ShoppingCart,
  Lock,
  ShieldCheck,
} from 'lucide-react';

interface WishlistPageProps {
  setCurrentTab: (tab: string) => void;
  setSelectedItemId: (id: string) => void;
  setSelectedUserId: (userId: string) => void;
}

const CATEGORIES: Category[] = [
  'Engineering Tools',
  'Books',
  'Electronics',
  'Lab Equipment',
  'Furniture',
  'Clothing',
  'Sports',
  'Other',
];

export const WishlistPage: React.FC<WishlistPageProps> = ({
  setCurrentTab,
  setSelectedItemId,
  setSelectedUserId,
}) => {
  const {
    items,
    wishlist,
    wishlistMeta,
    toggleWishlist,
    updateWishlistMeta,
    clearWishlist,
    addToCart,
    getUserById,
    getItemRatingStats,
    sendMessage,
    currentUser,
    showToast,
  } = useApp();

  // Left-side filter & sort state
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'available' | 'rented' | 'free' | 'high_priority' | 'top_rated'
  >('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'recent' | 'price_asc' | 'rating'>('priority');

  // Left-side sidebar three-dot menu state
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false);
  const sidebarMenuRef = useRef<HTMLDivElement>(null);

  // Per-card left-side three-dot menu state
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);

  // Inline note editing state
  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>('');

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarMenuRef.current && !sidebarMenuRef.current.contains(e.target as Node)) {
        setSidebarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Resolve wishlisted items ONLY for the authenticated user
  const wishlistedItems = useMemo(() => {
    if (!currentUser) return [];
    return wishlist
      .map((id) => items.find((i) => i.id === id))
      .filter((i): i is NonNullable<typeof i> => Boolean(i));
  }, [wishlist, items, currentUser]);

  // Filtered and sorted wishlist items
  const filteredWishlist = useMemo(() => {
    const priorityRank: Record<WishlistPriority, number> = {
      High: 3,
      Medium: 2,
      Low: 1,
    };

    return wishlistedItems
      .filter((item) => {
        const meta = wishlistMeta[item.id];
        const stats = getItemRatingStats(item.id);

        if (statusFilter === 'available' && item.status !== 'available') return false;
        if (statusFilter === 'rented' && item.status !== 'rented') return false;
        if (statusFilter === 'free' && !item.isFree && !item.isSeniorsSale) return false;
        if (statusFilter === 'high_priority' && meta?.priority !== 'High') return false;
        if (statusFilter === 'top_rated' && stats.averageRating < 4.5) return false;

        if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const metaA = wishlistMeta[a.id];
        const metaB = wishlistMeta[b.id];

        if (sortBy === 'priority') {
          const pA = priorityRank[metaA?.priority || 'Medium'];
          const pB = priorityRank[metaB?.priority || 'Medium'];
          if (pB !== pA) return pB - pA;
        }
        if (sortBy === 'price_asc') {
          const priceA = a.isFree ? 0 : a.pricePerDay;
          const priceB = b.isFree ? 0 : b.pricePerDay;
          return priceA - priceB;
        }
        if (sortBy === 'rating') {
          const rA = getItemRatingStats(a.id).averageRating;
          const rB = getItemRatingStats(b.id).averageRating;
          return rB - rA;
        }
        const tA = new Date(metaA?.addedAt || a.createdAt).getTime();
        const tB = new Date(metaB?.addedAt || b.createdAt).getTime();
        return tB - tA;
      });
  }, [wishlistedItems, wishlistMeta, statusFilter, categoryFilter, sortBy, getItemRatingStats]);

  // Calculate savings estimate
  const totalRetailValue = useMemo(() => {
    return wishlistedItems.reduce((sum, item) => sum + (item.replacementCostEstimate || 6500), 0);
  }, [wishlistedItems]);

  const totalThreeDayRental = useMemo(() => {
    return wishlistedItems.reduce(
      (sum, item) => sum + (item.isFree ? 0 : item.pricePerDay * 3),
      0
    );
  }, [wishlistedItems]);

  const estimatedSavings = Math.max(0, Math.round(totalRetailValue - totalThreeDayRental));

  // Suggested items not yet in wishlist
  const suggestedItems = useMemo(() => {
    return items.filter((i) => !wishlist.includes(i.id)).slice(0, 4);
  }, [items, wishlist]);

  // Protected route check: require authentication to view private user wishlist
  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Sign in to access your private Wishlist
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Every student&apos;s Wishlist is strictly isolated and stored against your unique account ID. Sign in or create an account to save equipment and track availability.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentTab('auth')}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-colors cursor-pointer"
          >
            Sign In / Create Account
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('browse')}
            className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Browse Catalog
          </button>
        </div>
      </div>
    );
  }

  const handleEnableAllAlerts = () => {
    wishlistedItems.forEach((item) => {
      updateWishlistMeta(item.id, { notifyOnAvailable: true });
    });
    setSidebarMenuOpen(false);
    showToast('Enabled availability notifications for all saved wishlist items!', 'success');
  };

  const handleSetAllHighPriority = () => {
    wishlistedItems.forEach((item) => {
      updateWishlistMeta(item.id, { priority: 'High' });
    });
    setSidebarMenuOpen(false);
    showToast('Marked all saved wishlist items as High Priority.', 'success');
  };

  const handleShareWishlist = () => {
    const summary = wishlistedItems
      .map((i) => `• ${i.title} (${i.isFree ? 'Free' : `${formatINR(i.pricePerDay)}/day`})`)
      .join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`My RentReuse Campus Wishlist:\n${summary}`);
    }
    setSidebarMenuOpen(false);
    showToast('Wishlist summary copied to clipboard!', 'success');
  };

  const handleSaveNote = (itemId: string) => {
    updateWishlistMeta(itemId, { note: noteDraft.trim() });
    setEditingNoteItemId(null);
  };

  const handleMoveToCart = async (itemId: string) => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 1);
    const end = new Date(today);
    end.setDate(today.getDate() + 4);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    await addToCart({
      itemId,
      quantity: 1,
      startDate: startStr,
      endDate: endStr,
    });
  };

  const handleQuickAskOwner = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    sendMessage({
      recipientId: item.ownerId,
      itemId: item.id,
      content: `Hi! I saved your "${item.title}" to my campus wishlist. Is it available to borrow this week?`,
    });
    setOpenCardMenuId(null);
    showToast('Availability inquiry sent to owner! View in Messages.', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Private Account Wishlist · Isolated for {currentUser.fullName} ({currentUser.email})
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            My Equipment Wishlist ({wishlistedItems.length})
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Organize gear for upcoming labs and exams, set priority levels, or move items directly to your rental cart.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCurrentTab('cart')}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
            <span>View Cart</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('browse')}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add More Gear</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDE: SCROLLABLE OPTIONS PANEL */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="relative" ref={sidebarMenuRef}>
                  <button
                    type="button"
                    onClick={() => setSidebarMenuOpen((prev) => !prev)}
                    aria-label="Wishlist options menu"
                    title="Open Wishlist Options Menu"
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 shadow-xs transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {sidebarMenuOpen && (
                    <div className="absolute left-0 mt-2 w-64 max-h-72 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        Wishlist Quick Actions
                      </div>

                      <button
                        type="button"
                        onClick={handleEnableAllAlerts}
                        className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Bell className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Enable All Return Alerts</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSetAllHighPriority}
                        className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Set All to High Priority</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleShareWishlist}
                        className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Copy & Share Wishlist</span>
                      </button>

                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Quick Filter Presets
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('available');
                          setSidebarMenuOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Show Available Now Only</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('free');
                          setSidebarMenuOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Show Free / Pass-It-On Only</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('all');
                          setCategoryFilter('all');
                          setSidebarMenuOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Reset Wishlist Filters</span>
                      </button>

                      {wishlistedItems.length > 0 && (
                        <>
                          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                          <button
                            type="button"
                            onClick={() => {
                              clearWishlist();
                              setSidebarMenuOpen(false);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 font-semibold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Clear Entire Wishlist</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Wishlist Options
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Filters & quick actions
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {filteredWishlist.length}/{wishlistedItems.length}
              </span>
            </div>

            <div className="p-4 max-h-[68vh] overflow-y-auto space-y-6">
              {/* 1. Availability & Priority Views */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Filter by Status
                </div>
                {(
                  [
                    {
                      id: 'all',
                      label: 'All Saved Gear',
                      count: wishlistedItems.length,
                    },
                    {
                      id: 'available',
                      label: 'Available Right Now',
                      count: wishlistedItems.filter((i) => i.status === 'available').length,
                    },
                    {
                      id: 'rented',
                      label: 'Currently Rented (Alert On)',
                      count: wishlistedItems.filter((i) => i.status === 'rented').length,
                    },
                    {
                      id: 'high_priority',
                      label: 'High Priority for Term',
                      count: wishlistedItems.filter((i) => wishlistMeta[i.id]?.priority === 'High').length,
                    },
                    {
                      id: 'free',
                      label: "Free / Seniors' Pass-It-On",
                      count: wishlistedItems.filter((i) => i.isFree || i.isSeniorsSale).length,
                    },
                    {
                      id: 'top_rated',
                      label: '4.5★ & Up Rated Gear',
                      count: wishlistedItems.filter(
                        (i) => getItemRatingStats(i.id).averageRating >= 4.5
                      ).length,
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStatusFilter(opt.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      statusFilter === opt.id
                        ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span
                      className={`text-[11px] tabular-nums ${
                        statusFilter === opt.id ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      {opt.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* 2. Sort Order */}
              <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Sort Saved Items
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="priority">Priority: High to Low</option>
                  <option value="recent">Recently Added</option>
                  <option value="price_asc">Daily Rate: Low to High</option>
                  <option value="rating">Highest Star Rating (★)</option>
                </select>
              </div>

              {/* 3. Category Filter List */}
              <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Filter by Category
                </div>
                <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      categoryFilter === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>All Categories</span>
                    <span className="tabular-nums text-[11px]">{wishlistedItems.length}</span>
                  </button>
                  {CATEGORIES.map((cat) => {
                    const count = wishlistedItems.filter((i) => i.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          categoryFilter === cat
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        <span className="tabular-nums text-[11px]">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Student Savings Calculator */}
              {wishlistedItems.length > 0 && (
                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Campus Circular Savings (INR)
                  </div>
                  <div className="flex items-baseline justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Retail cost to buy new:</span>
                    <span className="font-semibold line-through tabular-nums">{formatINR(totalRetailValue)}</span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Est. 3-day peer rental:</span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatINR(totalThreeDayRental)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-emerald-200/80 dark:border-emerald-800 flex items-baseline justify-between text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                    <span>You Save on Campus:</span>
                    <span className="text-base tabular-nums">{formatINR(estimatedSavings)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* RIGHT SIDE: WORKABLE WISHLIST EQUIPMENT CARDS */}
        <div className="lg:col-span-8 space-y-6">
          {filteredWishlist.length === 0 ? (
            <div className="p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-4">
              <Heart className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto stroke-1" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {wishlistedItems.length === 0
                    ? 'Your personal wishlist is currently empty'
                    : 'No saved items match your current filter'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {wishlistedItems.length === 0
                    ? 'Tap the heart icon on any item in the catalog to save equipment to your private account wishlist.'
                    : 'Try switching back to "All Saved Gear" in the left-side options panel.'}
                </p>
              </div>
              <div className="flex justify-center gap-3">
                {wishlistedItems.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('all');
                      setCategoryFilter('all');
                    }}
                    className="px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg cursor-pointer"
                  >
                    Show All Saved Items ({wishlistedItems.length})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentTab('browse')}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm cursor-pointer"
                  >
                    Explore Campus Catalog
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWishlist.map((item) => {
                const owner = getUserById(item.ownerId);
                const ratingStats = getItemRatingStats(item.id);
                const meta = wishlistMeta[item.id] || {
                  itemId: item.id,
                  addedAt: item.createdAt,
                  priority: 'Medium' as WishlistPriority,
                  notifyOnAvailable: true,
                  note: '',
                };
                const isCardMenuOpen = openCardMenuId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all space-y-4 relative"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {/* Left-Side Three-Dot Options Menu + Thumbnail */}
                      <div className="flex items-start gap-3 w-full sm:w-auto">
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenCardMenuId(isCardMenuOpen ? null : item.id)
                            }
                            aria-label="Item options"
                            title="Item Options Menu"
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-500 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isCardMenuOpen && (
                            <div className="absolute left-0 mt-1.5 w-60 max-h-60 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                Equipment Options
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenCardMenuId(null);
                                  handleMoveToCart(item.id);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 font-semibold cursor-pointer"
                              >
                                <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                                <span>Add to Rental Cart</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenCardMenuId(null);
                                  setSelectedItemId(item.id);
                                  setCurrentTab('detail');
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 font-semibold cursor-pointer"
                              >
                                <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>
                                  {item.isFree ? 'Borrow Now (Free)' : 'View Details & Dates'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenCardMenuId(null);
                                  setEditingNoteItemId(item.id);
                                  setNoteDraft(meta.note || '');
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span>Edit Course / Lab Note</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  updateWishlistMeta(item.id, {
                                    notifyOnAvailable: !meta.notifyOnAvailable,
                                  });
                                  setOpenCardMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                {meta.notifyOnAvailable ? (
                                  <>
                                    <BellOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>Mute Availability Alert</span>
                                  </>
                                ) : (
                                  <>
                                    <Bell className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>Notify When Available</span>
                                  </>
                                )}
                              </button>

                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Set Term Priority
                              </div>

                              {(['High', 'Medium', 'Low'] as WishlistPriority[]).map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => {
                                    updateWishlistMeta(item.id, { priority: p });
                                    setOpenCardMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-1.5 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                                >
                                  <span>{p} Priority</span>
                                  {meta.priority === p && (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  )}
                                </button>
                              ))}

                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                              <button
                                type="button"
                                onClick={() => handleQuickAskOwner(item.id)}
                                className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span>Ask {owner?.fullName.split(' ')[0]} a Question</span>
                              </button>

                              {owner && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenCardMenuId(null);
                                    setSelectedUserId(owner.id);
                                    setCurrentTab('profile');
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <UserIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span>View Owner Profile ({owner.trustScore} Trust)</span>
                                </button>
                              )}

                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenCardMenuId(null);
                                  toggleWishlist(item.id);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 font-semibold cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Remove from Wishlist</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Item Thumbnail */}
                        <div
                          onClick={() => {
                            setSelectedItemId(item.id);
                            setCurrentTab('detail');
                          }}
                          className="w-24 h-24 sm:w-28 sm:h-24 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 cursor-pointer border border-slate-200/70 dark:border-slate-800"
                        >
                          <ImageWithFallback
                            src={item.photos[0]}
                            alt={item.title}
                            fallbackTitle={item.title}
                            category={item.category}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </div>

                      {/* Item Core Details */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
                            <span>{item.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{item.condition}</span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                item.status === 'available'
                                  ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                                  : 'text-amber-600 dark:text-amber-400 font-semibold'
                              }
                            >
                              {item.status === 'available'
                                ? 'Available Now'
                                : 'Currently Rented Out'}
                            </span>
                          </div>

                          <StarRatingDisplay
                            rating={ratingStats.averageRating}
                            totalReviews={ratingStats.totalReviews}
                            size="xs"
                          />
                        </div>

                        <h3
                          onClick={() => {
                            setSelectedItemId(item.id);
                            setCurrentTab('detail');
                          }}
                          className="text-base font-bold text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          {item.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{item.pickupLocation}</span>
                          </span>
                          {owner && (
                            <span>
                              Owner: <strong className="text-slate-700 dark:text-slate-300">{owner.fullName}</strong> ({owner.trustScore}/100 Trust)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price & Primary CTA */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                        <div className="text-left sm:text-right">
                          {item.isFree ? (
                            <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                              Free to Borrow
                            </div>
                          ) : (
                            <div>
                              <span className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
                                {formatINR(item.pricePerDay)}
                              </span>
                              <span className="text-xs text-slate-500">/day</span>
                            </div>
                          )}
                          <div className="text-[11px] text-slate-400 tabular-nums">
                            {item.depositAmount > 0 ? `${formatINR(item.depositAmount)} refundable dep.` : 'No deposit'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.status === 'available' && item.ownerId !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() => handleMoveToCart(item.id)}
                              className="px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Add to Cart</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItemId(item.id);
                              setCurrentTab('detail');
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors cursor-pointer"
                          >
                            {item.status === 'available'
                              ? item.isFree
                                ? 'Borrow Now'
                                : 'Rent Now'
                              : 'View Details'}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleWishlist(item.id)}
                            title="Remove from wishlist"
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Bar: Priority Control, Availability Alert Toggle & Study Note */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">Priority:</span>
                          {(['High', 'Medium', 'Low'] as WishlistPriority[]).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => updateWishlistMeta(item.id, { priority: p })}
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                                meta.priority === p
                                  ? p === 'High'
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                    : p === 'Medium'
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>

                        <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>

                        <button
                          type="button"
                          onClick={() =>
                            updateWishlistMeta(item.id, {
                              notifyOnAvailable: !meta.notifyOnAvailable,
                            })
                          }
                          className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
                            meta.notifyOnAvailable
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {meta.notifyOnAvailable ? (
                            <>
                              <Bell className="w-3 h-3" />
                              <span>Return Alert On</span>
                            </>
                          ) : (
                            <>
                              <BellOff className="w-3 h-3" />
                              <span>Alert Muted</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Personal Course / Lab Note */}
                      <div className="flex items-center gap-2">
                        {editingNoteItemId === item.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              placeholder="e.g. Needed for MECH 302 Week 5 lab..."
                              className="text-xs px-2.5 py-1 rounded-lg border border-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none w-56"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveNote(item.id)}
                              className="p-1 rounded bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNoteItemId(null)}
                              className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteItemId(item.id);
                              setNoteDraft(meta.note || '');
                            }}
                            className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>
                              {meta.note ? `Note: "${meta.note}"` : 'Add course or lab note'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Suggested Equipment Section */}
          {suggestedItems.length > 0 && (
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Recommended Campus Gear to Save
                  </h2>
                  <p className="text-xs text-slate-500">
                    Popular tools and textbooks currently available from verified peers
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentTab('browse')}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {suggestedItems.map((item) => {
                  const stats = getItemRatingStats(item.id);
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 hover:border-emerald-500/50 transition-colors"
                    >
                      <div
                        onClick={() => {
                          setSelectedItemId(item.id);
                          setCurrentTab('detail');
                        }}
                        className="flex items-center gap-3 min-w-0 cursor-pointer"
                      >
                        <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                          <ImageWithFallback
                            src={item.photos[0]}
                            alt={item.title}
                            category={item.category}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] text-slate-400 truncate">
                            {item.category} · ★ {stats.averageRating.toFixed(1)}
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </div>
                          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            {item.isFree ? 'Free' : `${formatINR(item.pricePerDay)}/day`}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleWishlist(item.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-700 hover:text-white text-slate-700 dark:text-slate-200 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
