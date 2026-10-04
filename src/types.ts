export type Category =
  | 'Engineering Tools'
  | 'Books'
  | 'Electronics'
  | 'Lab Equipment'
  | 'Furniture'
  | 'Clothing'
  | 'Sports'
  | 'Other';

export type ItemCondition = 'Like New' | 'Gently Used' | 'Good' | 'Fair';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'picked_up'
  | 'returned'
  | 'declined'
  | 'cancelled'
  | 'expired';

export type ContactPreference =
  | 'in_app_only'
  | 'share_phone_after_acceptance'
  | 'allow_both';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Rented'
  | 'Returned'
  | 'Completed'
  | 'Cancelled';

export type PaymentStatus =
  | 'paid_test_mode'
  | 'cod_pending'
  | 'refunded'
  | 'failed';

export type DepositStatus = 'held' | 'refunded' | 'withheld_partial' | 'withheld_full';

export type DemoRole = 'owner' | 'borrower';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  department: string;
  academicYear: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate' | 'Faculty';
  campus: string;
  phone?: string;
  contactPreference?: ContactPreference;
  smsNotificationsEnabled?: boolean;
  bio: string;
  trustScore: number; // 0 - 100
  verifiedStudent: boolean;
  totalRentalsCompleted: number;
  onTimeReturnRate: number; // percentage (0 - 100)
  createdAt: string;
  isAdmin?: boolean;
  isSuspended?: boolean;
  role?: 'user' | 'owner' | 'admin' | 'super_admin';
  isApprovedLender?: boolean;
  provider?: 'email' | 'google' | 'apple';
  emailVerified?: boolean;
}

