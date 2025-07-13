import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
};

// Common skeleton components
const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-3", className)}>
    <Skeleton className="h-[200px] w-full rounded-lg" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
  </div>
);

const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="space-y-3">
    <div className="flex space-x-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-8 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-6 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

const StatCardSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-[100px]" />
    <Skeleton className="h-8 w-[60px]" />
    <Skeleton className="h-3 w-[80px]" />
  </div>
);

const ListItemSkeleton = () => (
  <div className="flex items-center space-x-4">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
  </div>
);

export { 
  Skeleton, 
  CardSkeleton, 
  TableSkeleton, 
  StatCardSkeleton, 
  ListItemSkeleton 
};