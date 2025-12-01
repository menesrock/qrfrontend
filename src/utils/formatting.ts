import { Timestamp } from 'firebase/firestore';
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes, parseISO } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

/**
 * Formats an ISO date string to a readable date string
 */
export const formatDate = (dateString: string, locale: string = 'tr'): string => {
  const date = parseISO(dateString);
  const localeObj = locale === 'tr' ? tr : enUS;
  return format(date, 'dd MMM yyyy HH:mm', { locale: localeObj });
};

/**
 * Formats a date string to show relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string, locale: string = 'tr'): string => {
  const date = parseISO(dateString);
  const localeObj = locale === 'tr' ? tr : enUS;
  return formatDistanceToNow(date, { addSuffix: true, locale: localeObj });
};

/**
 * Calculates occupancy duration in hours and minutes
 */
export const calculateOccupancyDuration = (
  occupiedSince: string
): { hours: number; minutes: number } => {
  const now = new Date();
  const startDate = parseISO(occupiedSince);
  const hours = differenceInHours(now, startDate);
  const minutes = differenceInMinutes(now, startDate) % 60;
  return { hours, minutes };
};

/**
 * Formats price with currency symbol
 */
export const formatPrice = (price: number, currency: string = '₺'): string => {
  return `${price.toFixed(2)} ${currency}`;
};

/**
 * Truncates text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
