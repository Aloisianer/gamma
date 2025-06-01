import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
};

export function formatTime(time) {
  if (isNaN(time) || !isFinite(time)) return "0:00";
  let minutes = Math.floor(time / 60);
  let seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};


export function getStoredValue(key, defaultValue) {
  if (typeof window === 'undefined') return defaultValue;
  let value = localStorage.getItem(key);
  return value ? JSON.parse(value) : defaultValue;
};

export function containsUsefulInfo(str) {
    return /[a-zA-Z0-9]/.test(str);
};