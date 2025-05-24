import type { ReactNode } from 'react';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function DashboardHeader({ title, description, actions }: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center sm:gap-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
