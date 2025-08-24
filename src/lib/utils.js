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

export let placeholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI1LTA2LTAyPC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkV4dElkPjY2Mzk0NzUxLTJkNTgtNGYzNi1hMmFlLTIzYTRkNDc2NzZjMjwvQXR0cmliOkV4dElkPgogICAgIDxBdHRyaWI6RmJJZD41MjUyNjU5MTQxNzk1ODA8L0F0dHJpYjpGYklkPgogICAgIDxBdHRyaWI6VG91Y2hUeXBlPjI8L0F0dHJpYjpUb3VjaFR5cGU+CiAgICA8L3JkZjpsaT4KICAgPC9yZGY6U2VxPgogIDwvQXR0cmliOkFkcz4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6ZGM9J2h0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvJz4KICA8ZGM6dGl0bGU+CiAgIDxyZGY6QWx0PgogICAgPHJkZjpsaSB4bWw6bGFuZz0neC1kZWZhdWx0Jz5VbnRpdGxlZCBkZXNpZ24gLSAxPC9yZGY6bGk+CiAgIDwvcmRmOkFsdD4KICA8L2RjOnRpdGxlPgogPC9yZGY6RGVzY3JpcHRpb24+CgogPHJkZjpEZXNjcmlwdGlv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";