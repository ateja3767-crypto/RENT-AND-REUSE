import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Category, WantedPost } from '../types';
import { TrustBadge } from '../components/common/TrustBadge';
import { formatINR } from '../utils/currency';
import { 
  HelpCircle, 
  PlusCircle, 
  Search, 
  Calendar, 
  MapPin, 
  IndianRupee, 
  MessageSquare, 
  CheckCircle2, 
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface WantedBoardPageProps {
  setCurrentTab: (tab: string) => void;
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

export const WantedBoardPage: React.FC<WantedBoardPageProps> = ({
  setCurrentTab,
  setSelectedUserId,
}) => {
  const {
    wantedPosts,
    createWantedPost,
    offerItemToWantedPost,
    items,
    currentUser,
    getUserById,
    showToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // New wanted request modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Engineering Tools');
  const [description, setDescription] = useState('');
  const [maxBudget, setMaxBudget] = useState('300');
  const [neededBy, setNeededBy] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [durationDays, setDurationDays] = useState('3');
  const [campusLocation, setCampusLocation] = useState('Central Library Foyer');

  // Make offer modal state
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [activeWantedPost, setActiveWantedPost] = useState<WantedPost | null>(null);
  const [selectedOfferItemId, setSelectedOfferItemId] = useState<string>('');
  const [offerMessage, setOfferMessage] = useState('');

  // Current user's available listings to offer
  const myAvailableItems = currentUser
    ? items.filter((i) => i.ownerId === currentUser.id && i.status === 'available')
    : [];

  const filteredPosts = wantedPosts.filter((post) => {
    const matchesSearch =
      searchTerm === '' ||
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.campusLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Please provide a title and description for your request.', 'error');
      return;
    }

    createWantedPost({
      title: title.trim(),
      category,
      description: description.trim(),
      maxBudgetPerDay: parseFloat(maxBudget) || 0,
      neededBy,
      durationNeededDays: parseInt(durationDays) || 1,
      campusLocation: campusLocation.trim() || 'Campus Central',
    });

    setCreateModalOpen(false);
    setTitle('');
    setDescription('');
  };

  const handleOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWantedPost) return;

    if (!selectedOfferItemId && myAvailableItems.length > 0) {
      showToast('Please select one of your items to offer.', 'error');
      return;
    }

    const itemIdToOffer = selectedOfferItemId || (items[0] ? items[0].id : '');
    offerItemToWantedPost(
      activeWantedPost.id,
      itemIdToOffer,
      offerMessage.trim() || 'I have this equipment available for you!'
    );

    setOfferModalOpen(false);
    setActiveWantedPost(null);
    setSelectedOfferItemId('');
    setOfferMessage('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Post Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Campus Community Requests</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Wanted Board
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Need something urgently that isn&apos;t listed yet? Post a request here so seniors and campus peers with unused gear can respond.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg shadow-sm transition-colors shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post an Item Request</span>
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-4">
        <div className="relative max-w-xl">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search wanted requests (e.g. calculator, microscope, DSLR)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Requests ({wantedPosts.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = wantedPosts.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white dark:bg-emerald-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Wanted Requests Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No wanted requests in this category
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Need an item for class? Post the first request to notify campus students!
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Create a Request Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const requester = getUserById(post.userId);
            const isMyPost = currentUser ? currentUser.id === post.userId : false;

            return (
              <div
                key={post.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="space-y-3">
                  {/* Category and Needed Date */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Needed by {post.neededBy}</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed line-clamp-3">
                      {post.description}
                    </p>
                  </div>

                  {/* Parameters (Budget, duration, location) */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500">Max Budget:</span>
                      <span className="font-semibold tabular-nums">
                        {post.maxBudgetPerDay === 0
                          ? 'Looking for free / borrow'
                          : `${formatINR(post.maxBudgetPerDay)}/day`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500">Duration:</span>
                      <span className="font-semibold">{post.durationNeededDays} days</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 truncate">
                      <span className="text-slate-500">Location:</span>
                      <span className="font-semibold truncate max-w-[150px]">{post.campusLocation}</span>
                    </div>
                  </div>
                </div>

                {/* Requester Profile & Action */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (requester) {
                          setSelectedUserId(requester.id);
                          setCurrentTab('profile');
                        }
                      }}
                      className="flex items-center gap-2 text-left group"
                    >
                      <img
                        src={requester?.avatarUrl}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-600/30"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate max-w-[120px]">
                          {requester?.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {requester?.academicYear} · {requester?.trustScore}/100 Trust
                        </div>
                      </div>
                    </button>

                    <div className="text-[11px] font-semibold text-slate-500">
                      {post.offersCount} {post.offersCount === 1 ? 'offer' : 'offers'}
                    </div>
                  </div>

                  {/* Make Offer CTA */}
                  <div>
                    {isMyPost ? (
                      <div className="text-center py-1.5 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        Your Request
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveWantedPost(post);
                          setOfferModalOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>I Have This Item — Respond</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE WANTED REQUEST MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Post a Wanted Item Request
                </h3>
                <p className="text-xs text-slate-500">
                  Ask fellow campus students for equipment you need temporarily.
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Item Title or Model *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. TI-84 Plus CE Graphing Calculator, Drafting T-Square..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Daily Budget (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder="0 for free borrow"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Needed By Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={neededBy}
                    onChange={(e) => setNeededBy(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Context *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain which course or project this is for, and your commitment to returning safely..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Pickup Spot
                </label>
                <input
                  type="text"
                  value={campusLocation}
                  onChange={(e) => setCampusLocation(e.target.value)}
                  placeholder="e.g. Central Library Foyer, Main Canteen..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  Publish Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAKE AN OFFER MODAL */}
      {offerModalOpen && activeWantedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Respond to Request
                </h3>
                <p className="text-xs text-slate-500">
                  Offering to &ldquo;{activeWantedPost.title}&rdquo;
                </p>
              </div>
              <button
                onClick={() => setOfferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOfferSubmit} className="space-y-3.5">
              {myAvailableItems.length > 0 ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select your listing to offer
                  </label>
                  <select
                    value={selectedOfferItemId}
                    onChange={(e) => setSelectedOfferItemId(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose from your listed items --</option>
                    {myAvailableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} ({item.isFree ? 'Free' : `${formatINR(item.pricePerDay)}/day`})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                  You don&apos;t have any active equipment listings currently. You can still message this student directly to arrange sharing!
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message / Availability Details
                </label>
                <textarea
                  rows={3}
                  required
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="e.g. I have this ready to hand over at the Library tomorrow between 1 PM and 4 PM..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOfferModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  Send Offer & Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
