import { PageHeader } from "./page-header";

interface PublicPageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function PublicPageHeader({ title, description, className = "" }: PublicPageHeaderProps) {
  return <PageHeader title={title} description={description} className={className} />;
}
