import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { TrustBadge } from '../components/common/TrustBadge';
import { StarRatingDisplay, InteractiveStarPicker } from '../components/common/StarRating';
import { formatINR, calculateINRRentalBreakdown } from '../utils/currency';
import { isValidImageUrl, getFallbackProductImage } from '../utils/imageValidation';
import {
  Calendar,
  MapPin,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Heart,
  Flag,
  Check,
  GraduationCap,
  ChevronLeft,
  X,
  ShoppingCart,
  Star,
  Plus,
  Minus,
} from 'lucide-react';

interface ItemDetailPageProps {
  itemId: string;
  onBack: () => void;
  setCurrentTab: (tab: string) => void;
  setSelectedUserId: (userId: string) => void;
}

export const ItemDetailPage: React.FC<ItemDetailPageProps> = ({
  itemId,
  onBack,
  setCurrentTab,
  setSelectedUserId,
}) => {
  const {
    getItemById,
    getUserById,
    currentUser,
    requestBooking,
    addToCart,
    bookings,
    checkDateOverlap,
    wishlist,
    toggleWishlist,
    submitReport,
    submitReview,
    getReviewsForUser,
    getReviewsForItem,
    getItemRatingStats,
    showToast,
  } = useApp();

  const item = getItemById(itemId);
  const owner = item ? getUserById(item.ownerId) : undefined;

  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(tomorrowStr);
  const [endDate, setEndDate] = useState(nextWeekStr);
  const [quantity, setQuantity] = useState(1);
  const [borrowerMessage, setBorrowerMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product review form state
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<
    'inappropriate_content' | 'no_show' | 'damaged_item' | 'scam_or_fraud' | 'unauthorized_fees' | 'other'
  >('inappropriate_content');
  const [reportDetails, setReportDetails] = useState('');

  useEffect(() => {
    setSelectedPhotoIdx(0);
    setQuantity(1);
  }, [itemId]);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    const diff = e - s;
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [startDate, endDate]);

  const hasConflict = useMemo(() => {
    if (!item) return false;
    return checkDateOverlap(item.id, startDate, endDate);
  }, [checkDateOverlap, item, startDate, endDate]);

  if (!item || !owner) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Item not found</h2>
        <p className="text-xs text-slate-500">The listing may have been removed or updated.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg cursor-pointer"
        >
          Return to Browse
        </button>
      </div>
    );
  }

  const maxStock = item.quantityAvailable ?? 1;
  const galleryPhotos = useMemo(() => {
    const valid = (item.photos || []).filter(isValidImageUrl);
    return valid.length > 0
      ? valid
      : [getFallbackProductImage(item.title, item.category, item.id)];
  }, [item]);

  const inrBreakdown = calculateINRRentalBreakdown({
    dailyRate: item.isFree ? 0 : item.pricePerDay,
    rentalDays: totalDays,
    quantity,
    depositPerUnit: item.depositAmount || 0,
  });

  const isWished = currentUser ? wishlist.includes(item.id) : false;
  const isOwner = currentUser?.id === item.ownerId;

  const itemConfirmedBookings = bookings.filter(
    (b) => b.itemId === item.id && (b.status === 'accepted' || b.status === 'picked_up')
  );

  const ownerReviews = getReviewsForUser(owner.id);
  const itemReviews = getReviewsForItem(item.id);
  const ratingStats = getItemRatingStats(item.id);

  const handleAddToCartClick = async () => {
    if (!currentUser) {
      showToast('Please sign in to add items to your personal rental cart.', 'info');
      setCurrentTab('auth');
      return;
    }
    if (isOwner) {
      showToast('You cannot rent your own listing.', 'error');
      return;
    }
    if (item.status !== 'available') {
      showToast('This item is currently unavailable for rental.', 'error');
      return;
    }
    const res = await addToCart({
      itemId: item.id,
      quantity,
      startDate,
      endDate,
    });
    if (res.success) {
      setCurrentTab('cart');
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to request a rental.', 'info');
      setCurrentTab('auth');
      return;
    }
    if (isOwner) {
      showToast('You cannot rent your own item.', 'error');
      return;
    }
    if (hasConflict) {
      showToast('These dates conflict with an existing confirmed rental.', 'error');
      return;
    }

    setIsSubmitting(true);
    const result = await requestBooking({
      itemId: item.id,
      startDate,
      endDate,
      message: borrowerMessage,
    });

    setIsSubmitting(false);
    if (result.success) {
      setCurrentTab('dashboard');
    }
  };

  const handleProductReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to submit a verified review.', 'info');
      setCurrentTab('auth');
      return;
    }
    if (!newReviewComment.trim()) {
      showToast('Please write a comment for your review.', 'error');
      return;
    }
    setIsSubmittingReview(true);
    submitReview({
      bookingId: `direct_rev_${Date.now()}`,
      itemId: item.id,
      revieweeId: owner.id,
      rating: newReviewRating,
      comment: newReviewComment.trim(),
      role: 'borrower_to_owner',
      returnedOnTime: true,
      conditionAccuracy: 'Exact Match',
      wouldBorrowAgain: true,
    });
    setNewReviewComment('');
    setIsSubmittingReview(false);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDetails.trim()) {
      showToast('Please provide details for the report', 'error');
      return;
    }

    submitReport({
      reportedItemId: item.id,
      reportedUserId: owner.id,
      reason: reportReason,
      details: reportDetails,
    });

    setReportModalOpen(false);
    setReportDetails('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 space-y-8">
          {/* Main Photo Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm">
              <ImageWithFallback
                src={galleryPhotos[selectedPhotoIdx] || galleryPhotos[0]}
                alt={item.title}
                fallbackTitle={item.title}
                category={item.category}
                itemId={item.id}
                className="w-full h-full object-cover"
              />

              {item.isSeniorsSale && (
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-emerald-700 text-white shadow-md">
                    <GraduationCap className="w-4 h-4" />
                    <span>Seniors&apos; Sale / Pass It On</span>
                  </span>
                </div>
              )}

              <button
                onClick={() => toggleWishlist(item.id)}
                aria-label="Toggle wishlist"
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-rose-500 shadow-sm transition-colors cursor-pointer"
              >
                <Heart className={`w-5 h-5 ${isWished ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            {galleryPhotos.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {galleryPhotos.map((photo, idx) => (
                  <button
                    key={`${photo}-${idx}`}
                    type="button"
                    onClick={() => setSelectedPhotoIdx(idx)}
                    aria-label={`View product image ${idx + 1}`}
                    className={`w-20 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      selectedPhotoIdx === idx
                        ? 'border-emerald-700 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <ImageWithFallback
                      src={photo}
                      alt={`${item.title} - Thumbnail ${idx + 1}`}
                      fallbackTitle={item.title}
                      category={item.category}
                      itemId={item.id}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Title & Metadata */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>{item.category}</span>
                <span aria-hidden="true">·</span>
                <span>
                  Condition: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{item.condition}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>Listed: {item.createdAt.split('T')[0]}</span>
              </div>
              <StarRatingDisplay
                rating={ratingStats.averageRating}
                totalReviews={ratingStats.totalReviews}
                size="sm"
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {item.title}
            </h1>

            {item.isSeniorsSale && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-emerald-900 dark:text-emerald-200">
                  <span className="font-bold">Semester-End &ldquo;Pass It On&rdquo; Item:</span> This item has been designated as free by a graduating senior to support incoming juniors.
                </div>
              </div>
            )}
          </div>

          {/* Full Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              About this item
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {/* Campus Pickup Spot */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Designated Campus Pickup Spot</span>
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                Verified Safe Zone
              </span>
            </div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              {item.pickupLocation}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Standard campus handover spot with 24/7 student foot traffic and CCTV surveillance for secure exchanges.
            </p>
          </div>

          {/* Availability Calendar Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Rental Schedule & Availability</span>
            </h3>
            {itemConfirmedBookings.length === 0 ? (
              <div className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4" />
                <span>Currently available — no reserved date conflicts.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Reserved dates (booking blocked during these periods):
                </div>
                <div className="space-y-1">
                  {itemConfirmedBookings.map((b) => (
                    <div
                      key={b.id}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between"
                    >
                      <span>Reserved: {b.startDate} to {b.endDate}</span>
                      <span className="font-semibold">{b.status === 'picked_up' ? 'In Use' : 'Confirmed'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Reviews & Ratings Section */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>Product Reviews & Ratings ({itemReviews.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Verified feedback from students who rented this equipment
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
                  ★ {ratingStats.averageRating.toFixed(1)}
                </div>
                <div className="text-[11px] text-slate-400">{ratingStats.totalReviews} reviews</div>
              </div>
            </div>

            {itemReviews.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No reviews yet for this item. Be the first to review after renting!</p>
            ) : (
              <div className="space-y-3">
                {itemReviews.map((rev) => {
                  const reviewer = getUserById(rev.reviewerId);
                  return (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {reviewer?.fullName || 'Verified Student'}
                          </span>
                          <span className="text-xs font-bold text-amber-500">
                            {'★'.repeat(rev.rating)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{rev.createdAt.split('T')[0]}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">&ldquo;{rev.comment}&rdquo;</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add a Product Review Form */}
            {currentUser && !isOwner && (
              <form onSubmit={handleProductReviewSubmit} className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Write a Review for {item.title}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">Your Rating:</span>
                  <InteractiveStarPicker value={newReviewRating} onChange={setNewReviewRating} size="md" />
                </div>
                <textarea
                  rows={2}
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder="Share your experience with this item's condition, accuracy, and handover..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  Submit Product Review
                </button>
              </form>
            )}
          </div>

          {/* Owner Profile Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                Listed by Peer
              </h3>
              <button
                onClick={() => {
                  setSelectedUserId(owner.id);
                  setCurrentTab('profile');
                }}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                View Full Student Profile
              </button>
            </div>

            <div className="flex items-start gap-4">
              <img
                src={owner.avatarUrl}
                alt={owner.fullName}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-600/20"
              />
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {owner.fullName}
                  </span>
                  <TrustBadge type="verified" />
                </div>
                <div className="text-xs text-slate-500">
                  {owner.department} · {owner.academicYear} · {owner.campus}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 line-clamp-2">
                  &ldquo;{owner.bio}&rdquo;
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {owner.trustScore}/100
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Trust Score</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                  {owner.totalRentalsCompleted}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Rentals Done</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                  {owner.onTimeReturnRate}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">On-Time Returns</div>
              </div>
            </div>
          </div>

          {/* Report Button */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>Listing ID: {item.id}</span>
            <button
              onClick={() => setReportModalOpen(true)}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report this listing or user</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Contiguous Rental Cart & Booking Module */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-5">
            {/* Multi-tier Price Headline */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  {item.isFree ? (
                    <div>
                      <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                        Free
                      </span>
                      <span className="text-xs text-slate-500 ml-1.5">No daily charge</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                        {formatINR(item.pricePerDay)}
                      </span>
                      <span className="text-xs text-slate-500">/day</span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500">Security Deposit:</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                    {item.depositAmount > 0 ? formatINR(item.depositAmount) : 'None'}
                  </div>
                </div>
              </div>

              {!item.isFree && (
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700">
                    <div className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatINR(item.pricePerDay)}/day
                    </div>
                    <div className="text-[10px] text-slate-400">Daily Rate</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700">
                    <div className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatINR(item.pricePerWeek ?? Math.round(item.pricePerDay * 5.5))}/week
                    </div>
                    <div className="text-[10px] text-slate-400">Weekly Rate</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700">
                    <div className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatINR(item.pricePerMonth ?? Math.round(item.pricePerDay * 20))}/month
                    </div>
                    <div className="text-[10px] text-slate-400">Monthly Rate</div>
                  </div>
                </div>
              )}
            </div>

            {/* Rental Configuration Form */}
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {/* Date pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rental Start Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rental End Date
                  </label>
                  <input
                    type="date"
                    min={startDate || todayStr}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                  />
                </div>
              </div>

              {/* Quantity selector */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Quantity
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {maxStock} unit{maxStock > 1 ? 's' : ''} available
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold tabular-nums">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                    className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cost Calculation Breakdown (INR) */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>
                    Rental Cost ({formatINR(item.isFree ? 0 : item.pricePerDay)} × {totalDays}{' '}
                    {totalDays === 1 ? 'day' : 'days'}
                    {quantity > 1 ? ` × ${quantity}` : ''})
                  </span>
                  <span className="tabular-nums font-semibold text-slate-900 dark:text-white">
                    {item.isFree ? 'Free (₹0)' : formatINR(inrBreakdown.rentalSubtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Security Deposit (Refundable)</span>
                  <span className="tabular-nums font-semibold text-slate-900 dark:text-white">
                    {formatINR(inrBreakdown.securityDepositTotal)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Platform Fee</span>
                  <span className="tabular-nums">{formatINR(inrBreakdown.platformFee)}</span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>GST / Tax</span>
                  <span className="tabular-nums">{formatINR(inrBreakdown.taxAmount)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white text-sm">
                  <span>Total Payable (INR)</span>
                  <span className="tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatINR(inrBreakdown.grandTotal)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 text-right">
                  {formatINR(inrBreakdown.securityDepositTotal)} deposit refunded in full upon safe on-time return.
                </div>
              </div>

              {hasConflict && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Date Conflict:</strong> Item is already reserved for part of this date range.
                  </span>
                </div>
              )}

              {/* Primary Add to Cart & Direct Request Actions */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleAddToCartClick}
                  disabled={hasConflict || isOwner || item.status !== 'available'}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white transition-all shadow-sm flex items-center justify-center gap-2 ${
                    isOwner || hasConflict || item.status !== 'available'
                      ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500'
                      : 'bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>
                    {isOwner
                      ? 'This is your listing'
                      : item.status !== 'available'
                      ? 'Currently Unavailable'
                      : 'Add to Rental Cart & Checkout'}
                  </span>
                </button>

                {/* Optional Message & Direct Peer Request */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <input
                    type="text"
                    value={borrowerMessage}
                    onChange={(e) => setBorrowerMessage(e.target.value)}
                    placeholder="Optional note to owner for direct request..."
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || hasConflict || isOwner || item.status === 'paused'}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Or Send Direct Peer Booking Request
                  </button>
                </div>
              </div>
            </form>

            {/* Campus Guarantee trust markers */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>User-isolated cart, orders, and security deposit protection</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Automatic reminder 1 day prior to return deadline</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REPORT MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-600" />
                <span>Report Item or User</span>
              </h3>
              <button
                onClick={() => setReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for report
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                >
                  <option value="inappropriate_content">Inappropriate or prohibited item</option>
                  <option value="scam_or_fraud">Scam, counterfeit, or misleading</option>
                  <option value="no_show">Repeated no-show / unresponsive owner</option>
                  <option value="damaged_item">Unreported severe damage</option>
                  <option value="unauthorized_fees">Charging unauthorized off-platform fees</option>
                  <option value="other">Other campus community concern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Details
                </label>
                <textarea
                  rows={3}
                  required
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Please describe what happened..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
