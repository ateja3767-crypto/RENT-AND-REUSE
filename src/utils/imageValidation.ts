import { Category, Item } from '../types';

export const PRODUCT_IMAGE_PATHS = {
  heroCampus: '/images/hero_campus_reuse_1791025487124.jpg',
  draftingKit: '/images/item_drafting_kit_1791025504839.jpg',
  labMicroscope: '/images/item_lab_microscope_1791025516048.jpg',
  graphingCalc: '/images/item_graphing_calc_1791025528089.jpg',
  physicsBooks: '/images/item_physics_books_1791091697574.jpg',
  arduinoKit: '/images/item_arduino_kit_1791091709471.jpg',
  chemistryKit: '/images/item_chemistry_kit_1791091721221.jpg',
  sonyHeadphones: '/images/item_sony_headphones_1791091732510.jpg',
  studyChair: '/images/item_study_chair_1791091747070.jpg',
  graduationGown: '/images/item_graduation_gown_1791091757929.jpg',
  tennisRacket: '/images/item_tennis_racket_1791091769547.jpg',
  pocketProjector: '/images/item_pocket_projector_1791091781245.jpg',
  cuttingMat: '/images/item_cutting_mat_1791091793560.jpg',
  algorithmsBook: '/images/item_algorithms_book_1791091805645.jpg',
  garmentSteamer: '/images/item_garment_steamer_1791091819526.jpg',
  commuterBicycle: '/images/item_commuter_bicycle_1791091831899.jpg',
  midiKeyboard: '/images/item_midi_keyboard_1791091845281.jpg',
  canonCamera: '/images/item_canon_camera_1791091856125.jpg',
} as const;

export const ITEM_ID_TO_VERIFIED_PHOTOS: Record<string, string[]> = {
  item_1: [PRODUCT_IMAGE_PATHS.draftingKit, PRODUCT_IMAGE_PATHS.cuttingMat],
  item_2: [PRODUCT_IMAGE_PATHS.labMicroscope, PRODUCT_IMAGE_PATHS.chemistryKit],
  item_3: [PRODUCT_IMAGE_PATHS.graphingCalc, PRODUCT_IMAGE_PATHS.arduinoKit],
  item_4: [PRODUCT_IMAGE_PATHS.physicsBooks, PRODUCT_IMAGE_PATHS.algorithmsBook],
  item_5: [PRODUCT_IMAGE_PATHS.arduinoKit, PRODUCT_IMAGE_PATHS.graphingCalc],
  item_6: [PRODUCT_IMAGE_PATHS.chemistryKit, PRODUCT_IMAGE_PATHS.labMicroscope],
  item_7: [PRODUCT_IMAGE_PATHS.sonyHeadphones, PRODUCT_IMAGE_PATHS.pocketProjector],
  item_8: [PRODUCT_IMAGE_PATHS.studyChair],
  item_9: [PRODUCT_IMAGE_PATHS.graduationGown, PRODUCT_IMAGE_PATHS.garmentSteamer],
  item_10: [PRODUCT_IMAGE_PATHS.tennisRacket, PRODUCT_IMAGE_PATHS.commuterBicycle],
  item_11: [PRODUCT_IMAGE_PATHS.pocketProjector, PRODUCT_IMAGE_PATHS.sonyHeadphones],
  item_12: [PRODUCT_IMAGE_PATHS.cuttingMat, PRODUCT_IMAGE_PATHS.draftingKit],
  item_13: [PRODUCT_IMAGE_PATHS.algorithmsBook, PRODUCT_IMAGE_PATHS.physicsBooks],
  item_14: [PRODUCT_IMAGE_PATHS.garmentSteamer, PRODUCT_IMAGE_PATHS.graduationGown],
  item_15: [PRODUCT_IMAGE_PATHS.commuterBicycle, PRODUCT_IMAGE_PATHS.tennisRacket],
  item_16: [PRODUCT_IMAGE_PATHS.midiKeyboard],
  item_17: [PRODUCT_IMAGE_PATHS.canonCamera, PRODUCT_IMAGE_PATHS.pocketProjector],
};

