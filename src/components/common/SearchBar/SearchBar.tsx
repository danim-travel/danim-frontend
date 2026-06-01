import React from "react";

/**
 * SearchBar — pill 형태 검색 입력 (DM · 검색패널 · 지도)
 * state: default · focus
 * tokens: --search-*, --radius-pill
 */
export interface SearchBarProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export function SearchBar({ value, onClear, style, ...rest }: SearchBarProps) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        background: "var(--search-default-bg)",
        borderRadius: "var(--radius-pill)",
        padding: "0 var(--space-4)",
      }}
    >
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="11" cy="11" r="7" stroke="var(--color-text-tertiary)" strokeWidth="1.8" />
        <path d="m20 20-3.5-3.5" stroke="var(--color-text-tertiary)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          background: "transparent",
          padding: "var(--input-padding-y) var(--space-2)",
          fontSize: "var(--text-body-size)",
          color: "var(--search-default-fg)",
          ...style,
        }}
        {...rest}
      />
      {value && onClear && (
        <button
          onClick={onClear}
          aria-label="검색어 지우기"
          style={{
            width: 22,
            height: 22,
            display: "grid",
            placeItems: "center",
            borderRadius: "var(--radius-full)",
            background: "var(--color-text-disabled)",
            color: "var(--color-text-inverse)",
            border: "none",
            cursor: "pointer",
          }}
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
