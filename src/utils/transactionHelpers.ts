import { supabase } from "@/integrations/supabase/client";

/**
 * Utility functions for handling transaction and booking consistency
 */

export const validateTransactionBookingLink = async (transactionId: string) => {
  try {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select(`
        *,
        booking:bookings(*)
      `)
      .eq('id', transactionId)
      .single();

    if (error) {
      console.error('Error fetching transaction:', error);
      return { valid: false, error: error.message };
    }

    // Check if transaction has a booking_id but no booking exists
    if (transaction.booking_id && !transaction.booking) {
      console.warn('Orphaned transaction detected:', transactionId);
      return { 
        valid: false, 
        error: 'Transaction references non-existent booking',
        needsCleanup: true 
      };
    }

    // Check if online payment is completed but no booking exists
    if (
      transaction.status === 'completed' && 
      ['ekqr', 'razorpay'].includes(transaction.payment_method) && 
      !transaction.booking_id
    ) {
      console.warn('Completed online payment without booking:', transactionId);
      return { 
        valid: false, 
        error: 'Completed payment missing booking',
        needsBookingCreation: true 
      };
    }

    return { valid: true, transaction };
  } catch (error) {
    console.error('Error validating transaction:', error);
    return { valid: false, error: error.message };
  }
};

export const canMerchantConfirmTransaction = (transaction: any) => {
  // Only offline payments with pending status and valid booking can be confirmed
  return (
    transaction.payment_method === 'offline' &&
    transaction.status === 'pending' &&
    transaction.booking_id &&
    transaction.booking
  );
};

export const getTransactionDisplayStatus = (transaction: any) => {
  if (!transaction.booking_id) {
    return {
      status: 'error',
      message: 'Missing booking data',
      canConfirm: false
    };
  }

  switch (transaction.status) {
    case 'pending':
      if (transaction.payment_method === 'offline') {
        return {
          status: 'pending_confirmation',
          message: 'Awaiting merchant confirmation',
          canConfirm: true
        };
      }
      return {
        status: 'processing',
        message: 'Payment processing',
        canConfirm: false
      };
    case 'completed':
      return {
        status: 'success',
        message: 'Payment confirmed',
        canConfirm: false
      };
    case 'failed':
      return {
        status: 'failed',
        message: 'Payment failed',
        canConfirm: false
      };
    default:
      return {
        status: 'unknown',
        message: 'Unknown status',
        canConfirm: false
      };
  }
};