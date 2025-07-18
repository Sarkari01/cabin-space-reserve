import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  loading?: boolean;
}

export const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  className = "",
  loading = false
}: StatCardProps) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.value > 0) return TrendingUp;
    if (trend.value < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (!trend) return "secondary";
    
    if (trend.value > 0) return "default";
    if (trend.value < 0) return "destructive";
    return "secondary";
  };

  const TrendIcon = getTrendIcon();

  if (loading) {
    return (
      <Card className={`hover:shadow-md transition-shadow ${className}`}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-8 w-8 bg-muted rounded-lg"></div>
            </div>
            <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 min-w-0 flex-1">
            <p className="text-sm text-muted-foreground font-medium truncate">{title}</p>
            <p className="text-xl sm:text-2xl font-bold tracking-tight">{value}</p>
            {trend && (
              <Badge variant={getTrendColor()} className="text-xs font-medium">
                {TrendIcon && <TrendIcon className="h-3 w-3 mr-1" />}
                <span className="hidden sm:inline">{Math.abs(trend.value)}%</span>
                <span className="sm:hidden">{Math.abs(trend.value)}%</span>
                <span className="hidden sm:inline ml-1">{trend.label}</span>
              </Badge>
            )}
          </div>
          <div className="p-2 sm:p-3 bg-primary/10 rounded-xl ml-3 flex-shrink-0">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};