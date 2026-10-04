import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Category, ItemCondition } from '../types';
import { CAMPUS_PICKUP_SPOTS } from '../data/seedData';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { StarRatingDisplay } from '../components/common/StarRating';
import { formatINR } from '../utils/currency';
import { hasValidProductImage } from '../utils/imageValidation';
import {
  Search,
  SlidersHorizontal,
  Heart,
  GraduationCap,
  X,
  RotateCcw,
  ShoppingCart,
  MapPin,
  Clock,
} from 'lucide-react';

interface BrowsePageProps {
  setCurrentTab: (tab: string) => void;
  setSelectedItemId: (id: string) => void;
  initialCategory?: string;
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

const CONDITIONS: ItemCondition[] = ['Like New', 'Gently Used', 'Good', 'Fair'];

export const BrowsePage: React.FC<BrowsePageProps> = ({
  setCurrentTab,
  setSelectedItemId,
  initialCategory = 'All',
}) => {
  const { items, getUserById, wishlist, toggleWishlist, addToCart, getItemRatingStats, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedCondition, setSelectedCondition] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'under300' | 'under600' | 'under1500'>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [minDurationDays, setMinDurationDays] = useState<number>(0);
  const [onlySeniorsSale, setOnlySeniorsSale] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular' | 'trust'>('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedCondition('All');
    setSelectedLocation('All');
    setPriceFilter('all');
    setMinRating(0);
    setMinDurationDays(0);
    setOnlySeniorsSale(false);
    setOnlyAvailable(false);
    setSortBy('newest');
  };