export const CATEGORY_FALLBACK_IMAGE: Record<Category | string, string> = {
  'Engineering Tools': PRODUCT_IMAGE_PATHS.draftingKit,
  Books: PRODUCT_IMAGE_PATHS.physicsBooks,
  Electronics: PRODUCT_IMAGE_PATHS.canonCamera,
  'Lab Equipment': PRODUCT_IMAGE_PATHS.labMicroscope,
  Furniture: PRODUCT_IMAGE_PATHS.studyChair,
  Clothing: PRODUCT_IMAGE_PATHS.graduationGown,
  Sports: PRODUCT_IMAGE_PATHS.commuterBicycle,
  Other: PRODUCT_IMAGE_PATHS.midiKeyboard,
};

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Validates that an image URL/path is non-empty, not null/undefined, not a local computer file:// path,
 * not a synthetic SVG text placeholder, and points to a valid image asset.
 */
export function isValidImageUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed === 'about:blank' ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('blob:') ||
    /^[a-zA-Z]:\\/.test(trimmed)
  ) {
    return false;
  }

  // Reject old synthetic text-card SVG placeholders ("VERIFIED CAMPUS GEAR")
  if (trimmed.startsWith('data:image/svg+xml')) {
    return false;
  }

  // Allow uploaded data URLs in JPG, JPEG, PNG, WEBP formats
  if (trimmed.startsWith('data:image/')) {
    return /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(trimmed);
  }

  // Allow valid relative paths (/images/..., /src/assets/images/...) or https:// URLs
  if (
    trimmed.startsWith('/images/') ||
    trimmed.startsWith('/src/assets/images/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://')
  ) {
    return true;
  }

  return false;
}

/**
 * Resolves a product's valid photo list. If an existing seed product had an SVG placeholder,
 * maps it to its exact verified photographic asset.
 */
export function getValidProductPhotos(item?: Partial<Item> | null): string[] {
  if (!item) return [];

  const validDirectPhotos = Array.isArray(item.photos)
    ? item.photos
        .map((p) => (typeof p === 'string' ? p.trim() : ''))
        .filter((p) => isValidImageUrl(p))
    : [];

  if (validDirectPhotos.length > 0) {
    return validDirectPhotos;
  }

  // Check if this is a known catalog item ID
  if (item.id && ITEM_ID_TO_VERIFIED_PHOTOS[item.id]) {
    return ITEM_ID_TO_VERIFIED_PHOTOS[item.id];
  }

  // Match by title keywords for any legacy persisted items
  const titleLower = (item.title || '').toLowerCase();
  if (titleLower.includes('drafter') || titleLower.includes('rotring')) {
    return [PRODUCT_IMAGE_PATHS.draftingKit];
  }
  if (titleLower.includes('microscope') || titleLower.includes('olympus')) {
    return [PRODUCT_IMAGE_PATHS.labMicroscope];
  }
  if (titleLower.includes('calculator') || titleLower.includes('ti-84')) {
    return [PRODUCT_IMAGE_PATHS.graphingCalc];
  }
  if (titleLower.includes('physics') || titleLower.includes('calculus')) {
    return [PRODUCT_IMAGE_PATHS.physicsBooks];
  }
  if (titleLower.includes('arduino') || titleLower.includes('sensor')) {
    return [PRODUCT_IMAGE_PATHS.arduinoKit];
  }
  if (titleLower.includes('molecular') || titleLower.includes('chemistry')) {
    return [PRODUCT_IMAGE_PATHS.chemistryKit];
  }
  if (titleLower.includes('headphone') || titleLower.includes('sony')) {
    return [PRODUCT_IMAGE_PATHS.sonyHeadphones];
  }
  if (titleLower.includes('chair') || titleLower.includes('desk') || titleLower.includes('ergonomic')) {
    return [PRODUCT_IMAGE_PATHS.studyChair];
  }
  if (titleLower.includes('gown') || titleLower.includes('graduation')) {
    return [PRODUCT_IMAGE_PATHS.graduationGown];
  }
  if (titleLower.includes('tennis') || titleLower.includes('racket') || titleLower.includes('wilson')) {
    return [PRODUCT_IMAGE_PATHS.tennisRacket];
  }
  if (titleLower.includes('projector') || titleLower.includes('nebula') || titleLower.includes('anker')) {
    return [PRODUCT_IMAGE_PATHS.pocketProjector];
  }
  if (titleLower.includes('cutter') || titleLower.includes('cutting mat') || titleLower.includes('olfa')) {
    return [PRODUCT_IMAGE_PATHS.cuttingMat];
  }
  if (titleLower.includes('algorithm') || titleLower.includes('clrs') || titleLower.includes('book')) {
    return [PRODUCT_IMAGE_PATHS.algorithmsBook];
  }
  if (titleLower.includes('steamer') || titleLower.includes('iron') || titleLower.includes('rowenta')) {
    return [PRODUCT_IMAGE_PATHS.garmentSteamer];
  }
  if (titleLower.includes('bicycle') || titleLower.includes('bike') || titleLower.includes('dahon')) {
    return [PRODUCT_IMAGE_PATHS.commuterBicycle];
  }
  if (titleLower.includes('midi') || titleLower.includes('keyboard') || titleLower.includes('alesis')) {
    return [PRODUCT_IMAGE_PATHS.midiKeyboard];
  }
  if (titleLower.includes('camera') || titleLower.includes('canon') || titleLower.includes('dslr')) {
    return [PRODUCT_IMAGE_PATHS.canonCamera];
  }

  return [];
}

