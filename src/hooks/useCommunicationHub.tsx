import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  target_audience: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent' | 'completed';
  created_at: string;
  sent_at?: string;
  recipients_count: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  open_rate: number;
  click_rate: number;
}

interface Message {
  id: string;
  subject: string;
  content: string;
  recipient_id: string;
  recipient_name: string;
  recipient_email: string;
  type: 'email' | 'sms' | 'in_app';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'sent' | 'delivered' | 'read';
  created_at: string;
  sent_at?: string;
  read_at?: string;
}

interface Template {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  category: string;
  subject: string;
  content: string;
  variables: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface CommunicationAnalytics {
  totalMessagesSent: number;
  messagesThisWeek: number;
  openRate: number;
  openRateTrend: number;
  responseRate: number;
  activeCampaigns: number;
}

export const useCommunicationHub = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [analytics, setAnalytics] = useState<CommunicationAnalytics>({
    totalMessagesSent: 0,
    messagesThisWeek: 0,
    openRate: 0,
    openRateTrend: 0,
    responseRate: 0,
    activeCampaigns: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCommunicationData = async () => {
    try {
      setLoading(true);
      
      // Mock data for campaigns
      const mockCampaigns: Campaign[] = [
        {
          id: "1",
          name: "Monthly Newsletter",
          type: "email",
          target_audience: "all_merchants",
          subject: "Monthly Updates and New Features",
          content: "Dear merchant, here are this month's updates...",
          status: "sent",
          created_at: new Date().toISOString(),
          sent_at: new Date().toISOString(),
          recipients_count: 250,
          sent_count: 245,
          opened_count: 168,
          clicked_count: 42,
          open_rate: 68.6,
          click_rate: 17.1
        },
        {
          id: "2",
          name: "Payment Reminder Campaign",
          type: "email",
          target_audience: "overdue_payments",
          subject: "Payment Reminder - Action Required",
          content: "Your subscription payment is overdue...",
          status: "completed",
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          recipients_count: 45,
          sent_count: 45,
          opened_count: 41,
          clicked_count: 38,
          open_rate: 91.1,
          click_rate: 84.4
        },
        {
          id: "3",
          name: "Feature Announcement",
          type: "email",
          target_audience: "active_subscribers",
          subject: "Exciting New Features Available Now!",
          content: "We've added amazing new features to help you...",
          status: "scheduled",
          created_at: new Date().toISOString(),
          recipients_count: 180,
          sent_count: 0,
          opened_count: 0,
          clicked_count: 0,
          open_rate: 0,
          click_rate: 0
        }
      ];

      // Mock data for individual messages
      const mockMessages: Message[] = [
        {
          id: "1",
          subject: "Welcome to the Platform",
          content: "Welcome! We're excited to have you on board...",
          recipient_id: "merchant-1",
          recipient_name: "John Doe",
          recipient_email: "john@example.com",
          type: "email",
          priority: "normal",
          status: "read",
          created_at: new Date().toISOString(),
          sent_at: new Date().toISOString(),
          read_at: new Date().toISOString()
        },
        {
          id: "2",
          subject: "Account Verification Required",
          content: "Please verify your account to continue...",
          recipient_id: "merchant-2",
          recipient_name: "Jane Smith",
          recipient_email: "jane@example.com",
          type: "email",
          priority: "high",
          status: "delivered",
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ];

      // Mock data for templates
      const mockTemplates: Template[] = [
        {
          id: "1",
          name: "Welcome Email",
          type: "email",
          category: "welcome",
          subject: "Welcome to {{platform_name}}, {{merchant_name}}!",
          content: "Dear {{merchant_name}}, welcome to our platform...",
          variables: ["platform_name", "merchant_name", "support_email"],
          usage_count: 45,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "2",
          name: "Payment Reminder",
          type: "email",
          category: "billing",
          subject: "Payment Reminder - {{plan_name}} Subscription",
          content: "Hi {{merchant_name}}, your payment for {{plan_name}} is due...",
          variables: ["merchant_name", "plan_name", "amount", "due_date"],
          usage_count: 28,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "3",
          name: "Support Response",
          type: "email",
          category: "support",
          subject: "Re: {{ticket_subject}}",
          content: "Thank you for contacting support. Regarding {{ticket_subject}}...",
          variables: ["merchant_name", "ticket_subject", "ticket_id", "agent_name"],
          usage_count: 67,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setCampaigns(mockCampaigns);
      setMessages(mockMessages);
      setTemplates(mockTemplates);

      // Calculate analytics
      const totalSent = mockCampaigns.reduce((sum, campaign) => sum + campaign.sent_count, 0) + mockMessages.length;
      const totalOpened = mockCampaigns.reduce((sum, campaign) => sum + campaign.opened_count, 0);
      const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
      const activeCampaigns = mockCampaigns.filter(c => c.status === 'scheduled' || c.status === 'sent').length;

      setAnalytics({
        totalMessagesSent: totalSent,
        messagesThisWeek: 23,
        openRate: Math.round(openRate * 10) / 10,
        openRateTrend: 5.2,
        responseRate: 12.3,
        activeCampaigns,
      });

    } catch (error: any) {
      console.error("Error fetching communication data:", error);
      toast({
        title: "Error",
        description: "Failed to load communication data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (campaignData: Partial<Campaign>) => {
    try {
      // In a real implementation, this would create a campaign in the database
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        name: campaignData.name || "",
        type: campaignData.type || "email",
        target_audience: campaignData.target_audience || "all_merchants",
        subject: campaignData.subject || "",
        content: campaignData.content || "",
        status: "draft" as "draft" | "scheduled" | "sent" | "completed",
        created_at: new Date().toISOString(),
        recipients_count: 0,
        sent_count: 0,
        opened_count: 0,
        clicked_count: 0,
        open_rate: 0,
        click_rate: 0
      };

      setCampaigns(prev => [newCampaign, ...prev]);
      
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (messageData: Partial<Message>) => {
    try {
      // In a real implementation, this would send a message via the appropriate channel
      const newMessage: Message = {
        id: Date.now().toString(),
        subject: messageData.subject || "",
        content: messageData.content || "",
        recipient_id: messageData.recipient_id || "",
        recipient_name: "Merchant Name", // Would be fetched from database
        recipient_email: messageData.recipient_id || "",
        type: messageData.type || "email",
        priority: messageData.priority || "normal",
        status: "sent",
        created_at: new Date().toISOString(),
        sent_at: new Date().toISOString()
      };

      setMessages(prev => [newMessage, ...prev]);
      
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const createTemplate = async (templateData: any) => {
    try {
      let processedVariables: string[] = [];
      
      if (Array.isArray(templateData.variables)) {
        processedVariables = templateData.variables;
      } else if (typeof templateData.variables === 'string' && templateData.variables) {
        processedVariables = templateData.variables.split(",").map((v: string) => v.trim()).filter((v: string) => v);
      }
      
      const newTemplate: Template = {
        id: Date.now().toString(),
        name: templateData.name || "",
        type: templateData.type || "email",
        category: templateData.category || "general",
        subject: templateData.subject || "",
        content: templateData.content || "",
        variables: processedVariables,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setTemplates(prev => [newTemplate, ...prev]);
      
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      setTemplates(prev => prev.filter(template => template.id !== templateId));
      
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const getCampaignAnalytics = async (campaignId: string) => {
    // Implementation for getting detailed campaign analytics
    return {
      opensByDay: [],
      clicksByDay: [],
      deviceBreakdown: [],
      locationBreakdown: [],
    };
  };

  useEffect(() => {
    fetchCommunicationData();
  }, []);

  return {
    campaigns,
    messages,
    templates,
    analytics,
    loading,
    createCampaign,
    sendMessage,
    createTemplate,
    deleteTemplate,
    getCampaignAnalytics,
  };
};