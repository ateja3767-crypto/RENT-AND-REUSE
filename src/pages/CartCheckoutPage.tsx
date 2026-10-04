import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { Order, SavedAddress } from '../types';
import { CAMPUS_PICKUP_SPOTS } from '../data/seedData';
import { formatINR } from '../utils/currency';
import {
  ShoppingCart,
  Trash2,
  Calendar,
  ShieldCheck,
  CreditCard,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Plus,
  Minus,
  AlertCircle,
  Loader2,
  Package,
  Building2,
  FileText,
} from 'lucide-react';

interface CartCheckoutPageProps {
  initialStep?: 'cart' | 'checkout';
  setCurrentTab: (tab: string) => void;
  setSelectedItemId: (id: string) => void;
}

export const CartCheckoutPage: React.FC<CartCheckoutPageProps> = ({
  initialStep = 'cart',
  setCurrentTab,
  setSelectedItemId,
}) => {
  const {
    currentUser,
    cart,
    items,
    addresses,
    isCartMutating,
    updateCartItem,
    removeFromCart,
    clearCart,
    addSavedAddress,
    placeOrder,
    showToast,
  } = useApp();

  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmation'>(initialStep);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [formError, setFormError] = useState('');

  // Customer info state
  const [customerName, setCustomerName] = useState(currentUser?.fullName || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');

  // Delivery / Address state
  const [deliveryMethod, setDeliveryMethod] = useState<'campus_pickup' | 'doorstep_delivery'>('campus_pickup');
  const [selectedCampusSpot, setSelectedCampusSpot] = useState(CAMPUS_PICKUP_SPOTS[0].name);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [addrLabel, setAddrLabel] = useState<SavedAddress['label']>('Dorm / Hostel');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [city, setCity] = useState('Main Campus');
  const [stateName, setStateName] = useState('MH');
  const [postalCode, setPostalCode] = useState('400076');
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>('test_card');
  const [testCardNumber, setTestCardNumber] = useState('4242 •••• •••• 4242');
  const [testCardExpiry, setTestCardExpiry] = useState('08/29');
  const [testCardCvc, setTestCardCvc] = useState('842');
  const [testUpiId, setTestUpiId] = useState('student@okaxis');
  const [orderNotes, setOrderNotes] = useState('');

  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.fullName || '');
      setCustomerEmail(currentUser.email || '');
      setCustomerPhone(currentUser.phone || '+91 98765 43210');
    }
  }, [currentUser]);

  useEffect(() => {
    if (addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(def.id);
    } else {
      setSelectedAddressId('new');
    }
  }, [addresses]);

  // Enrich cart items with product details
  const enrichedCart = useMemo(() => {
    return cart
      .map((c) => {
        const product = items.find((i) => i.id === c.itemId);
        return product ? { ...c, product } : null;
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [cart, items]);

  // Totals calculation in INR: Rental cost = daily price * rentalDays * quantity
  const totals = useMemo(() => {
    const subtotalRental = Math.round(
      enrichedCart.reduce((sum, c) => sum + c.rentalCost, 0)
    );
    const securityDepositTotal = Math.round(
      enrichedCart.reduce((sum, c) => sum + c.securityDeposit, 0)
    );
    const serviceFee = subtotalRental > 0 ? Math.max(50, Math.round(subtotalRental * 0.04)) : 0;
    const taxAmount = subtotalRental > 0 ? Math.round(subtotalRental * 0.072) : 0;
    const grandTotal = subtotalRental + securityDepositTotal + serviceFee + taxAmount;
    return {
      subtotalRental,
      securityDepositTotal,
      serviceFee,
      taxAmount,
      grandTotal,
    };
  }, [enrichedCart]);

  if (!currentUser) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Sign In to View Your Rental Cart
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Every member&apos;s cart and rental orders are strictly isolated and tied to their authenticated account.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setCurrentTab('auth')}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
          >
            Sign In / Create Account
          </button>
          <button
            onClick={() => setCurrentTab('browse')}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Browse Catalog
          </button>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const handleDateChange = async (
    cartItemId: string,
    field: 'startDate' | 'endDate',
    value: string,
    currentStart: string,
    currentEnd: string
  ) => {
    if (!value) return;
    if (field === 'startDate' && value < todayStr) {
      showToast('Rental start date cannot be in the past.', 'error');
      return;
    }
    const nextStart = field === 'startDate' ? value : currentStart;
    const nextEnd = field === 'endDate' ? value : currentEnd < nextStart ? nextStart : currentEnd;

    if (nextEnd < nextStart) {
      showToast('End date cannot be before start date.', 'error');
      return;
    }
    await updateCartItem(cartItemId, { startDate: nextStart, endDate: nextEnd });
  };

  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (enrichedCart.length === 0) {
      setFormError('Your cart is empty.');
      return;
    }

    if (!customerName.trim() || customerName.trim().length < 2) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 7) {
      setFormError('Please enter a valid contact phone number.');
      return;
    }

    // Validate item availability
    for (const c of enrichedCart) {
      if (c.product.status !== 'available') {
        setFormError(`"${c.product.title}" is currently unavailable. Please remove it from your cart.`);
        return;
      }
    }

    let finalAddress: Order['shippingAddress'];
    if (deliveryMethod === 'campus_pickup') {
      finalAddress = {
        label: 'Verified Campus Pickup Hub',
        street: selectedCampusSpot,
        building: 'Campus Security Monitored Exchange Zone',
        city: 'Main Campus',
        state: 'MH',
        postalCode: '400076',
      };
    } else {
      const existingAddr = addresses.find((a) => a.id === selectedAddressId);
      if (selectedAddressId !== 'new' && existingAddr) {
        finalAddress = {
          label: existingAddr.label,
          street: existingAddr.street,
          building: existingAddr.building,
          city: existingAddr.city,
          state: existingAddr.state,
          postalCode: existingAddr.postalCode,
        };
      } else {
        if (!street.trim() || !city.trim() || !postalCode.trim()) {
          setFormError('Please complete street address, city, and postal code for delivery.');
          return;
        }
        finalAddress = {
          label: addrLabel,
          street: street.trim(),
          building: building.trim(),
          city: city.trim(),
          state: stateName.trim() || 'MH',
          postalCode: postalCode.trim(),
        };
        if (saveAddressToProfile) {
          await addSavedAddress({
            label: addrLabel,
            fullName: customerName.trim(),
            phone: customerPhone.trim(),
            street: street.trim(),
            building: building.trim(),
            city: city.trim(),
            state: stateName.trim() || 'MH',
            postalCode: postalCode.trim(),
            isDefault: addresses.length === 0,
          });
        }
      }
    }

    setIsPlacingOrder(true);
    const res = await placeOrder({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      deliveryMethod,
      shippingAddress: finalAddress,
      paymentMethod,
      notes: orderNotes.trim(),
    });
    setIsPlacingOrder(false);

    if (res.success && res.order) {
      setPlacedOrder(res.order);
      setStep('confirmation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setFormError(res.error || 'Could not complete checkout. Please check your details.');
    }
  };

  // ==========================================================================
  // STEP 3: ORDER CONFIRMATION VIEW
  // ==========================================================================
  if (step === 'confirmation' && placedOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Order Confirmed · Account Isolated Record</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                Order #{placedOrder.id}
              </h1>
              <p className="text-xs text-slate-500">
                Placed by {placedOrder.customerName} ({placedOrder.customerEmail}) on{' '}
                {new Date(placedOrder.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div className="text-xs text-slate-500">
                Status: <strong className="text-emerald-700 dark:text-emerald-400">{placedOrder.orderStatus}</strong>
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                Payment Ref: <span className="font-mono">{placedOrder.paymentReference}</span> (
                {placedOrder.paymentStatus === 'paid_test_mode' ? 'Test Payment — INR (₹)' : 'PAY AT PICKUP — INR (₹)'})
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Rented Equipment ({placedOrder.items.length})
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {placedOrder.items.map((item) => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                      <ImageWithFallback src={item.productPhoto} alt={item.productTitle} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.productTitle}
                      </div>
                      <div className="text-xs text-slate-500 tabular-nums">
                        Qty: {item.quantity} · {item.startDate} to {item.endDate} ({item.rentalDays} days @ {formatINR(item.dailyRate)}/day)
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right tabular-nums">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatINR(item.lineTotal)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Includes {formatINR(item.securityDeposit)} refundable deposit
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary & Pickup Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="font-semibold text-slate-900 dark:text-white mb-1">
                {placedOrder.deliveryMethod === 'campus_pickup' ? 'Campus Pickup Location' : 'Delivery Address'}
              </div>
              <div className="text-slate-700 dark:text-slate-300 font-medium">{placedOrder.shippingAddress.street}</div>
              {placedOrder.shippingAddress.building && (
                <div className="text-slate-500">{placedOrder.shippingAddress.building}</div>
              )}
              <div className="text-slate-500">
                {placedOrder.shippingAddress.city}, {placedOrder.shippingAddress.state} {placedOrder.shippingAddress.postalCode}
              </div>
              <div className="text-slate-500 pt-1">Contact: {placedOrder.customerPhone}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs tabular-nums">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Rental Cost:</span>
                <span>{formatINR(placedOrder.subtotalRental)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Refundable Security Deposit:</span>
                <span>{formatINR(placedOrder.securityDepositTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Platform Fee:</span>
                <span>{formatINR(placedOrder.serviceFee)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>GST / Tax:</span>
                <span>{formatINR(placedOrder.taxAmount)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                <span>Total Paid ({placedOrder.paymentStatus === 'paid_test_mode' ? 'Test Payment — INR (₹)' : 'Due at Pickup'}):</span>
                <span>{formatINR(placedOrder.grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCurrentTab('browse')}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Continue Browsing
            </button>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Track Order in My Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
            Account Cart · {currentUser.fullName} ({currentUser.email})
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {step === 'cart' ? `My Rental Cart (${enrichedCart.length})` : 'Rental Checkout'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {step === 'cart'
              ? 'Adjust rental dates, quantities, and review refundable security deposits before checkout.'
              : 'Complete delivery/pickup details and confirm your rental order.'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStep('cart')}
            className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer ${
              step === 'cart'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            1. Rental Cart ({enrichedCart.length})
          </button>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <button
            type="button"
            disabled={enrichedCart.length === 0}
            onClick={() => setStep('checkout')}
            className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-40 ${
              step === 'checkout'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            2. Checkout & Payment
          </button>
        </div>
      </div>

      {enrichedCart.length === 0 ? (
        <div className="p-16 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-4">
          <ShoppingCart className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto stroke-1" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Your rental cart is empty
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Browse the campus catalog to add engineering tools, lab equipment, electronics, or textbooks to your personal cart.
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('browse')}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
          >
            Explore Rental Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: CART ITEMS OR CHECKOUT FORM */}
          <div className="lg:col-span-8 space-y-6">
            {step === 'cart' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Showing {enrichedCart.length} item(s) saved to {currentUser.fullName}&apos;s cart
                  </span>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Cart</span>
                  </button>
                </div>

                {enrichedCart.map((c) => {
                  const isUpdating = isCartMutating === c.id;
                  const maxStock = c.product.quantityAvailable || 5;

                  return (
                    <div
                      key={c.id}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div
                            onClick={() => {
                              setSelectedItemId(c.product.id);
                              setCurrentTab('detail');
                            }}
                            className="w-24 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 cursor-pointer border border-slate-200/60 dark:border-slate-800"
                          >
                            <ImageWithFallback
                              src={c.product.photos[0]}
                              alt={c.product.title}
                              fallbackTitle={c.product.title}
                              category={c.product.category}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <span>{c.product.category}</span>
                              <span>·</span>
                              <span>{c.product.condition}</span>
                              <span>·</span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                {c.product.pickupLocation}
                              </span>
                            </div>
                            <h3
                              onClick={() => {
                                setSelectedItemId(c.product.id);
                                setCurrentTab('detail');
                              }}
                              className="text-base font-bold text-slate-900 dark:text-white hover:text-emerald-700 cursor-pointer"
                            >
                              {c.product.title}
                            </h3>
                            <div className="text-xs text-slate-500 tabular-nums">
                              Daily Rate:{' '}
                              <strong className="text-slate-900 dark:text-white">
                                {formatINR(c.unitPricePerDay)}/day
                              </strong>{' '}
                              · Refundable Deposit:{' '}
                              <strong className="text-slate-900 dark:text-white">
                                {formatINR(c.product.depositAmount || 0)}/unit
                              </strong>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(c.id)}
                          disabled={isUpdating}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                          title="Remove from cart"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quantity & Rental Date Controls */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        {/* Quantity Stepper */}
                        <div className="sm:col-span-3 space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-500">
                            Quantity (Max {maxStock})
                          </label>
                          <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <button
                              type="button"
                              disabled={c.quantity <= 1 || isUpdating}
                              onClick={() => updateCartItem(c.id, { quantity: c.quantity - 1 })}
                              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 text-xs font-bold tabular-nums text-slate-900 dark:text-white">
                              {c.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={c.quantity >= maxStock || isUpdating}
                              onClick={() => updateCartItem(c.id, { quantity: c.quantity + 1 })}
                              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Rental Start Date */}
                        <div className="sm:col-span-3 space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-500">
                            Start Date
                          </label>
                          <input
                            type="date"
                            min={todayStr}
                            value={c.startDate}
                            onChange={(e) =>
                              handleDateChange(c.id, 'startDate', e.target.value, c.startDate, c.endDate)
                            }
                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white tabular-nums"
                          />
                        </div>

                        {/* Rental End Date */}
                        <div className="sm:col-span-3 space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-500">
                            End Date ({c.rentalDays} {c.rentalDays === 1 ? 'day' : 'days'})
                          </label>
                          <input
                            type="date"
                            min={c.startDate || todayStr}
                            value={c.endDate}
                            onChange={(e) =>
                              handleDateChange(c.id, 'endDate', e.target.value, c.startDate, c.endDate)
                            }
                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white tabular-nums"
                          />
                        </div>

                        {/* Calculated Line Item Total */}
                        <div className="sm:col-span-3 text-left sm:text-right space-y-0.5 tabular-nums">
                          <div className="text-[11px] text-slate-500">
                            {formatINR(c.unitPricePerDay)} × {c.rentalDays}d = {formatINR(c.rentalCost)} + Dep: {formatINR(c.securityDeposit)}
                          </div>
                          <div className="text-base font-extrabold text-slate-900 dark:text-white">
                            {formatINR(c.totalAmount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* STEP 2: CHECKOUT FORM */
              <form id="checkout-form" onSubmit={handlePlaceOrderSubmit} className="space-y-6">
                {formError && (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* 1. Customer Contact Information */}
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    01. Customer Verification Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Handover / Delivery Address */}
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    02. Pickup or Delivery Location
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('campus_pickup')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        deliveryMethod === 'campus_pickup'
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>Verified Campus Pickup Hub (Free)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Meet at a security-monitored campus checkpoint.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('doorstep_delivery')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        deliveryMethod === 'doorstep_delivery'
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        <span>Dorm / Apartment Delivery</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Use a saved address or enter a new dorm/street address.
                      </p>
                    </button>
                  </div>

                  {deliveryMethod === 'campus_pickup' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Select Verified Campus Exchange Spot *
                      </label>
                      <select
                        value={selectedCampusSpot}
                        onChange={(e) => setSelectedCampusSpot(e.target.value)}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                      >
                        {CAMPUS_PICKUP_SPOTS.map((spot) => (
                          <option key={spot.name} value={spot.name}>
                            {spot.name} — {spot.safetyRating} ({spot.description})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.length > 0 && (
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Saved Addresses for {currentUser.fullName}
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {addresses.map((addr) => (
                              <button
                                key={addr.id}
                                type="button"
                                onClick={() => setSelectedAddressId(addr.id)}
                                className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                                  selectedAddressId === addr.id
                                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30'
                                    : 'border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                <div className="font-bold text-slate-900 dark:text-white">{addr.label}</div>
                                <div className="text-slate-600 dark:text-slate-300 truncate">{addr.street}</div>
                                <div className="text-slate-400 text-[11px]">
                                  {addr.city}, {addr.state} {addr.postalCode}
                                </div>
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setSelectedAddressId('new')}
                              className={`p-3 rounded-xl border text-left text-xs flex items-center justify-center gap-1.5 font-semibold cursor-pointer ${
                                selectedAddressId === 'new'
                                  ? 'border-emerald-600 bg-emerald-50/40 text-emerald-800 dark:text-emerald-300'
                                  : 'border-dashed border-slate-300 dark:border-slate-700 text-slate-600'
                              }`}
                            >
                              <Plus className="w-4 h-4" />
                              <span>Use New Address</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedAddressId === 'new' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Address Type
                            </label>
                            <select
                              value={addrLabel}
                              onChange={(e) => setAddrLabel(e.target.value as SavedAddress['label'])}
                              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                            >
                              <option value="Dorm / Hostel">Dorm / Hostel</option>
                              <option value="Apartment">Apartment</option>
                              <option value="Department Lab">Department Lab</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Street Address *
                            </label>
                            <input
                              type="text"
                              required
                              value={street}
                              onChange={(e) => setStreet(e.target.value)}
                              placeholder="e.g. 450 North Campus Drive"
                              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Room / Building / Apt
                            </label>
                            <input
                              type="text"
                              value={building}
                              onChange={(e) => setBuilding(e.target.value)}
                              placeholder="e.g. Room 304, Hall B"
                              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                City *
                              </label>
                              <input
                                type="text"
                                required
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Postal Code *
                              </label>
                              <input
                                type="text"
                                required
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>
                          <label className="sm:col-span-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={saveAddressToProfile}
                              onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                              className="rounded text-emerald-700"
                            />
                            <span>Save this address to my account for future rentals</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Payment Method (Clearly labeled Test Payment — INR (₹)) */}
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      03. Payment Method
                    </h2>
                    <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400">
                      Test Payment — INR (₹)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('test_card')}
                      className={`p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        paymentMethod === 'test_card'
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 font-bold'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>Credit / Debit Card (INR)</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal mt-1">
                        Razorpay Sandbox — Test Payment — INR (₹)
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('test_upi')}
                      className={`p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        paymentMethod === 'test_upi'
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 font-bold'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>UPI / Campus Wallet (INR)</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal mt-1">
                        Test Payment — INR (₹) Instant UPI
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('campus_escrow_cod')}
                      className={`p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        paymentMethod === 'campus_escrow_cod'
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 font-bold'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>Pay at Campus Pickup (₹ COD)</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal mt-1">
                        Pay in INR (₹) at verified handover
                      </div>
                    </button>
                  </div>

                  {paymentMethod === 'test_card' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Sandbox Card Number
                        </label>
                        <input
                          type="text"
                          value={testCardNumber}
                          onChange={(e) => setTestCardNumber(e.target.value)}
                          className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Expiry (MM/YY)
                        </label>
                        <input
                          type="text"
                          value={testCardExpiry}
                          onChange={(e) => setTestCardExpiry(e.target.value)}
                          className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          CVC
                        </label>
                        <input
                          type="text"
                          value={testCardCvc}
                          onChange={(e) => setTestCardCvc(e.target.value)}
                          className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'test_upi' && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Sandbox UPI ID
                      </label>
                      <input
                        type="text"
                        value={testUpiId}
                        onChange={(e) => setTestUpiId(e.target.value)}
                        className="w-full max-w-sm text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Handover Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="e.g. Available between 12 PM and 2 PM near library entrance"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* RIGHT COLUMN: STICKY ORDER SUMMARY */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Rental Order Summary
              </h2>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                {enrichedCart.map((c) => (
                  <div key={c.id} className="pt-2 first:pt-0 flex items-start justify-between gap-2 text-xs">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {c.product.title}
                      </div>
                      <div className="text-slate-500 tabular-nums">
                        {formatINR(c.unitPricePerDay)} × {c.rentalDays} days{c.quantity > 1 ? ` × ${c.quantity}` : ''} = {formatINR(c.rentalCost)}
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums shrink-0">
                      {formatINR(c.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs tabular-nums">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Rental Cost ({enrichedCart.length} {enrichedCart.length === 1 ? 'item' : 'items'}):</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatINR(totals.subtotalRental)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Security Deposit (Refundable):</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatINR(totals.securityDepositTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Platform Fee:</span>
                  <span>{formatINR(totals.serviceFee)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tax (GST):</span>
                  <span>{formatINR(totals.taxAmount)}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Total (INR):</span>
                  <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
                    {formatINR(totals.grandTotal)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 leading-relaxed">
                Your <strong>{formatINR(totals.securityDepositTotal)}</strong> security deposit is 100% refundable upon returning the equipment on time.
              </div>

              {step === 'cart' ? (
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Checkout ({formatINR(totals.grandTotal)})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="space-y-2.5">
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={isPlacingOrder}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isPlacingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Placing Rental Order...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Place Rental Order ({formatINR(totals.grandTotal)})</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="w-full py-2 px-4 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Cart</span>
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
