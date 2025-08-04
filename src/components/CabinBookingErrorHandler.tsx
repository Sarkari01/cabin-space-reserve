import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

interface CabinBookingErrorHandlerProps {
  error: Error | null;
  loading: boolean;
  onRetry: () => void;
  children: React.ReactNode;
  fallbackMessage?: string;
}

export const CabinBookingErrorHandler: React.FC<CabinBookingErrorHandlerProps> = ({
  error,
  loading,
  onRetry,
  children,
  fallbackMessage = "Something went wrong while processing your request."
}) => {
  if (error) {
    return (
      <Card className="p-6">
        <Alert variant="destructive" className="mb-4">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message || fallbackMessage}
          </AlertDescription>
        </Alert>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={onRetry} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Retrying...' : 'Try Again'}
          </Button>
          
          <div className="text-sm text-muted-foreground">
            If the problem persists, please contact support.
          </div>
        </div>
      </Card>
    );
  }

  return <>{children}</>;
};

// Specific error types for cabin booking
export class CabinBookingError extends Error {
  constructor(
    message: string,
    public code?: string,
    public retryable?: boolean
  ) {
    super(message);
    this.name = 'CabinBookingError';
  }
}

export class CabinUnavailableError extends CabinBookingError {
  constructor(cabinName?: string) {
    super(
      cabinName 
        ? `Cabin ${cabinName} is no longer available for the selected dates.`
        : 'Selected cabin is no longer available.',
      'CABIN_UNAVAILABLE',
      false
    );
  }
}

export class PaymentError extends CabinBookingError {
  constructor(message: string = 'Payment processing failed') {
    super(message, 'PAYMENT_FAILED', true);
  }
}

export class ValidationError extends CabinBookingError {
  constructor(field: string) {
    super(`Please provide a valid ${field}.`, 'VALIDATION_ERROR', false);
  }
}

// Error handler hook for cabin booking operations
export const useCabinBookingErrorHandler = () => {
  const [error, setError] = React.useState<CabinBookingError | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleError = (err: unknown) => {
    console.error('Cabin booking error:', err);
    
    if (err instanceof CabinBookingError) {
      setError(err);
    } else if (err instanceof Error) {
      setError(new CabinBookingError(err.message, 'UNKNOWN_ERROR', true));
    } else {
      setError(new CabinBookingError('An unexpected error occurred', 'UNKNOWN_ERROR', true));
    }
  };

  const clearError = () => setError(null);
  
  const retry = async (operation: () => Promise<void>) => {
    if (!error?.retryable) return;
    
    try {
      setLoading(true);
      clearError();
      await operation();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    error,
    loading,
    setLoading,
    handleError,
    clearError,
    retry
  };
};