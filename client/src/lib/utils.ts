import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "MMM d, h:mm a");
}
