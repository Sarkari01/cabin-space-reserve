import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface SupportTicket {
  id: string;
  ticket_number: number;
  user_id?: string;
  merchant_id?: string;
  assigned_to?: string;
  title: string;
  description: string;
  category: 'technical' | 'billing' | 'booking' | 'general' | 'complaint';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  resolution?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  user_info?: {
    name: string;
    email: string;
    phone?: string;
  };
  merchant_info?: {
    name: string;
    email: string;
    phone?: string;
  };
  assignee_info?: {
    name: string;
    email: string;
  };
}

export const useSupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          user_info:profiles!support_tickets_user_id_fkey(full_name, email, phone),
          merchant_info:profiles!support_tickets_merchant_id_fkey(full_name, email, phone),
          assignee_info:profiles!support_tickets_assigned_to_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      // Filter based on user role
      if (userRole === 'student') {
        query = query.eq('user_id', user?.id);
      } else if (userRole === 'merchant') {
        query = query.eq('merchant_id', user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const transformedData = (data || []).map(ticket => ({
        ...ticket,
        user_info: ticket.user_info ? {
          name: ticket.user_info.full_name || 'Unknown',
          email: ticket.user_info.email,
          phone: ticket.user_info.phone
        } : undefined,
        merchant_info: ticket.merchant_info ? {
          name: ticket.merchant_info.full_name || 'Unknown',
          email: ticket.merchant_info.email,
          phone: ticket.merchant_info.phone
        } : undefined,
        assignee_info: ticket.assignee_info ? {
          name: ticket.assignee_info.full_name || 'Unknown',
          email: ticket.assignee_info.email
        } : undefined
      })) as SupportTicket[];
      setTickets(transformedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch support tickets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (ticketData: {
    title: string;
    description: string;
    category: SupportTicket['category'];
    priority?: SupportTicket['priority'];
    user_id?: string;
    merchant_id?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) throw error;

      setTickets(prev => [data as SupportTicket, ...prev]);
      toast({
        title: "Success",
        description: "Support ticket created successfully"
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create support ticket",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateTicket = async (id: string, updates: Partial<SupportTicket>) => {
    try {
      const updateData = { ...updates };
      
      // Set resolved_at when status changes to resolved
      if (updates.status === 'resolved' && updates.status !== tickets.find(t => t.id === id)?.status) {
        updateData.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTickets(prev => prev.map(ticket => ticket.id === id ? data as SupportTicket : ticket));
      toast({
        title: "Success",
        description: "Support ticket updated successfully"
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update support ticket",
        variant: "destructive"
      });
      throw error;
    }
  };

  const assignTicket = async (ticketId: string, assigneeId: string) => {
    return updateTicket(ticketId, { 
      assigned_to: assigneeId, 
      status: 'in_progress' 
    });
  };

  const closeTicket = async (ticketId: string, resolution: string) => {
    return updateTicket(ticketId, { 
      status: 'resolved', 
      resolution,
      resolved_at: new Date().toISOString()
    });
  };

  useEffect(() => {
    fetchTickets();
  }, [userRole]);

  return {
    tickets,
    loading,
    createTicket,
    updateTicket,
    assignTicket,
    closeTicket,
    refetch: fetchTickets
  };
};