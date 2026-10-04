import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { TrustBadge } from '../components/common/TrustBadge';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { formatINR } from '../utils/currency';
import {
  Star,
  Edit3,
  Mail,
  MapPin,
  GraduationCap,
  X,
  Phone,
  Lock,
  Trash2,
  Plus,
  KeyRound,
  Upload,
  Heart,
  ShoppingBag,
  Package,
} from 'lucide-react';

interface ProfilePageProps {
  userId?: string;
  setCurrentTab: (tab: string) => void;
  setSelectedItemId: (id: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  userId,
  setCurrentTab,
  setSelectedItemId,
}) => {
  const {
    currentUser,
    users,
    items,
    wishlist,
    orders,
    addresses,
    addSavedAddress,
    deleteSavedAddress,
    getReviewsForUser,
    updateUserProfile,
    changePassword,
    deleteOwnAccount,
    showToast,
  } = useApp();

  const targetUser: User | null = userId
    ? users.find((u) => u.id === userId) || currentUser
    : currentUser;

  // Edit profile state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [fullName, setFullName] = useState(targetUser?.fullName || '');
  const [bio, setBio] = useState(targetUser?.bio || '');
  const [department, setDepartment] = useState(targetUser?.department || '');
  const [academicYear, setAcademicYear] = useState<User['academicYear']>(
    targetUser?.academicYear || 'Junior'
  );
  const [campus, setCampus] = useState(targetUser?.campus || '');
  const [phone, setPhone] = useState(targetUser?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(targetUser?.avatarUrl || '');

  // Saved address form state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrLabel, setAddrLabel] = useState<'Dorm / Hostel' | 'Apartment' | 'Campus Pickup' | 'Department Lab' | 'Other'>('Dorm / Hostel');
  const [addrRecipient, setAddrRecipient] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('Main Campus');
  const [addrState, setAddrState] = useState('MH');
  const [addrPostalCode, setAddrPostalCode] = useState('400076');
  const [addrDefault, setAddrDefault] = useState(true);

  // Change password modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Delete account modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');

  useEffect(() => {
    if (targetUser) {
      setFullName(targetUser.fullName);
      setBio(targetUser.bio);
      setDepartment(targetUser.department);
      setAcademicYear(targetUser.academicYear);
      setCampus(targetUser.campus);
      setPhone(targetUser.phone || '');
      setAvatarUrl(targetUser.avatarUrl);
      setAddrRecipient(targetUser.fullName);
      setAddrPhone(targetUser.phone || '');
    }
  }, [targetUser]);

  if (!targetUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Lock className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Sign in to view your Profile
        </h2>
        <p className="text-xs text-slate-500">
          Your profile, saved delivery addresses, wishlist, and order history are private to your account.
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

  const isOwnProfile = currentUser?.id === targetUser.id;
  const userItems = items.filter((i) => i.ownerId === targetUser.id);
  const userReviews = getReviewsForUser(targetUser.id);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setAvatarUrl(ev.target.result as string);
        showToast('Profile picture attached!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile(targetUser.id, {
      fullName: fullName.trim() || targetUser.fullName,
      bio: bio.trim(),
      department: department.trim(),
      academicYear,
      campus: campus.trim(),
      phone: phone.trim(),
      avatarUrl: avatarUrl || targetUser.avatarUrl,
    });
    setEditModalOpen(false);
  };

  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrStreet.trim() || !addrCity.trim()) {
      showToast('Please enter street and city.', 'error');
      return;
    }
    await addSavedAddress({
      label: addrLabel,
      fullName: addrRecipient.trim() || targetUser.fullName,
      phone: addrPhone.trim() || targetUser.phone || '',
      street: addrStreet.trim(),
      building: targetUser.campus || 'Main Campus',
      city: addrCity.trim(),
      state: addrState.trim(),
      postalCode: addrPostalCode.trim(),
      isDefault: addrDefault,
    });
    setAddrStreet('');
    setShowAddAddress(false);
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    const res = await changePassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await deleteOwnAccount();
    if (res.success) {
      setDeleteModalOpen(false);
      setCurrentTab('landing');
    }
  };

  const avgRating =
    userReviews.length > 0
      ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length).toFixed(1)
      : '5.0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={targetUser.avatarUrl}
              alt={targetUser.fullName}
              referrerPolicy="no-referrer"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-emerald-600/20"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {targetUser.fullName}
                </h1>
                <TrustBadge type="verified" />
                {targetUser.totalRentalsCompleted >= 5 && <TrustBadge type="super_lender" />}
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {targetUser.department} · {targetUser.academicYear}
                  </span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{targetUser.campus}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{targetUser.email}</span>
                </span>
                {targetUser.phone && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{targetUser.phone}</span>
                    </span>
                  </>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed pt-1">
                &ldquo;{targetUser.bio}&rdquo;
              </p>
            </div>
          </div>

          {isOwnProfile && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => setPasswordModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          )}
        </div>

        {/* Private Account Quick Links when viewing own profile */}
        {isOwnProfile && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCurrentTab('wishlist')}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between hover:border-emerald-500 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-rose-500" />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    My Private Wishlist
                  </div>
                  <div className="text-[11px] text-slate-500">Saved items for this account</div>
                </div>
              </div>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
                {wishlist.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('dashboard')}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between hover:border-emerald-500 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    My Rental Orders
                  </div>
                  <div className="text-[11px] text-slate-500">Order history & tracking</div>
                </div>
              </div>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
                {orders.filter((o) => o.userId === targetUser.id).length}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('dashboard')}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between hover:border-emerald-500 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-emerald-600" />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    My Listed Products
                  </div>
                  <div className="text-[11px] text-slate-500">Active equipment listings</div>
                </div>
              </div>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
                {userItems.length}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* SAVED ADDRESSES SECTION (Only visible on own profile) */}
      {isOwnProfile && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Saved Delivery & Pickup Addresses ({addresses.length})</span>
              </h2>
              <p className="text-xs text-slate-500">
                Your saved addresses are private to your account and available during checkout.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Address</span>
            </button>
          </div>

          {showAddAddress && (
            <form
              onSubmit={handleAddAddressSubmit}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Address Label
                </label>
                <select
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value as any)}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                >
                  <option value="Dorm / Hostel">Dorm / Hostel</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Campus Pickup">Campus Pickup</option>
                  <option value="Department Lab">Department Lab</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={addrRecipient}
                  onChange={(e) => setAddrRecipient(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Street / Hall & Room Number *
                </label>
                <input
                  type="text"
                  required
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  placeholder="e.g. North Hall Room 304, 210 Campus Drive"
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  City / Campus Zone *
                </label>
                <input
                  type="text"
                  required
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                />
              </div>
              <div className="sm:col-span-3 flex items-center justify-between pt-2">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addrDefault}
                    onChange={(e) => setAddrDefault(e.target.checked)}
                    className="rounded text-emerald-700"
                  />
                  <span>Set as default checkout address</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                  >
                    Save Address
                  </button>
                </div>
              </div>
            </form>
          )}

          {addresses.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              No saved addresses yet. Add a campus dorm or pickup address for faster checkout.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      {addr.fullName} {addr.phone ? `· ${addr.phone}` : ''}
                    </div>
                    <div className="text-slate-500">
                      {addr.street}, {addr.city}, {addr.state} {addr.postalCode}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteSavedAddress(addr.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TRUST SCORE WIDGET */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
        <div>
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
            Algorithmic Campus Reputation
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Campus Trust Score Analysis
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Calculated from student ratings, completed transactions, on-time return adherence, and verified email status.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1 text-center">
            <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {targetUser.trustScore}
              <span className="text-sm font-normal text-slate-400"> / 100</span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Overall Trust Score
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
              Verified Campus Peer
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1 text-center">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {targetUser.onTimeReturnRate}%
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">On-Time Returns</div>
            <div className="text-[10px] text-slate-500">Strict deadline adherence</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1 text-center">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {targetUser.totalRentalsCompleted}
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Completed Exchanges
            </div>
            <div className="text-[10px] text-slate-500">Circulated items</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1 text-center">
            <div className="text-3xl font-extrabold text-amber-500 tabular-nums flex items-center justify-center gap-1">
              <span>{avgRating}</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Peer Review Rating
            </div>
            <div className="text-[10px] text-slate-500">Across {userReviews.length} reviews</div>
          </div>
        </div>
      </div>

      {/* LISTINGS BY THIS USER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Equipment Listed by {targetUser.fullName.split(' ')[0]} ({userItems.length})
          </h2>
        </div>

        {userItems.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            No equipment listed right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedItemId(item.id);
                  setCurrentTab('detail');
                }}
                className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                  <ImageWithFallback
                    src={item.photos[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {item.isSeniorsSale && (
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white shadow-sm">
                        <GraduationCap className="w-3 h-3" />
                        <span>Seniors&apos; Sale</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <div className="text-[11px] text-slate-400">
                    {item.category} · {item.condition}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {item.title}
                  </h3>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {item.isFree ? 'Free to borrow' : `${formatINR(item.pricePerDay)}/day`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REVIEWS RECEIVED */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Reviews from Peers ({userReviews.length})
        </h2>

        {userReviews.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            No peer reviews recorded yet. Completed rentals collect two-way reviews.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    ))}
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-1">
                      {rev.rating}.0
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {rev.createdAt.split('T')[0]}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                  &ldquo;{rev.comment}&rdquo;
                </p>
                <div className="text-[10px] text-slate-400 font-medium">
                  Role:{' '}
                  {rev.role === 'borrower_to_owner'
                    ? 'Feedback from Borrower'
                    : 'Feedback from Lender'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Student Profile
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div className="flex items-center gap-3">
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                />
                <label className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Profile Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department / Major
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value as any)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                  >
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Graduate">Graduate</option>
                    <option value="Faculty">Faculty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Campus / Residential Location
                </label>
                <input
                  type="text"
                  required
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bio / Equipment Philosophy
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>Change Account Password</span>
              </h3>
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password (min 6 chars) *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-rose-200 dark:border-rose-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-rose-600 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span>Permanently Delete Account</span>
              </h3>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Deleting your account will permanently erase your profile, private wishlist, cart, saved addresses, and active listings. This action cannot be undone.
            </p>

            <form onSubmit={handleDeleteAccountSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enter your password to confirm deletion
                </label>
                <input
                  type="password"
                  value={deleteConfirmPassword}
                  onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                  placeholder="Your account password"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm cursor-pointer"
                >
                  Confirm Permanent Deletion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
