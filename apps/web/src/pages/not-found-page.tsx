import { Link } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <Link
        to={ROUTES.DASHBOARD}
        className="text-primary underline underline-offset-4"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
