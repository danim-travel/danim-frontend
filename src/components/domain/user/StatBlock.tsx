import React from "react";

export interface StatBlockProps { value: string | number; label: string; }

export function StatBlock({ value, label }: StatBlockProps) {
  return (
    <div className="grid place-items-center bg-bg-subtle rounded-lg px-6 py-5 min-w-[120px]">
      <div className="text-[22px] font-bold text-text">{value}</div>
      <div className="text-[12px] text-text-muted mt-1">{label}</div>
    </div>
  );
}

export default StatBlock;
