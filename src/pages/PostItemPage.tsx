import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Category, Item, ItemCondition } from '../types';
import { CAMPUS_PICKUP_SPOTS } from '../data/seedData';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import {
  PRODUCT_IMAGE_PATHS,
  isValidImageUrl,
  validateUploadedImageFile,
} from '../utils/imageValidation';
import {
  Upload,
  GraduationCap,
  X,
  Sparkles,
  Lock,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';

interface PostItemPageProps {
  initialItem?: Item;
  onClose?: () => void;
  setCurrentTab: (tab: string) => void;
  setSelectedItemId: (id: string) => void;
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

const CONDITIONS: ItemCondition[] = [
  'Like New',
  'Gently Used',
  'Good',
  'Fair',
];

const VERIFIED_PRODUCT_PHOTOS = [
  { label: 'Canon Camera Kit', url: PRODUCT_IMAGE_PATHS.canonCamera },
  { label: 'Engineering Drafter', url: PRODUCT_IMAGE_PATHS.draftingKit },
  { label: 'Lab Microscope', url: PRODUCT_IMAGE_PATHS.labMicroscope },
  { label: 'Graphing Calculator', url: PRODUCT_IMAGE_PATHS.graphingCalc },
  { label: 'Arduino Starter Kit', url: PRODUCT_IMAGE_PATHS.arduinoKit },
  { label: 'Sony Headphones', url: PRODUCT_IMAGE_PATHS.sonyHeadphones },
  { label: 'Study Desk Chair', url: PRODUCT_IMAGE_PATHS.studyChair },
  { label: 'Commuter Bicycle', url: PRODUCT_IMAGE_PATHS.commuterBicycle },
];

export const PostItemPage: React.FC<PostItemPageProps> = ({
  initialItem,
  onClose,
  setCurrentTab,
  setSelectedItemId,
}) => {
  const { addItem, updateItem, uploadProductImage, currentUser, showToast } = useApp();

  const [title, setTitle] = useState(initialItem?.title || '');
  const [category, setCategory] = useState<Category>(initialItem?.category || 'Engineering Tools');
  const [description, setDescription] = useState(initialItem?.description || '');
  const [condition, setCondition] = useState<ItemCondition>(initialItem?.condition || 'Like New');
  const [photos, setPhotos] = useState<string[]>(
    initialItem?.photos ? initialItem.photos.filter(isValidImageUrl) : []
  );
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const [isFree, setIsFree] = useState(initialItem?.isFree || false);
  const [pricePerDay, setPricePerDay] = useState(
    initialItem ? String(initialItem.pricePerDay) : '500'
  );
  const [pricePerWeek, setPricePerWeek] = useState(
    initialItem?.pricePerWeek !== undefined ? String(initialItem.pricePerWeek) : '2750'
  );
  const [pricePerMonth, setPricePerMonth] = useState(
    initialItem?.pricePerMonth !== undefined ? String(initialItem.pricePerMonth) : '10000'
  );
  const [depositAmount, setDepositAmount] = useState(
    initialItem ? String(initialItem.depositAmount) : '1000'
  );
  const [stockQuantity, setStockQuantity] = useState(
    initialItem?.quantityAvailable !== undefined ? String(initialItem.quantityAvailable) : '1'
  );
  const [maxRentalDays, setMaxRentalDays] = useState(
    initialItem ? String(initialItem.maxRentalDays) : '30'
  );
  const [pickupLocation, setPickupLocation] = useState(
    initialItem?.pickupLocation || CAMPUS_PICKUP_SPOTS[0].name
  );
  const [isSeniorsSale, setIsSeniorsSale] = useState(initialItem?.isSeniorsSale || false);
  const [replacementCost, setReplacementCost] = useState(
    initialItem?.replacementCostEstimate ? String(initialItem.replacementCostEstimate) : '5000'
  );

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Sign in to list equipment for rent
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Product listings are associated with your verified student account so you can manage pricing, availability, and incoming rental orders.
        </p>
        <button
          type="button"
          onClick={() => setCurrentTab('auth')}
          className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm cursor-pointer"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  const handlePassItOnToggle = (checked: boolean) => {
    setIsSeniorsSale(checked);
    if (checked) {
      setIsFree(true);
      setPricePerDay('0');
      setPricePerWeek('0');
      setPricePerMonth('0');
      setDepositAmount('0');
    }
  };

  const handleDailyPriceChange = (val: string) => {
    setPricePerDay(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setPricePerWeek(String(Math.round(num * 5.5)));
      setPricePerMonth(String(Math.round(num * 20)));
    }
  };

  const processSelectedFile = async (file: File, targetIndex: number | null = null) => {
    setPhotoError(null);

    const validation = validateUploadedImageFile(file);
    if (!validation.valid) {
      const errMsg = validation.error || 'Product image is required.';
      setPhotoError(errMsg);
      showToast(errMsg, 'error');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const result = await uploadProductImage(file);
      if (!result.success || !result.url) {
        const errMsg = result.error || 'Failed to upload product image.';
        setPhotoError(errMsg);
        showToast(errMsg, 'error');
        return;
      }

      if (targetIndex !== null && targetIndex >= 0 && targetIndex < photos.length) {
        setPhotos((prev) => prev.map((p, idx) => (idx === targetIndex ? result.url! : p)));
        showToast('Product image replaced!', 'success');
      } else {
        setPhotos((prev) => [...prev.slice(0, 3), result.url!]);
        showToast('Product image uploaded!', 'success');
      }
      setPhotoError(null);
    } finally {
      setIsUploadingPhoto(false);
      setReplacingIndex(null);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length >= 4) {
      showToast('Maximum 4 photos allowed per product.', 'info');
      e.target.value = '';
      return;
    }

    await processSelectedFile(files[0], null);
    e.target.value = '';
  };

  const handleReplacePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processSelectedFile(files[0], replacingIndex);
    e.target.value = '';
  };

  const triggerReplacePhoto = (idx: number) => {
    setReplacingIndex(idx);
    replaceInputRef.current?.click();
  };

  const handleAddPresetPhoto = (url: string) => {
    setPhotoError(null);
    if (photos.includes(url)) {
      showToast('This product image is already attached.', 'info');
      return;
    }
    if (photos.length >= 4) {
      setPhotos((prev) => [...prev.slice(0, 3), url]);
    } else {
      setPhotos((prev) => [...prev, url]);
    }
  };

  const removePhoto = (idx: number) => {
    const next = photos.filter((_, i) => i !== idx);
    setPhotos(next);
    if (next.length === 0) {
      setPhotoError('Product image is required.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Please fill out the product name and description.', 'error');
      return;
    }

    const validPhotos = photos.filter(isValidImageUrl);
    if (validPhotos.length === 0) {
      setPhotoError('Product image is required.');
      showToast('Product image is required.', 'error');
      return;
    }

    const daily = isFree ? 0 : parseFloat(pricePerDay) || 0;
    const weekly = isFree ? 0 : parseFloat(pricePerWeek) || Math.round(daily * 5.5);
    const monthly = isFree ? 0 : parseFloat(pricePerMonth) || Math.round(daily * 20);

    if (initialItem) {
      updateItem(initialItem.id, {
        title: title.trim(),
        category,
        description: description.trim(),
        photos: validPhotos,
        condition,
        pricePerDay: daily,
        pricePerWeek: weekly,
        pricePerMonth: monthly,
        isFree,
        depositAmount: parseFloat(depositAmount) || 0,
        quantityAvailable: Math.max(1, parseInt(stockQuantity) || 1),
        maxRentalDays: parseInt(maxRentalDays) || 14,
        pickupLocation: pickupLocation.trim() || 'Central Library Foyer',
        campusSpotPreset: pickupLocation,
        isSeniorsSale,
        replacementCostEstimate: parseFloat(replacementCost) || 5000,
      });
      if (onClose) onClose();
      return;
    }

    const created = addItem({
      title: title.trim(),
      category,
      description: description.trim(),
      photos: validPhotos,
      condition,
      pricePerDay: daily,
      pricePerWeek: weekly,
      pricePerMonth: monthly,
      isFree,
      depositAmount: parseFloat(depositAmount) || 0,
      quantityAvailable: Math.max(1, parseInt(stockQuantity) || 1),
      maxRentalDays: parseInt(maxRentalDays) || 14,
      pickupLocation: pickupLocation.trim() || 'Central Library Foyer',
      campusSpotPreset: pickupLocation,
      isSeniorsSale,
      status: 'available',
      replacementCostEstimate: parseFloat(replacementCost) || 5000,
    });

    if (onClose) onClose();
    if (created) {
      setSelectedItemId(created.id);
      setCurrentTab('detail');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {initialItem ? 'Edit Equipment Listing' : 'List Gear on Campus'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Listing as <strong>{currentUser.fullName}</strong> ({currentUser.email})
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* 1. Pass It On Mode Banner Toggle */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isSeniorsSale
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
            }`}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isSeniorsSale}
                onChange={(e) => handlePassItOnToggle(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span>Enable &ldquo;Pass It On&rdquo; Mode (Semester-End Seniors&apos; Gift)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white">
                    Seniors&apos; Sale Badge
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Makes this item free to borrow for juniors and attaches a &ldquo;Seniors&apos; Sale&rdquo; badge.
                </p>
              </div>
            </label>
          </div>

          {/* 2. Basic Info (Title & Category) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Canon EOS M50 Camera, Rotring Drafter, TI-84 Plus CE..."
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />
            </div>

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
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description, Course Relevance & Included Accessories *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State what is included (cables, manuals, cases), courses it was used for, and condition details..."
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>

          {/* 4. Product Image Upload (Required + Preview + Remove/Replace) */}
          <div className="space-y-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>Product Images * (Required — JPG, JPEG, PNG, WEBP)</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Every product listing must include at least one valid, relevant product image. Up to 4 images allowed.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {photos.length}/4 images attached
              </span>
            </div>

            {/* Hidden file input for replacing an existing photo */}
            <input
              ref={replaceInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleReplacePhotoUpload}
              className="hidden"
            />

            {/* Validation Error Banner */}
            {photoError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{photoError}</span>
              </div>
            )}

            {/* Live Image Preview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm flex flex-col"
                >
                  <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <ImageWithFallback
                      src={url}
                      alt={title || `Product preview ${idx + 1}`}
                      fallbackTitle={title || 'Product Preview'}
                      category={category}
                      className="w-full h-full object-cover"
                    />
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white shadow-sm">
                        Main Image
                      </span>
                    )}
                  </div>
                  <div className="p-2 flex items-center justify-between gap-1.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => triggerReplacePhoto(idx)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Replace</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}

              {photos.length < 4 && (
                <label className="aspect-[4/3] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-600 bg-white dark:bg-slate-900/60 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-500 hover:text-emerald-600 p-4 text-center">
                  <Upload className="w-6 h-6 mb-1.5 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isUploadingPhoto ? 'Uploading...' : 'Upload Product Photo'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    JPG, JPEG, PNG, WEBP (Max 10MB)
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Verified Campus Product Photo Selector */}
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800">
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Or select a verified studio product photo matching your item:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {VERIFIED_PRODUCT_PHOTOS.map((preset) => {
                  const isSelected = photos.includes(preset.url);
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleAddPresetPhoto(preset.url)}
                      className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <span>+</span>}
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. Multi-Tier Rental Pricing & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Condition *
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Price per day (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                disabled={isFree}
                value={isFree ? '0' : pricePerDay}
                onChange={(e) => handleDailyPriceChange(e.target.value)}
                className={`w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white ${
                  isFree ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Price per week (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                disabled={isFree}
                value={isFree ? '0' : pricePerWeek}
                onChange={(e) => setPricePerWeek(e.target.value)}
                className={`w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white ${
                  isFree ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Price per month (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                disabled={isFree}
                value={isFree ? '0' : pricePerMonth}
                onChange={(e) => setPricePerMonth(e.target.value)}
                className={`w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white ${
                  isFree ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Security deposit (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* 6. Stock Quantity, Max Duration & Pickup Spot */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Available Quantity
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Rental Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={maxRentalDays}
                onChange={(e) => setMaxRentalDays(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Safe Campus Pickup Location *
              </label>
              <select
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
              >
                {CAMPUS_PICKUP_SPOTS.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({s.safetyRating})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isUploadingPhoto}
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {initialItem ? 'Save Listing Changes' : 'Publish Campus Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
