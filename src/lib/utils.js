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

export function formatFollowers(num) {
  if (typeof num !== "number" || isNaN(num)) {
    console.warn("Invalid input: Please provide a valid number.");
    return "0 Followers";
  }

  if (num < 0) {
    return `-${formatFollowers(Math.abs(num))}`;
  }

  const K = 1000;
  const M = K * 1000;
  const B = M * 1000;

  let resultNum;
  let suffix;

  if (num < K) {
    // As is
    return `${num} Followers`;
  } else if (num < M) {
    // Thousands
    resultNum = num / K;
    suffix = "k";
  } else if (num < B) {
    // Millions
    resultNum = num / M;
    suffix = "m";
  } else {
    // Billions and above
    resultNum = num / B;
    suffix = "b";
  }

  const formattedString = resultNum.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${formattedString}${suffix} Followers`;
};