/**
 * Returns true if the product has at least one valid, verified product image.
 */
export function hasValidProductImage(item?: Partial<Item> | null): boolean {
  if (!item) return false;
  const trimmedTitle = (item.title || '').trim();
  // Reject invalid single-character test listings without real product photos (e.g., "a")
  if (trimmedTitle.length <= 1 && (!Array.isArray(item.photos) || !item.photos.some(isValidImageUrl))) {
    return false;
  }
  return getValidProductPhotos(item).length > 0;
}

/**
 * Returns a relevant fallback image for a given category, product title, or itemId.
 * Supports both (category, title) and (title, category, itemId) call signatures.
 */
export function getFallbackProductImage(
  firstArg?: string,
  secondArg?: string,
  itemId?: string
): string {
  if (itemId && ITEM_ID_TO_VERIFIED_PHOTOS[itemId]?.length) {
    return ITEM_ID_TO_VERIFIED_PHOTOS[itemId][0];
  }

  const combinedTitle = `${firstArg || ''} ${secondArg || ''}`.trim();
  const photos = getValidProductPhotos({ id: itemId, title: combinedTitle });
  if (photos.length > 0) return photos[0];

  if (firstArg && CATEGORY_FALLBACK_IMAGE[firstArg]) {
    return CATEGORY_FALLBACK_IMAGE[firstArg];
  }
  if (secondArg && CATEGORY_FALLBACK_IMAGE[secondArg]) {
    return CATEGORY_FALLBACK_IMAGE[secondArg];
  }

  return PRODUCT_IMAGE_PATHS.draftingKit;
}

/**
 * Ensures an Item always has a non-empty array of valid, loadable product photo URLs.
 */
export function ensureValidItemPhotos(item: Item): Item {
  const validPhotos = getValidProductPhotos(item);
  if (validPhotos.length > 0) {
    return {
      ...item,
      photos: validPhotos,
    };
  }
  return {
    ...item,
    photos: [getFallbackProductImage(item.category, item.title, item.id)],
  };
}

/**
 * Audits and sanitizes an entire array of catalog items:
 * - Removes any invalid test product without a valid image (e.g., "a")
 * - Ensures every remaining product has verified, valid product photos
 */
export function sanitizeCatalogItems(items: Item[]): Item[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => Boolean(item && hasValidProductImage(item)))
    .map((item) => ensureValidItemPhotos(item));
}

/**
 * Validates an uploaded File object for product listing images.
 */
export function validateUploadedImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Product image is required.' };
  }

  const mimeValid = ALLOWED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase());
  const extValid = ALLOWED_IMAGE_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!mimeValid && !extValid) {
    return {
      valid: false,
      error: 'Invalid image format. Please upload a JPG, JPEG, PNG, or WEBP image file.',
    };
  }

  const maxBytes = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: 'Image file size must be under 10 MB.',
    };
  }

  return { valid: true };
}
