interface PublicPageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function PublicPageHeader({ title, description, className = "" }: PublicPageHeaderProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
