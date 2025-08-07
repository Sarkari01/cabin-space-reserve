import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface DepositSummaryProps {
  bookingAmount: number;
  depositAmount: number;
  totalAmount: number;
  depositRefunded?: boolean;
  showBreakdown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DepositSummaryCard: React.FC<DepositSummaryProps> = ({
  bookingAmount,
  depositAmount,
  totalAmount,
  depositRefunded = false,
  showBreakdown = true,
  size = 'md',
  className = ''
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

  return (
    <Card className={className}>
      <CardContent className={getSizeClasses()}>
        <div className="space-y-3">
          {/* Total Amount */}
          <div className="flex items-center gap-2">
            <DollarSign className={`${textSizes.icon} text-primary`} />
            <div>
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className={`${textSizes.total} font-bold`}>
                ₹{totalAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Breakdown */}
          {showBreakdown && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`${textSizes.breakdown} text-muted-foreground`}>
                  Booking Amount:
                </span>
                <span className={`${textSizes.breakdown} font-medium`}>
                  ₹{bookingAmount.toLocaleString()}
                </span>
              </div>
              
              {hasDeposit && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className={`${textSizes.breakdown} text-muted-foreground`}>
                      Refundable Deposit:
                    </span>
                    {depositRefunded && (
                      <Badge variant="default" className="text-xs">
                        Refunded
                      </Badge>
                    )}
                  </div>
                  <span className={`${textSizes.breakdown} font-medium ${depositRefunded ? 'text-green-600' : 'text-blue-600'}`}>
                    ₹{depositAmount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Deposit Status Indicator */}
          {hasDeposit && (
            <div className="flex items-center gap-2 pt-2 border-t">
              {depositRefunded ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">
                    Deposit Refunded
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">
                    Deposit Held
                  </span>
                </>
              )}
            </div>
          )}

          {/* No Deposit Indicator */}
          {!hasDeposit && showBreakdown && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                No deposit required
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};