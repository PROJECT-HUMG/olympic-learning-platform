import type { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "./button";

/** A presentation frame; feature-specific record content and actions stay with the list. */
export function ManagementListRow({ children, actions }: { children: ReactNode; actions: ReactNode }) {
  return <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-border/50 rounded-xl bg-card hover:bg-accent/20 transition-colors">
    {children}{actions}
  </div>;
}

export function ManagementRowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="flex items-center gap-2 shrink-0 self-end sm:self-center mt-2 sm:mt-0">
    <Button variant="outline" size="sm" onClick={onEdit} className="min-h-11 text-xs">
      <Pencil className="w-3.5 h-3.5 mr-1.5" />Sửa
    </Button>
    <Button variant="outline" size="sm" onClick={onDelete} className="min-h-11 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30">
      <Trash2 className="w-3.5 h-3.5 mr-1.5" />Xóa
    </Button>
  </div>;
}
