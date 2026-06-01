import React from "react";

export interface EmptyStateProps { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; }

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 gap-3">
      {icon && <div className="text-text-disabled">{icon}</div>}
      <div className="text-[16px] font-semibold text-text">{title}</div>
      {description && <div className="text-[14px] text-text-muted">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export default EmptyState;
