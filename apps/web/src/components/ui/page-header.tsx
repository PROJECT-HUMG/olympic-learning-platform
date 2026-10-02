import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  titleId?: string;
  className?: string;
}

export function PageHeader({ title, description, actions, titleId, className }: PageHeaderProps) {
  return <header className={cn("page-heading", className)}>
    <div className="page-heading__copy">
      <h1 id={titleId} className="page-heading__title">{title}</h1>
      {description && <p className="page-heading__description">{description}</p>}
    </div>
    {actions && <div className="page-heading__actions">{actions}</div>}
  </header>;
}
