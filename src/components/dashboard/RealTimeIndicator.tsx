import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface RealTimeIndicatorProps {
  lastUpdate: Date;
  isConnected?: boolean;
  className?: string;
}

export const RealTimeIndicator = ({ 
  lastUpdate, 
  isConnected = true, 
  className = "" 
}: RealTimeIndicatorProps) => {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
      
      if (diffInSeconds < 60) {
        setTimeAgo("Just now");
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        setTimeAgo(`${minutes}m ago`);
      } else {
        const hours = Math.floor(diffInSeconds / 3600);
        setTimeAgo(`${hours}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [lastUpdate]);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Badge 
        variant={isConnected ? "default" : "destructive"} 
        className="text-xs font-medium"
      >
        {isConnected ? (
          <Wifi className="h-3 w-3 mr-1" />
        ) : (
          <WifiOff className="h-3 w-3 mr-1" />
        )}
        {isConnected ? "Live" : "Disconnected"}
      </Badge>
      <div className="flex items-center text-xs text-muted-foreground">
        <Clock className="h-3 w-3 mr-1" />
        {timeAgo}
      </div>
    </div>
  );
};