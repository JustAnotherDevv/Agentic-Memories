import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { type ClassProp } from 'class-variance-authority/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}