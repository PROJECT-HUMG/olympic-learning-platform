import type { ReactNode } from "react";
import { SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { NavigationGroup } from "../navigation";
import { NavigationGroups } from "./navigation-groups";
import { PublicDisplaySettings } from "./public-display-settings";

/** The caller owns the trigger/open state; Radix owns modality and focus return. */
export function NavigationDrawer({ groups, onNavigate, workspace = false, footer, onCloseAutoFocus }: {
  groups: NavigationGroup[];
  onNavigate: () => void;
  workspace?: boolean;
  footer?: ReactNode;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  return <SheetContent side="left" className="navigation-drawer" onCloseAutoFocus={onCloseAutoFocus}>
    <SheetHeader className="navigation-drawer__header">
      <SheetTitle>{workspace ? "Không gian của bạn" : "Olympic HUMG"}</SheetTitle>
      <SheetDescription className="sr-only">Chọn khu vực học tập, thông tin hoặc quản lý theo quyền của bạn.</SheetDescription>
    </SheetHeader>
    <div className="navigation-drawer__body">
      <NavigationGroups groups={groups} onNavigate={onNavigate} />
    </div>
    <div className="navigation-drawer__footer">
      <PublicDisplaySettings />
      {footer}
    </div>
  </SheetContent>;
}