export interface SavedAddress {
  id: string;
  userId: string;
  label: 'Dorm / Hostel' | 'Apartment' | 'Campus Pickup' | 'Department Lab' | 'Other';
  fullName: string;
  phone: string;
  street: string;
  building: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CategoryRecord {
  id: string;
  name: Category | string;
  description: string;
  iconName: string;
  itemCount?: number;
  createdAt: string;
}

export interface Item {
  id: string;
  ownerId: string;
  title: string;
  category: Category;
  description: string;
  photos: string[];
  condition: ItemCondition;
  pricePerDay: number; // 0 if free
  pricePerWeek?: number;
  pricePerMonth?: number;
  isFree: boolean;
  depositAmount: number; // refundable security deposit
  maxRentalDays: number;
  quantityAvailable?: number;
  pickupLocation: string;
  campusSpotPreset?: string;
  isSeniorsSale?: boolean;
  status: 'available' | 'paused' | 'rented' | 'hidden';
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  updatedAt: string;
  replacementCostEstimate?: number;
  viewsCount?: number;
}

export type WishlistPriority = 'High' | 'Medium' | 'Low';

export interface WishlistItemMeta {
  id?: string;
  userId?: string;
  itemId: string;
  addedAt: string;
  priority: WishlistPriority;
  notifyOnAvailable: boolean;
  note?: string;
}

export interface CartItem {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  rentalDays: number;
  unitPricePerDay: number;
  rentalCost: number;
  securityDeposit: number;
  totalAmount: number;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  sellerId: string;
  productTitle: string;
  productPhoto: string;
  category: Category;
  quantity: number;
  startDate: string;
  endDate: string;
  rentalDays: number;
  dailyRate: number;
  rentalAmount: number;
  securityDeposit: number;
  lineTotal: number;
  itemStatus: OrderStatus;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: 'campus_pickup' | 'doorstep_delivery';
  shippingAddress: {
    label: string;
    street: string;
    building: string;
    city: string;
    state: string;
    postalCode: string;
  };
  paymentMethod: 'test_card' | 'test_upi' | 'campus_escrow_cod';
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  orderStatus: OrderStatus;
  subtotalRental: number;
  securityDepositTotal: number;
  serviceFee: number;
  taxAmount: number;
  grandTotal: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  orderId?: string;
  itemId: string;
  borrowerId: string;
  ownerId: string;
  quantity?: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  dailyRate: number;
  rentalAmount?: number;
  depositAmount: number;
  totalPrice: number;
  status: BookingStatus;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  pickupOption?: 'campus_pickup' | 'doorstep_delivery' | 'campus_delivery';
  contactPreference?: ContactPreference;
  renterContactPreference?: ContactPreference;
  ownerContactPreference?: ContactPreference;
  sharePhoneWithOwner?: boolean;
  conversationId?: string;
  authorizedRenterPhone?: string;
  authorizedOwnerPhone?: string;
  smsNotificationLog?: string[];
  message?: string;
  depositStatus: DepositStatus;
  handoverNotes?: string;
  returnNotes?: string;
  handoverPhoto?: string;
  returnPhoto?: string;
  damageReported?: boolean;
  damageDetails?: string;
  withheldAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  bookingId?: string;
  productId: string;
  ownerId: string;
  renterId: string;
  status?: 'active' | 'closed' | 'archived';
  lastMessagePreview?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId?: string;
  bookingId?: string;
  itemId?: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export type ConditionAccuracy =
  | 'Exact Match'
  | 'Better Than Expected'
  | 'Minor Wear'
  | 'Not As Described';

export interface Review {
  id: string;
  bookingId?: string;
  orderId?: string;
  reviewerId: string;
  revieweeId: string;
  itemId: string;
  rating: number; // 1 - 5
  comment: string;
  role: 'borrower_to_owner' | 'owner_to_borrower';
  returnedOnTime?: boolean;
  itemAsDescribed?: boolean;
  conditionAccuracy?: ConditionAccuracy;
  wouldBorrowAgain?: boolean;
  verifiedBooking?: boolean;
  tags?: string[];
  helpfulCount?: number;
  helpfulVoterIds?: string[];
  ownerReply?: string;
  ownerReplyAt?: string;
  createdAt: string;
}

export interface ItemRatingStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  accuracyRate: number;
  wouldBorrowAgainRate: number;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedItemId?: string;
  reason: 'inappropriate_content' | 'no_show' | 'damaged_item' | 'scam_or_fraud' | 'unauthorized_fees' | 'other';
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface WantedPost {
  id: string;
  userId: string;
  title: string;
  category: Category;
  description: string;
  maxBudgetPerDay: number; // 0 for free only
  neededBy: string; // YYYY-MM-DD
  durationNeededDays: number;
  campusLocation: string;
  status: 'open' | 'fulfilled' | 'closed';
  offersCount: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type:
    | 'booking_request'
    | 'booking_status'
    | 'order_placed'
    | 'order_status'
    | 'return_reminder_1day'
    | 'return_reminder_today'
    | 'overdue'
    | 'new_message'
    | 'wanted_offer'
    | 'item_available'
    | 'new_review';
  title: string;
  message: string;
  linkId?: string;
  targetType?: 'booking' | 'order' | 'item' | 'message' | 'wanted';
  isRead: boolean;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface AdminActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail?: string;
  action: string;
  targetType:
    | 'product'
    | 'user'
    | 'admin'
    | 'order'
    | 'booking'
    | 'category'
    | 'review'
    | 'report'
    | 'settings'
    | 'system';
  targetName?: string;
  targetLabel?: string;
  targetId?: string;
  result?: 'Success' | 'Failed';
  details?: string;
  createdAt: string;
}

export interface WebsiteSettings {
  siteName: string;
  currencyCode?: 'INR';
  currencySymbol?: '₹';
  supportEmail: string;
  supportPhone?: string;
  platformFeePercent: number;
  taxPercent: number;
  deliveryChargeINR?: number;
  defaultMaxRentalDays?: number;
  allowNewRegistrations?: boolean;
  requireEmailVerification?: boolean;
  requireListingApproval?: boolean;
  maintenanceMode?: boolean;
  allowDirectPhoneSharing?: boolean;
  announcementBanner: string;
  smsGatewayEnabled?: boolean;
  updatedAt: string;
}
