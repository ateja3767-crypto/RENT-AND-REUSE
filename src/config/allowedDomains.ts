/**
 * Email validation helpers for RentReuse user accounts.
 * Supports university (.edu, .ac.in, .ac.uk, etc.) as well as standard personal emails
 * so any real user can register and sign in seamlessly.
 */

export const ALLOWED_COLLEGE_DOMAINS = [
  'campus.edu',
  'stanford.edu',
  'berkeley.edu',
  'mit.edu',
  'harvard.edu',
  'columbia.edu',
  'nyu.edu',
  'ucla.edu',
  'usc.edu',
  'utexas.edu',
  'illinois.edu',
  'umich.edu',
  'gatech.edu',
  'purdue.edu',
  'cornell.edu',
  'cmu.edu',
  'washington.edu',
  'ox.ac.uk',
  'cam.ac.uk',
  'iitb.ac.in',
  'iitd.ac.in',
  'iitm.ac.in',
  'toronto.edu',
  'ubc.ca',
  'mcgill.ca',
];

/**
 * Validates whether an email is a valid email address for user registration & sign-in.
 */
export function isAllowedCollegeEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

/**
 * Checks if an email is specifically an institutional academic domain (for badge display).
 */
export function isInstitutionalDomain(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  const parts = normalized.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];

  if (ALLOWED_COLLEGE_DOMAINS.includes(domain)) return true;
  if (domain.endsWith('.edu') || domain.includes('.edu.')) return true;
  if (domain.endsWith('.ac.uk') || domain.endsWith('.ac.in') || domain.endsWith('.ac.jp') || domain.endsWith('.ac.nz')) return true;
  return false;
}

/**
 * Detects if an email address is an Apple Private Relay address (e.g. @privaterelay.appleid.com)
 */
export function isApplePrivateRelay(email: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith('@privaterelay.appleid.com');
}
