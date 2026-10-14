import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export interface PublicBreadcrumbItem {
  label: string;
  href?: string;
}

export interface PublicPageHeaderProps {
  title: string;
  description?: ReactNode;
  badge?: ReactNode;
  breadcrumbs?: PublicBreadcrumbItem[];
  actions?: ReactNode;
  stats?: ReactNode;
  titleId?: string;
  className?: string;
}

export function PublicPageHeader({
  title,
  description,
  badge,
  breadcrumbs,
  actions,
  stats,
  titleId,
  className = "",
}: PublicPageHeaderProps) {
  return (
    <header className={cn("public-sub-hero", className)}>
      <div className="public-sub-hero__content">
        <div className="public-sub-hero__main">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumb className="mb-1 text-xs">
              <BreadcrumbList>
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <Fragment key={crumb.label}>
                      <BreadcrumbItem>
                        {crumb.href && !isLast ? (
                          <BreadcrumbLink asChild>
                            <Link to={crumb.href}>{crumb.label}</Link>
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          )}

          {badge && (
            <div className="public-sub-hero__badge">
              {typeof badge === "string" ? (
                <Badge
                  variant="outline"
                  className="bg-muted text-muted-foreground border-border font-medium text-xs px-2.5 py-1"
                >
                  {badge}
                </Badge>
              ) : (
                badge
              )}
            </div>
          )}

          <h1 id={titleId} className="public-sub-hero__title">
            {title}
          </h1>

          {description && (
            <div className="public-sub-hero__description">{description}</div>
          )}

          {stats && <div className="mt-2">{stats}</div>}
        </div>

        {actions && <div className="public-sub-hero__aside">{actions}</div>}
      </div>
    </header>
  );
}
