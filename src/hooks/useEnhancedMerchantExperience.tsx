import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface UsageMetrics {
  activeSessions: number;
  featureAdoption: number;
  supportTickets: number;
  satisfactionScore: number;
  featureUsage: {
    name: string;
    usage: number;
    trend: number;
  }[];
  userJourney: {
    step: string;
    description: string;
    completionRate: number;
    avgTime: string;
  }[];
}

interface Recommendation {
  id: string;
  merchantId: string;
  merchantName: string;
  type: 'plan_upgrade' | 'feature_adoption' | 'usage_optimization' | 'cost_savings';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  expectedImpact: string;
  actionRequired: string;
  status: string;
  created_at: string;
}

interface FeedbackRequest {
  id: string;
  type: 'feature_request' | 'bug_report' | 'improvement' | 'general';
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  submittedBy: string;
  votes: number;
  created_at: string;
}

interface MobileOptimization {
  mobileUsers: number;
  performanceScore: number;
  appDownloads: number;
  deviceBreakdown: {
    type: string;
    name: string;
    percentage: number;
    users: number;
  }[];
}

interface SelfServiceTool {
  name: string;
  description: string;
  type: string;
  usageRate: number;
  satisfaction: number;
  features: string[];
}

interface Analytics {
  userEngagement: number;
  featureAdoptionRate: number;
  supportTicketReduction: number;
  satisfactionImprovement: number;
}

