import React from 'react'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function bgCoverStyle(url: string | undefined): React.CSSProperties | undefined {
  if (!url) return undefined;
  return { backgroundImage: `url(${url})`, backgroundSize: "cover", backgroundPosition: "center" };
}
