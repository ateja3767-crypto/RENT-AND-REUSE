import React, { useState, useEffect } from 'react';
import { getFallbackProductImage, isValidImageUrl } from '../../utils/imageValidation';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackTitle?: string;
  title?: string;
  category?: string;
  itemId?: string;
  fallbackSrc?: string;
  onAllImagesFailed?: () => void;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'Campus Product',
  fallbackTitle,
  title,
  category,
  itemId,
  fallbackSrc,
  onAllImagesFailed,
  className = '',
  ...props
}) => {
  const effectiveTitle = fallbackTitle || title || alt;
  const configuredFallback =
    fallbackSrc && isValidImageUrl(fallbackSrc)
      ? fallbackSrc
      : getFallbackProductImage(category, effectiveTitle, itemId);

  const initialSrc = isValidImageUrl(src) ? src : configuredFallback;

  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [triedFallback, setTriedFallback] = useState<boolean>(!isValidImageUrl(src));
  const [allFailed, setAllFailed] = useState<boolean>(false);

  useEffect(() => {
    const validPrimary = isValidImageUrl(src);
    setCurrentSrc(validPrimary ? src : configuredFallback);
    setTriedFallback(!validPrimary);
    setAllFailed(false);
  }, [src, configuredFallback]);

  const handleImageError = () => {
    if (!triedFallback && configuredFallback && currentSrc !== configuredFallback) {
      console.warn(
        `[RentReuse Image Warning] Primary image failed to load ("${currentSrc}") for "${
          fallbackTitle || alt
        }". Switching to verified fallback image.`
      );
      setTriedFallback(true);
      setCurrentSrc(configuredFallback);
      return;
    }

    console.error(
      `[RentReuse Image Error] Both primary ("${src}") and fallback ("${configuredFallback}") images failed to load for product "${
        fallbackTitle || alt
      }". Removing product card from view.`
    );
    setAllFailed(true);
    if (onAllImagesFailed) {
      onAllImagesFailed();
    }
  };

  if (allFailed || !currentSrc) {
    return null;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={handleImageError}
      loading="lazy"
      className={`object-cover ${className}`}
      {...props}
    />
  );
};