export const useEnhancedMerchantExperience = () => {
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics>({
    activeSessions: 0,
    featureAdoption: 0,
    supportTickets: 0,
    satisfactionScore: 0,
    featureUsage: [],
    userJourney: [],
  });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [feedbackRequests, setFeedbackRequests] = useState<FeedbackRequest[]>([]);
  const [mobileOptimization, setMobileOptimization] = useState<MobileOptimization>({
    mobileUsers: 0,
    performanceScore: 0,
    appDownloads: 0,
    deviceBreakdown: [],
  });
  const [selfServiceTools, setSelfServiceTools] = useState<SelfServiceTool[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    userEngagement: 0,
    featureAdoptionRate: 0,
    supportTicketReduction: 0,
    satisfactionImprovement: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEnhancedExperienceData = async () => {
    try {
      setLoading(true);
      
      // Mock data for usage metrics
      const mockUsageMetrics: UsageMetrics = {
        activeSessions: 342,
        featureAdoption: 78,
        supportTickets: 23,
        satisfactionScore: 4.6,
        featureUsage: [
          { name: "Dashboard", usage: 95, trend: 2 },
          { name: "Analytics", usage: 87, trend: 5 },
          { name: "Billing", usage: 82, trend: -1 },
          { name: "Settings", usage: 76, trend: 3 },
          { name: "Reports", usage: 68, trend: 8 },
          { name: "API Access", usage: 45, trend: 12 },
          { name: "Integrations", usage: 34, trend: -3 },
          { name: "Mobile App", usage: 28, trend: 15 }
        ],
        userJourney: [
          {
            step: "Login",
            description: "User authentication",
            completionRate: 98,
            avgTime: "15s"
          },
          {
            step: "Dashboard View",
            description: "Main dashboard access",
            completionRate: 92,
            avgTime: "45s"
          },
          {
            step: "Feature Exploration",
            description: "Exploring platform features",
            completionRate: 76,
            avgTime: "3m 20s"
          },
          {
            step: "Task Completion",
            description: "Completing main tasks",
            completionRate: 84,
            avgTime: "8m 15s"
          },
          {
            step: "Account Settings",
            description: "Updating account preferences",
            completionRate: 45,
            avgTime: "2m 30s"
          }
        ]
      };

      // Mock data for recommendations
      const mockRecommendations: Recommendation[] = [
        {
          id: "1",
          merchantId: "merchant-1",
          merchantName: "TechCorp Solutions",
          type: "plan_upgrade",
          title: "Upgrade to Premium Plan",
          description: "Based on your usage patterns, upgrading to Premium would provide better value and access to advanced analytics features.",
          priority: "high",
          expectedImpact: "30% cost savings, Advanced analytics, Priority support",
          actionRequired: "Review plan comparison and schedule upgrade",
          status: "pending",
          created_at: new Date().toISOString()
        },
        {
          id: "2",
          merchantId: "merchant-2",
          merchantName: "StartupHub",
          type: "feature_adoption",
          title: "Enable API Integration",
          description: "You haven't explored our API features yet. Integration can automate many of your current manual processes.",
          priority: "medium",
          expectedImpact: "50% time savings on data entry, Better automation",
          actionRequired: "Review API documentation and integration guide",
          status: "new",
          created_at: new Date().toISOString()
        },
        {
          id: "3",
          merchantId: "merchant-3",
          merchantName: "GrowthCo",
          type: "usage_optimization",
          title: "Optimize Dashboard Layout",
          description: "Your most-used features aren't prominently displayed. Customizing your dashboard could improve efficiency.",
          priority: "low",
          expectedImpact: "Better user experience, Faster task completion",
          actionRequired: "Access dashboard customization settings",
          status: "in_progress",
          created_at: new Date().toISOString()
        }
      ];

      // Mock data for feedback requests
      const mockFeedbackRequests: FeedbackRequest[] = [
        {
          id: "1",
          type: "feature_request",
          title: "Mobile App Push Notifications",
          description: "Request for real-time push notifications in the mobile app for important updates and alerts.",
          category: "mobile",
          priority: "high",
          status: "under_review",
          submittedBy: "Multiple Merchants",
          votes: 23,
          created_at: new Date().toISOString()
        },
        {
          id: "2",
          type: "improvement",
          title: "Enhanced Analytics Dashboard",
          description: "Merchants want more detailed analytics with custom date ranges and export capabilities.",
          category: "analytics",
          priority: "medium",
          status: "planned",
          submittedBy: "Premium Users",
          votes: 17,
          created_at: new Date().toISOString()
        },
        {
          id: "3",
          type: "bug_report",
          title: "Billing History Export Issue",
          description: "Users report issues when trying to export billing history to CSV format.",
          category: "billing",
          priority: "high",
          status: "in_progress",
          submittedBy: "Various Users",
          votes: 8,
          created_at: new Date().toISOString()
        }
      ];

      // Mock data for mobile optimization
      const mockMobileOptimization: MobileOptimization = {
        mobileUsers: 67,
        performanceScore: 89,
        appDownloads: 1247,
        deviceBreakdown: [
          { type: "mobile", name: "iPhone", percentage: 35, users: 156 },
          { type: "mobile", name: "Android", percentage: 32, users: 142 },
          { type: "tablet", name: "iPad", percentage: 15, users: 67 },
          { type: "desktop", name: "Desktop", percentage: 18, users: 80 }
        ]
      };

      // Mock data for self-service tools
      const mockSelfServiceTools: SelfServiceTool[] = [
        {
          name: "Account Management",
          description: "Manage profile, settings, and preferences",
          type: "settings",
          usageRate: 89,
          satisfaction: 4.5,
          features: ["Profile updates", "Password reset", "Notification settings"]
        },
        {
          name: "Billing Dashboard",
          description: "View invoices, payment history, and manage billing",
          type: "billing",
          usageRate: 76,
          satisfaction: 4.2,
          features: ["Invoice downloads", "Payment methods", "Billing history"]
        },
        {
          name: "Analytics Reports",
          description: "Generate and download detailed reports",
          type: "reports",
          usageRate: 64,
          satisfaction: 4.0,
          features: ["Custom reports", "Data exports", "Scheduled reports"]
        },
        {
          name: "Support Center",
          description: "Access help articles and submit tickets",
          type: "support",
          usageRate: 52,
          satisfaction: 3.8,
          features: ["Knowledge base", "Ticket submission", "Live chat"]
        }
      ];

      // Mock analytics data
      const mockAnalytics: Analytics = {
        userEngagement: 84,
        featureAdoptionRate: 78,
        supportTicketReduction: 35,
        satisfactionImprovement: 23
      };

      setUsageMetrics(mockUsageMetrics);
      setRecommendations(mockRecommendations);
      setFeedbackRequests(mockFeedbackRequests);
      setMobileOptimization(mockMobileOptimization);
      setSelfServiceTools(mockSelfServiceTools);
      setAnalytics(mockAnalytics);

    } catch (error: any) {
      console.error("Error fetching enhanced experience data:", error);
      toast({
        title: "Error",
        description: "Failed to load enhanced experience data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRecommendation = async (recommendationData: any) => {
    try {
      const newRecommendation: Recommendation = {
        id: Date.now().toString(),
        merchantId: recommendationData.merchantId || "",
        merchantName: "Merchant Name", // Would be fetched from database
        type: recommendationData.type || "plan_upgrade",
        title: recommendationData.title || "",
        description: recommendationData.description || "",
        priority: recommendationData.priority || "medium",
        expectedImpact: recommendationData.expectedImpact || "",
        actionRequired: recommendationData.actionRequired || "",
        status: "new",
        created_at: new Date().toISOString()
      };

      setRecommendations(prev => [newRecommendation, ...prev]);
      
      toast({
        title: "Success",
        description: "Recommendation created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create recommendation",
        variant: "destructive",
      });
    }
  };

  const updateMobileConfig = async (configData: any) => {
    try {
      // Update mobile configuration
      toast({
        title: "Success",
        description: "Mobile configuration updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update mobile configuration",
        variant: "destructive",
      });
    }
  };

  const createFeedbackRequest = async (feedbackData: any) => {
    try {
      const newFeedback: FeedbackRequest = {
        id: Date.now().toString(),
        type: feedbackData.type || "feature_request",
        title: feedbackData.title || "",
        description: feedbackData.description || "",
        category: feedbackData.category || "general",
        priority: feedbackData.priority || "medium",
        status: "new",
        submittedBy: "Admin Request",
        votes: 0,
        created_at: new Date().toISOString()
      };

      setFeedbackRequests(prev => [newFeedback, ...prev]);
      
      toast({
        title: "Success",
        description: "Feedback request created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create feedback request",
        variant: "destructive",
      });
    }
  };

  const generateUsageReport = async (parameters: any) => {
    try {
      // Generate and download usage report
      toast({
        title: "Success",
        description: "Usage report generated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate usage report",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchEnhancedExperienceData();
  }, []);

  return {
    usageMetrics,
    recommendations,
    feedbackRequests,
    mobileOptimization,
    selfServiceTools,
    analytics,
    loading,
    createRecommendation,
    updateMobileConfig,
    createFeedbackRequest,
    generateUsageReport,
  };
};