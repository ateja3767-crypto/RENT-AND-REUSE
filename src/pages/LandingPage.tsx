import React from 'react';
import { useApp } from '../context/AppContext';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { StarRatingDisplay } from '../components/common/StarRating';
import { formatINR } from '../utils/currency';
import { hasValidProductImage } from '../utils/imageValidation';
import { 
  ArrowRight, 
  MapPin, 
  Clock, 
  Heart, 
  GraduationCap, 
} from 'lucide-react';
import { CAMPUS_PICKUP_SPOTS, HERO_CAMPUS_IMG } from '../data/seedData';

interface LandingPageProps {
  setCurrentTab: (tab: string) => void;
  setSelectedItemId: (id: string) => void;
  openPostModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  setCurrentTab,
  setSelectedItemId,
  openPostModal,
}) => {
  const { items, getUserById, calculateImpactStats, wishlist, toggleWishlist, getItemRatingStats, currentUser } = useApp();
  const impact = calculateImpactStats();

  const validCatalogItems = items.filter(hasValidProductImage);

  // Featured 4 items
  const featuredItems = validCatalogItems.slice(0, 4);

  // Seniors pass-it-on items
  const seniorsItems = validCatalogItems.filter((i) => i.isSeniorsSale || i.isFree).slice(0, 3);

  return (
    <div className="space-y-16 lg:space-y-24">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-12 lg:pt-14 lg:pb-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col: Hero Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Verified Campus Peer-to-Peer Network</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] text-balance">
                Rent, borrow, and pass forward campus gear.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Why buy an ₹8,500 drafting kit, lab microscope, or specialized textbook for just one semester? Borrow from seniors who have finished the course, and lend your unused equipment safely to peers.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setCurrentTab('browse')}
                  className="px-6 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span>Browse Campus Items</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={openPostModal}
                  className="px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
                >
                  Share an Unused Item
                </button>
              </div>

              {/* Claim-to-proof proof points */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatINR(impact.totalMoneySaved)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Saved by students (INR)
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {impact.totalItemsReused}+
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Equipment circulations
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {impact.totalKgWasteDiverted} kg
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Dorm waste diverted
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: High-Fidelity Hero Photography */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200/70 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                <ImageWithFallback
                  src={HERO_CAMPUS_IMG}
                  alt="College students sharing academic tools on campus"
                  fallbackTitle="Campus Sharing Network"
                  className="w-full aspect-[4/3] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-5 text-white">
                  <div className="text-xs font-medium text-emerald-300 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>Senior to Junior Circular Exchange</span>
                  </div>
                  <p className="text-sm font-semibold mt-1">
                    Verified student profiles with .edu email authentication
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS (Natural Editorial Numbering) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-balance">
            How RentReuse Works
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            A zero-friction, trusted way to borrow what you need and monetize or donate what you don&apos;t.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              01. Find & Reserve
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Pick your rental dates
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Search by course, equipment type, or category. Select your rental start and end dates with real-time double-booking protection and deposit calculation.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              02. Safe Campus Handover
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Meet at verified campus spots
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Coordinate pickup at high-safety hubs like the Central Library Foyer, Student Activity Center, or North Gate. Record quick handover notes together.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              03. Return & Build Trust
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Automated reminders & deposit refund
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Receive return alerts 1 day before due. Once inspected, your refundable deposit is released immediately, and two-way reviews raise your campus Trust Score.
            </p>
          </div>
        </div>
      </section>

      {/* 3. FEATURED ITEMS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Featured Campus Items
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              High-demand tools and equipment available for rental today.
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('browse')}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All ({items.length} items)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredItems.map((item) => {
            const owner = getUserById(item.ownerId);
            const isWished = currentUser ? wishlist.includes(item.id) : false;
            const ratingStats = getItemRatingStats(item.id);
            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedItemId(item.id);
                  setCurrentTab('detail');
                }}
                className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col relative"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <ImageWithFallback
                    src={item.photos[0]}
                    alt={item.title}
                    fallbackTitle={item.title}
                    category={item.category}
                    itemId={item.id}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 shadow-sm">
                      {item.condition}
                    </span>
                  </div>
                  {item.isSeniorsSale && (
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-600 text-white shadow-sm">
                        Free Pass-it-On
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        {item.category}
                      </span>
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
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Up to {item.maxRentalDays}d</span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        {item.isFree ? (
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                            Free to Borrow (₹0/day)
                          </span>
                        ) : (
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            <span className="tabular-nums">{formatINR(item.pricePerDay)}</span>
                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/day</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <ImageWithFallback
                          src={owner?.avatarUrl}
                          alt={owner?.fullName || 'Owner'}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="text-[11px] truncate max-w-[80px]">
                          {owner?.fullName.split(' ')[0]}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(item.id);
                        }}
                        className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                          isWished
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWished ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{isWished ? 'Saved' : 'Wishlist'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItemId(item.id);
                          setCurrentTab('detail');
                        }}
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer"
                      >
                        <span>Rent Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. SENIOR PASS-IT-ON SPOTLIGHT (Semester-End Feature) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 lg:p-10 rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                <GraduationCap className="w-4 h-4" />
                <span>Semester-End &quot;Donate / Pass It On&quot; Mode</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white text-balance">
                Graduating or finished a semester? Gift your tools forward.
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-xl">
                Don&apos;t throw away your first-year drafting boards, molecular model kits, or thick calculus textbooks into dorm dumpsters. List them with our &ldquo;Seniors&apos; Sale&rdquo; tag to give them away free to incoming freshmen and juniors.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setCurrentTab('browse');
                  }}
                  className="px-5 py-2.5 text-xs font-semibold text-emerald-950 bg-emerald-300 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
                >
                  Explore Free Pass-It-On Items
                </button>
                <button
                  onClick={openPostModal}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-800/80 hover:bg-emerald-800 border border-emerald-700/80 rounded-lg transition-colors cursor-pointer"
                >
                  List a Pass-It-On Gift
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 gap-3">
              {seniorsItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItemId(item.id);
                    setCurrentTab('detail');
                  }}
                  className="cursor-pointer p-3.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 transition-colors flex items-center gap-3.5"
                >
                  <div className="w-14 h-14 rounded-lg bg-emerald-950 overflow-hidden shrink-0">
                    <ImageWithFallback
                      src={item.photos[0]}
                      alt={item.title}
                      fallbackTitle={item.title}
                      category={item.category}
                      itemId={item.id}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-emerald-300 font-medium">Free for Juniors</div>
                    <div className="text-xs font-semibold text-white truncate">{item.title}</div>
                    <div className="text-[10px] text-emerald-200/70 truncate mt-0.5">
                      Pickup: {item.pickupLocation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. SAFE CAMPUS PICKUP SPOTS GUIDE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
            Campus Safety Standards
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Recommended Campus Pickup Hubs
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Always meet in well-lit, high-visibility public areas for equipment inspection and handovers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAMPUS_PICKUP_SPOTS.slice(0, 3).map((spot) => (
            <div
              key={spot.name}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>{spot.name}</span>
                </span>
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  {spot.safetyRating}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {spot.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
