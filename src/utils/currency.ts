export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE = 'INR';
export const CURRENCY_LOCALE = 'en-IN';

const inrWholeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const inrDecimalFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/**
 * Formats an amount in Indian Rupees (INR / ₹) using the Indian numbering system ('en-IN').
 * Examples:
 * 500 -> ₹500
 * 1250 -> ₹1,250
 * 25000 -> ₹25,000
 * 100000 -> ₹1,00,000
 * 1000000 -> ₹10,00,000
 */
export function formatINR(amount: number | undefined | null, forceDecimals = false): string {
  const safeValue = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  if (forceDecimals || !Number.isInteger(safeValue)) {
    return inrDecimalFormatter.format(safeValue);
  }
  return inrWholeFormatter.format(safeValue);
}

/**
 * Converts INR amount to paise (smallest integer monetary unit in INR) for consistent storage/gateways.
 */
export function toPaise(inrAmount: number): number {
  return Math.round((Number(inrAmount) || 0) * 100);
}

/**
 * Converts paise integer back to INR.
 */
export function fromPaise(paise: number): number {
  return Math.round(Number(paise) || 0) / 100;
}

export interface RentalCostBreakdown {
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  days: number;
  quantity: number;
  rentalSubtotal: number;
  securityDepositTotal: number;
  platformFee: number;
  taxAmount: number;
  deliveryCharge: number;
  grandTotal: number;
  pricingTierLabel: string;
  formulaText: string;
}

/**
 * Calculates complete INR rental cost breakdown including daily/weekly/monthly rates,
 * security deposit, platform fee, GST (tax), and delivery charges.
 */
export function calculateINRRentalBreakdown(params: {
  dailyPrice?: number;
  dailyRate?: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  securityDeposit?: number;
  depositPerUnit?: number;
  days?: number;
  rentalDays?: number;
  quantity?: number;
  deliveryMethod?: 'pickup' | 'campus_delivery';
}): RentalCostBreakdown {
  const dailyRate = Math.max(0, Number(params.dailyPrice ?? params.dailyRate) || 0);
  const weeklyRate =
    params.weeklyPrice !== undefined && params.weeklyPrice > 0
      ? Number(params.weeklyPrice)
      : Math.round(dailyRate * 5);
  const monthlyRate =
    params.monthlyPrice !== undefined && params.monthlyPrice > 0
      ? Number(params.monthlyPrice)
      : Math.round(dailyRate * 16);
  const depositPerUnit = Math.max(0, Number(params.securityDeposit ?? params.depositPerUnit) || 0);
  const days = Math.max(1, Math.round(Number(params.days ?? params.rentalDays) || 1));
  const quantity = Math.max(1, Math.round(Number(params.quantity) || 1));

  let unitRentalCost = dailyRate * days;
  let pricingTierLabel = 'Daily rate';
  let formulaText = `${formatINR(dailyRate)} × ${days} day${days > 1 ? 's' : ''}`;

  if (days >= 28 && monthlyRate > 0 && dailyRate > 0) {
    const months = Math.floor(days / 30);
    const remDays = days % 30;
    const candidate =
      months >= 1 ? months * monthlyRate + remDays * dailyRate : monthlyRate;
    if (candidate <= unitRentalCost) {
      unitRentalCost = candidate;
      pricingTierLabel = 'Monthly tier applied';
      formulaText =
        months >= 1 && remDays > 0
          ? `${months} mo × ${formatINR(monthlyRate)} + ${remDays}d × ${formatINR(dailyRate)}`
          : `Monthly rate (${formatINR(monthlyRate)})`;
    }
  } else if (days >= 7 && weeklyRate > 0 && dailyRate > 0) {
    const weeks = Math.floor(days / 7);
    const remDays = days % 7;
    const candidate = weeks * weeklyRate + remDays * dailyRate;
    if (candidate <= unitRentalCost) {
      unitRentalCost = candidate;
      pricingTierLabel = 'Weekly tier applied';
      formulaText =
        remDays > 0
          ? `${weeks} wk × ${formatINR(weeklyRate)} + ${remDays}d × ${formatINR(dailyRate)}`
          : `${weeks} wk × ${formatINR(weeklyRate)}`;
    }
  }

  const rentalSubtotal = Math.round(unitRentalCost * quantity);
  if (quantity > 1) {
    formulaText = `(${formulaText}) × ${quantity} units`;
  }

  const securityDepositTotal = Math.round(depositPerUnit * quantity);
  const platformFee = rentalSubtotal > 0 ? Math.max(50, Math.round(rentalSubtotal * 0.04)) : 0;
  const taxAmount = rentalSubtotal > 0 ? Math.round(rentalSubtotal * 0.072) : 0;
  const deliveryCharge = params.deliveryMethod === 'campus_delivery' ? 150 : 0;
  const grandTotal = rentalSubtotal + securityDepositTotal + platformFee + taxAmount + deliveryCharge;

  return {
    dailyRate,
    weeklyRate,
    monthlyRate,
    days,
    quantity,
    rentalSubtotal,
    securityDepositTotal,
    platformFee,
    taxAmount,
    deliveryCharge,
    grandTotal,
    pricingTierLabel,
    formulaText,
  };
}
