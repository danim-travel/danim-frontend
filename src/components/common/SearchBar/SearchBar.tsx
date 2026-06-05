"use client";
import React from "react";
import { cn } from "@/lib/utils";

export type SearchBarSize = "sm" | "md";

export interface SearchBarProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  onClear?: () => void;
  variant?: "pill" | "panel";
  size?: SearchBarSize;
}

const wrapperSizeClasses: Record<SearchBarSize, string> = {
  sm: "py-0",
  md: "",
};

const inputSizeClasses: Record<SearchBarSize, string> = {
  sm: "py-2",
  md: "py-3",
};

export function SearchBar({
  value,
  onClear,
  variant = "pill",
  size = "md",
  className,
  ...rest
}: SearchBarProps) {
  return (
    <div className={cn(
      "relative flex items-center bg-(--search-bg) px-4",
      variant === "panel" ? "rounded-input" : "rounded-pill",
      wrapperSizeClasses[size]
    )}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-text-muted">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        className={cn(
          "flex-1 border-none outline-none bg-transparent px-2 text-base text-(--search-text)",
          inputSizeClasses[size],
          className
        )}
        {...rest}
      />
      {value && onClear && (
        <button
          onClick={onClear}
          aria-label="검색어 지우기"
          className="w-5.5 h-5.5 shrink-0 grid place-items-center rounded-full bg-text-disabled text-text-inverse border-none cursor-pointer"
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default SearchBar;
