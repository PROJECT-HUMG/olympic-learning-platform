import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getActiveNavigationItem, type NavigationGroup } from "../navigation";

export function NavigationGroups({
  groups,
  onNavigate,
}: {
  groups: NavigationGroup[];
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const active = getActiveNavigationItem(
    groups.flatMap((group) => group.items),
    location.pathname,
    location.search,
  );
  return (
    <nav aria-label="Các khu vực của website" className="navigation-groups">
      {groups.map((group) => (
        <section key={group.label}>
          <h2>{group.label}</h2>
          <ul>
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={onNavigate}
                  aria-current={active?.href === item.href ? "page" : undefined}
                  className={cn(
                    "navigation-groups__link",
                    active?.href === item.href &&
                      "navigation-groups__link--active",
                  )}
                >
                  <item.icon aria-hidden="true" size={18} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
