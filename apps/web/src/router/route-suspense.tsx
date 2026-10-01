import { Suspense, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { PageLoading } from "@/components/ui/page-loading";

export function RouteSuspense({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  // A different page should show its pending state; query changes keep its state.
  return <Suspense key={pathname} fallback={<PageLoading />}>{children}</Suspense>;
}
