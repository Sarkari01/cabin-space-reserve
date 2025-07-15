import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNavigation({ items, className }: BreadcrumbNavigationProps) {
  return (
    <nav className={`flex items-center space-x-1 text-sm text-muted-foreground ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2"
        onClick={() => window.location.href = '/'}
      >
        <Home className="h-4 w-4" />
      </Button>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
          {item.href && !item.active ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 font-normal"
              onClick={() => window.location.href = item.href!}
            >
              {item.label}
            </Button>
          ) : (
            <span className={`px-2 ${item.active ? 'text-foreground font-medium' : ''}`}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  breadcrumbs, 
  actions, 
  className 
}: PageHeaderProps) {
  return (
    <div className={`space-y-4 pb-4 border-b ${className}`}>
      {breadcrumbs && <BreadcrumbNavigation items={breadcrumbs} />}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}