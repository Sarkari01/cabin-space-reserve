import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, CheckCircle, AlertTriangle, Info } from "lucide-react";

interface EnhancedDepositSummaryProps {
  bookingAmount: number;
  depositAmount: number;
  totalAmount: number;
  depositRefunded?: boolean;
  showBreakdown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltips?: boolean;
  showStatus?: boolean;
}

export const EnhancedDepositSummary: React.FC<EnhancedDepositSummaryProps> = ({
  bookingAmount,
  depositAmount,
  totalAmount,
  depositRefunded = false,
  showBreakdown = true,
  size = 'md',
  className = '',
  showTooltips = true,
  showStatus = true
}) => {
  const hasDeposit = depositAmount > 0;
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-3 text-sm';
      case 'lg':
        return 'p-6 text-base';
      default:
        return 'p-4';
    }
  };

  const getTextSizes = () => {
    switch (size) {
      case 'sm':
        return {
          total: 'text-lg',
          breakdown: 'text-xs',
          icon: 'h-4 w-4'
        };
      case 'lg':
        return {
          total: 'text-3xl',
          breakdown: 'text-sm',
          icon: 'h-6 w-6'
        };
      default:
        return {
          total: 'text-xl',
          breakdown: 'text-sm',
          icon: 'h-5 w-5'
        };
    }
  };

  const textSizes = getTextSizes();

  const DepositTooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
    if (!showTooltips) return <>{children}</>;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {children}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm">{content}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card className={`${className} transition-all duration-200 hover:shadow-md`}>
      <CardContent className={getSizeClasses()}>
        <div className="space-y-3">
          {/* Total Amount */}
          <div className="flex items-center gap-2">
            <DollarSign className={`${textSizes.icon} text-primary`} />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className={`${textSizes.total} font-bold`}>
                ₹{totalAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Enhanced Breakdown */}
          {showBreakdown && (
            <div className="bg-muted/30 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <DepositTooltip content="The actual cost for using the facility or service">
                  <div className="flex items-center gap-1">
                    <span className={`${textSizes.breakdown} text-muted-foreground`}>
                      Booking Amount:
                    </span>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </div>
                </DepositTooltip>
                <span className={`${textSizes.breakdown} font-medium`}>
                  ₹{bookingAmount.toLocaleString()}
                </span>
              </div>
              
              {hasDeposit && (
                <div className="flex items-center justify-between">
                  <DepositTooltip content="A refundable security deposit that will be returned when your booking period ends, provided there's no damage">
                    <div className="flex items-center gap-1">
                      <span className={`${textSizes.breakdown} text-muted-foreground`}>
                        Refundable Deposit:
                      </span>
                      <Info className="h-3 w-3 text-muted-foreground" />
                      {depositRefunded && (
                        <Badge variant="default" className="text-xs ml-1">
                          Refunded
                        </Badge>
                      )}
                    </div>
                  </DepositTooltip>
                  <span className={`${textSizes.breakdown} font-medium ${depositRefunded ? 'text-green-600' : 'text-blue-600'}`}>
                    ₹{depositAmount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Deposit Status Indicator */}
          {hasDeposit && showStatus && (
            <div className="flex items-center gap-2 pt-2 border-t">
              {depositRefunded ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">
                    Deposit Refunded ✓
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <span className="text-xs text-blue-600 font-medium">
                      Deposit Held Securely
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Will be refunded when booking ends
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* No Deposit Indicator */}
          {!hasDeposit && showBreakdown && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                No security deposit required
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};