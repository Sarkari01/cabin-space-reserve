import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface CallLog {
  id: string;
  caller_id: string;
  contact_type: 'merchant' | 'user';
  contact_id: string;
  call_purpose: 'onboarding' | 'payment_follow_up' | 'support' | 'general';
  call_status: 'completed' | 'no_answer' | 'busy' | 'invalid_number' | 'callback_requested';
  call_outcome?: 'interested' | 'not_interested' | 'call_later' | 'payment_confirmed' | 'issue_resolved' | 'escalated';
  notes?: string;
  follow_up_date?: string;
  call_duration?: number;
  created_at: string;
  contact_info?: {
    name: string;
    phone: string;
    email: string;
  };
}

export const useCallLogs = () => {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCallLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCallLogs((data || []) as CallLog[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch call logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCallLog = async (callData: Omit<CallLog, 'id' | 'caller_id' | 'created_at'>) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('call_logs')
        .insert({
          ...callData,
          caller_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setCallLogs(prev => [data as CallLog, ...prev]);
      toast({
        title: "Success",
        description: "Call log created successfully"
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create call log",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateCallLog = async (id: string, updates: Partial<CallLog>) => {
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCallLogs(prev => prev.map(log => log.id === id ? data as CallLog : log));
      toast({
        title: "Success",
        description: "Call log updated successfully"
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update call log",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchCallLogs();
  }, []);

  return {
    callLogs,
    loading,
    createCallLog,
    updateCallLog,
    refetch: fetchCallLogs
  };
};