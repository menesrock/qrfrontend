import { VALIDATION } from '../config/constants';

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password length
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= VALIDATION.MIN_PASSWORD_LENGTH;
};

/**
 * Validates customer note length
 */
export const isValidNoteLength = (note: string): boolean => {
  return note.length <= VALIDATION.MAX_NOTE_LENGTH;
};

/**
 * Validates hex color format
 */
export const isValidHexColor = (color: string): boolean => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
};
