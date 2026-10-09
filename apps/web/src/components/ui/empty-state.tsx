import type { ReactNode } from "react";
import { ListFeedback } from "./list-feedback";

export function EmptyState({ icon, title, children, actions }: { icon: ReactNode; title: string; children: ReactNode; actions?: ReactNode }) {
  return <ListFeedback icon={icon} title={title} actions={actions}>{children}</ListFeedback>;
}
