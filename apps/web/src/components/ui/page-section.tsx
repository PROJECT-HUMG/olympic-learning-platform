import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageSectionProps extends Omit<ComponentProps<"section">, "title"> {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageSection({ title, description, actions, children, className, ...props }: PageSectionProps) {
  const titleId = useId();
  return <section className={cn("page-section", className)} aria-labelledby={titleId} {...props}>
    <header className="page-section__heading">
      <div><h2 id={titleId}>{title}</h2>{description && <p>{description}</p>}</div>
      {actions && <div className="page-heading__actions">{actions}</div>}
    </header>
    <div className="page-section__content">{children}</div>
  </section>;
}