  const handleQuickAddToCart = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 1);
    const end = new Date(today);
    end.setDate(today.getDate() + 4);
    await addToCart({
      itemId,
      quantity: 1,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  };

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (!hasValidProductImage(item)) return false;

        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          const matchLoc = item.pickupLocation.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCat && !matchLoc) return false;
        }

        if (selectedCategory !== 'All' && item.category !== selectedCategory) {
          return false;
        }

        if (selectedCondition !== 'All' && item.condition !== selectedCondition) {
          return false;
        }

        if (selectedLocation !== 'All' && item.pickupLocation !== selectedLocation) {
          return false;
        }

        if (priceFilter === 'free' && !item.isFree) return false;
        if (priceFilter === 'under300' && !item.isFree && item.pricePerDay > 300) return false;
        if (priceFilter === 'under600' && !item.isFree && item.pricePerDay > 600) return false;
        if (priceFilter === 'under1500' && !item.isFree && item.pricePerDay > 1500) return false;

        if (minRating > 0) {
          const rating = getItemRatingStats(item.id).averageRating || 0;
          if (rating < minRating) return false;
        }

        if (minDurationDays > 0 && item.maxRentalDays < minDurationDays) {
          return false;
        }

        if (onlySeniorsSale && !item.isSeniorsSale) return false;
        if (onlyAvailable && item.status !== 'available') return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') {
          const pA = a.isFree ? 0 : a.pricePerDay;
          const pB = b.isFree ? 0 : b.pricePerDay;
          return pA - pB;
        }
        if (sortBy === 'price_desc') {
          const pA = a.isFree ? 0 : a.pricePerDay;
          const pB = b.isFree ? 0 : b.pricePerDay;
          return pB - pA;
        }
        if (sortBy === 'rating') {
          const rA = getItemRatingStats(a.id).averageRating || 0;
          const rB = getItemRatingStats(b.id).averageRating || 0;
          return rB - rA;
        }
        if (sortBy === 'popular') {
          const revA = getItemRatingStats(a.id).totalReviews || a.viewsCount || 0;
          const revB = getItemRatingStats(b.id).totalReviews || b.viewsCount || 0;
          return revB - revA;
        }
        if (sortBy === 'trust') {
          const ownerA = getUserById(a.ownerId)?.trustScore ?? 0;
          const ownerB = getUserById(b.ownerId)?.trustScore ?? 0;
          return ownerB - ownerA;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [
    items,
    searchQuery,
    selectedCategory,
    selectedCondition,
    selectedLocation,
    priceFilter,
    minRating,
    minDurationDays,
    onlySeniorsSale,
    onlyAvailable,
    sortBy,
    getUserById,
    getItemRatingStats,
  ]);

  const activeFilterCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedCondition !== 'All' ? 1 : 0) +
    (selectedLocation !== 'All' ? 1 : 0) +
    (priceFilter !== 'all' ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (minDurationDays > 0 ? 1 : 0) +
    (onlySeniorsSale ? 1 : 0) +
    (onlyAvailable ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Campus Equipment Catalog
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Showing {filteredItems.length} of {items.length} peer-listed items available on campus
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, category, location, keywords..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort listings"
            className="px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
          >
            <option value="newest">Sort: Newest Listed</option>
            <option value="price_asc">Sort: Price Low to High</option>
            <option value="price_desc">Sort: Price High to Low</option>
            <option value="rating">Sort: Highest Rated (★)</option>
            <option value="popular">Sort: Most Popular</option>
            <option value="trust">Sort: Highest Owner Trust</option>
          </select>

          {/* Toggle Advanced Filters */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              filtersOpen || activeFilterCount > 0
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-emerald-700 text-white rounded-full text-[10px]">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Pills Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Categories
        </button>

        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}

        {/* Quick toggle for Seniors' Sale */}
        <button
          onClick={() => setOnlySeniorsSale(!onlySeniorsSale)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition-colors ml-auto cursor-pointer ${
            onlySeniorsSale
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Seniors&apos; Pass-It-On</span>
        </button>
      </div>

      {/* Collapsible Filter Drawer */}
      {filtersOpen && (
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 animate-in fade-in duration-150">
          {/* Price Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Daily Rental Rate (₹)
            </label>
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value as any)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Any Price (INR)</option>
              <option value="free">Free Only (₹0/day)</option>
              <option value="under300">₹300/day or less</option>
              <option value="under600">₹600/day or less</option>
              <option value="under1500">₹1,500/day or less</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Campus Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
            >
              <option value="All">All Campus Zones</option>
              {CAMPUS_PICKUP_SPOTS.map((spot) => (
                <option key={spot.name} value={spot.name}>
                  {spot.name}
                </option>
              ))}
            </select>
          </div>

          {/* Condition Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Item Condition
            </label>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
            >
              <option value="All">Any Condition</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Minimum Rating Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Minimum Rating
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
            >
              <option value={0}>Any Rating</option>
              <option value={4.5}>4.5★ & Above</option>
              <option value={4.0}>4.0★ & Above</option>
              <option value={3.0}>3.0★ & Above</option>
            </select>
          </div>

          {/* Rental Duration Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Rental Duration Needed
            </label>
            <select
              value={minDurationDays}
              onChange={(e) => setMinDurationDays(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
            >
              <option value={0}>Any Duration</option>
              <option value={3}>At least 3 days</option>
              <option value={7}>1 week+ (7 days)</option>
              <option value={14}>2 weeks+ (14 days)</option>
              <option value={30}>1 month+ (30 days)</option>
            </select>
          </div>

          {/* Availability & Reset */}
          <div className="flex flex-col justify-between">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Availability
            </label>
            <div className="flex items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span>Available Now</span>
              </label>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
          <div className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No items match your search criteria
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try clearing some filters or post a request on the Wanted Board so peers know what you need.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
            >
              Reset All Filters
            </button>
            <button
              onClick={() => setCurrentTab('wanted')}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
            >
              Post on Wanted Board
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const owner = getUserById(item.ownerId);
            const isWished = currentUser ? wishlist.includes(item.id) : false;
            const ratingStats = getItemRatingStats(item.id);
            const isOwner = currentUser?.id === item.ownerId;

            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedItemId(item.id);
                  setCurrentTab('detail');
                }}
                className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col relative"
              >
                {/* Wishlist button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(item.id);
                  }}
                  aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
                  title={isWished ? 'Remove from your private wishlist' : 'Save to your private wishlist'}
                  className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 shadow-sm transition-colors cursor-pointer"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isWished ? 'fill-rose-500 text-rose-500' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  />
                </button>

                {/* Photo container */}
                <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <ImageWithFallback
                    src={item.photos[0]}
                    alt={item.title}
                    fallbackTitle={item.title}
                    category={item.category}
                    itemId={item.id}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Seniors' Sale badge */}
                  {item.isSeniorsSale && (
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-700 text-white shadow-sm">
                        <GraduationCap className="w-3 h-3" />
                        <span>Seniors&apos; Sale</span>
                      </span>
                    </div>
                  )}

                  {/* Item status badge */}
                  {item.status === 'rented' && (
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-600 text-white shadow-sm">
                        Currently Rented
                      </span>
                    </div>
                  )}
                  {item.status === 'paused' && (
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-600 text-white shadow-sm">
                        Paused
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                        <span>{item.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.condition}</span>
                      </div>
                      <StarRatingDisplay
                        rating={ratingStats.averageRating}
                        totalReviews={ratingStats.totalReviews}
                        size="xs"
                      />
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h3>

                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{item.pickupLocation}</span>
                      </span>
                      <span className="flex items-center gap-1 shrink-0" title="Maximum rental duration">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Up to {item.maxRentalDays}d</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {/* Price and Deposit */}
                    <div className="flex items-center justify-between">
                      {item.isFree ? (
                        <div>
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                            Free
                          </span>
                          <span className="text-[11px] text-slate-400 ml-1">(₹0/day)</span>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            <span className="tabular-nums">{formatINR(item.pricePerDay)}</span>
                            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">/day</span>
                          </div>
                          {item.pricePerWeek !== undefined && item.pricePerWeek > 0 && (
                            <div className="text-[10px] text-slate-400 tabular-nums">
                              {formatINR(item.pricePerWeek)}/week · {formatINR(item.pricePerMonth ?? Math.round(item.pricePerDay * 20))}/month
                            </div>
                          )}
                        </div>
                      )}

                      {item.depositAmount > 0 ? (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          {formatINR(item.depositAmount)} dep.
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                          No deposit
                        </span>
                      )}
                    </div>

                    {/* Wishlist + Rent Now / Add to Cart actions */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(item.id);
                        }}
                        className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                          isWished
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWished ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{isWished ? 'Saved' : 'Wishlist'}</span>
                      </button>

                      {item.status === 'available' && !isOwner ? (
                        <button
                          type="button"
                          onClick={(e) => handleQuickAddToCart(e, item.id)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>Rent Now</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItemId(item.id);
                            setCurrentTab('detail');
                          }}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-900 dark:bg-slate-700 text-white transition-colors cursor-pointer"
                        >
                          <span>View Item</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
