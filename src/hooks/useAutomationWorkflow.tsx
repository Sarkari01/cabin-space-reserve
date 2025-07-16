import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Automation {
  id: string;
  name: string;
  type: 'subscription_lifecycle' | 'payment_retry' | 'usage_based' | 'renewal_reminder';
  trigger: string;
  conditions: string;
  actions: string;
  enabled: boolean;
  schedule: string;
  execution_count: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: string;
  trigger_type: 'manual' | 'scheduled' | 'event_based';
  target_audience: string;
  enabled: boolean;
  completion_count: number;
  created_at: string;
  updated_at: string;
}

interface CustomerSuccessMetrics {
  healthyMerchants: number;
  atRiskMerchants: number;
  averageHealthScore: number;
  interventionCount: number;
  healthScores: {
    merchantName: string;
    score: number;
    lastActivity: string;
    riskFactors: string[];
  }[];
}

interface AutomationAnalytics {
  totalExecutions: number;
  successRate: number;
  costSavings: number;
  timesSaved: number;
  performanceMetrics: {
    automationType: string;
    executions: number;
    successRate: number;
  }[];
}

export const useAutomationWorkflow = () => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [customerSuccess, setCustomerSuccess] = useState<CustomerSuccessMetrics>({
    healthyMerchants: 0,
    atRiskMerchants: 0,
    averageHealthScore: 0,
    interventionCount: 0,
    healthScores: [],
  });
  const [analytics, setAnalytics] = useState<AutomationAnalytics>({
    totalExecutions: 0,
    successRate: 0,
    costSavings: 0,
    timesSaved: 0,
    performanceMetrics: [],
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAutomationData = async () => {
    try {
      setLoading(true);
      
      // Mock data for automations
      const mockAutomations: Automation[] = [
        {
          id: "1",
          name: "Payment Failure Recovery",
          type: "payment_retry",
          trigger: "payment_failed",
          conditions: JSON.stringify({ payment_attempts: { gt: 2 } }),
          actions: JSON.stringify([
            { type: "send_email", template: "payment_failed" },
            { type: "retry_payment", delay: "24h" },
            { type: "suspend_account", delay: "7d" }
          ]),
          enabled: true,
          schedule: "immediate",
          execution_count: 45,
          success_rate: 94,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "2",
          name: "Subscription Renewal Reminder",
          type: "renewal_reminder",
          trigger: "subscription_expiring",
          conditions: JSON.stringify({ days_until_expiry: { lte: 7 } }),
          actions: JSON.stringify([
            { type: "send_email", template: "renewal_reminder" },
            { type: "create_notification", priority: "high" }
          ]),
          enabled: true,
          schedule: "daily",
          execution_count: 128,
          success_rate: 78,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "3",
          name: "Usage-Based Upgrade",
          type: "usage_based",
          trigger: "usage_threshold_reached",
          conditions: JSON.stringify({ usage_percentage: { gte: 90 } }),
          actions: JSON.stringify([
            { type: "send_upgrade_suggestion", template: "usage_upgrade" },
            { type: "create_sales_lead", priority: "high" }
          ]),
          enabled: true,
          schedule: "immediate",
          execution_count: 23,
          success_rate: 89,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock data for workflows
      const mockWorkflows: Workflow[] = [
        {
          id: "1",
          name: "New Merchant Onboarding",
          description: "Complete onboarding process for new merchants",
          steps: JSON.stringify([
            { step: "welcome_email", delay: "0h" },
            { step: "verification_reminder", delay: "24h" },
            { step: "setup_assistance", delay: "72h" },
            { step: "first_week_checkin", delay: "7d" }
          ]),
          trigger_type: "event_based",
          target_audience: "new_merchants",
          enabled: true,
          completion_count: 67,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "2",
          name: "Inactive Merchant Re-engagement",
          description: "Re-engage merchants with low activity",
          steps: JSON.stringify([
            { step: "activity_check", delay: "0h" },
            { step: "personalized_email", delay: "1h" },
            { step: "phone_call_scheduling", delay: "48h" },
            { step: "success_stories_share", delay: "7d" }
          ]),
          trigger_type: "scheduled",
          target_audience: "inactive_merchants",
          enabled: true,
          completion_count: 34,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "3",
          name: "Churn Prevention",
          description: "Prevent merchant churn through targeted interventions",
          steps: JSON.stringify([
            { step: "churn_risk_assessment", delay: "0h" },
            { step: "retention_offer", delay: "2h" },
            { step: "success_manager_assignment", delay: "24h" },
            { step: "feedback_collection", delay: "7d" }
          ]),
          trigger_type: "event_based",
          target_audience: "at_risk_merchants",
          enabled: true,
          completion_count: 12,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock customer success data
      const mockCustomerSuccess: CustomerSuccessMetrics = {
        healthyMerchants: 145,
        atRiskMerchants: 23,
        averageHealthScore: 78,
        interventionCount: 15,
        healthScores: [
          {
            merchantName: "TechCorp Solutions",
            score: 92,
            lastActivity: "2 hours ago",
            riskFactors: []
          },
          {
            merchantName: "StartupHub",
            score: 45,
            lastActivity: "5 days ago",
            riskFactors: ["Low usage", "Payment issues", "No recent logins"]
          },
          {
            merchantName: "GrowthCo",
            score: 67,
            lastActivity: "1 day ago",
            riskFactors: ["Declining usage"]
          },
          {
            merchantName: "InnovateLab",
            score: 88,
            lastActivity: "30 minutes ago",
            riskFactors: []
          },
          {
            merchantName: "BusinessPro",
            score: 34,
            lastActivity: "1 week ago",
            riskFactors: ["Payment failed", "No recent activity", "Support tickets"]
          }
        ]
      };

      // Mock analytics data
      const mockAnalytics: AutomationAnalytics = {
        totalExecutions: 1247,
        successRate: 87,
        costSavings: 89000,
        timesSaved: 156,
        performanceMetrics: [
          {
            automationType: "Payment Recovery",
            executions: 45,
            successRate: 94
          },
          {
            automationType: "Renewal Reminders",
            executions: 128,
            successRate: 78
          },
          {
            automationType: "Usage Alerts",
            executions: 23,
            successRate: 89
          }
        ]
      };

      setAutomations(mockAutomations);
      setWorkflows(mockWorkflows);
      setCustomerSuccess(mockCustomerSuccess);
      setAnalytics(mockAnalytics);

    } catch (error: any) {
      console.error("Error fetching automation data:", error);
      toast({
        title: "Error",
        description: "Failed to load automation data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAutomation = async (automationData: Partial<Automation>) => {
    try {
      const newAutomation: Automation = {
        id: Date.now().toString(),
        name: automationData.name || "",
        type: automationData.type || "subscription_lifecycle",
        trigger: automationData.trigger || "",
        conditions: automationData.conditions || "{}",
        actions: automationData.actions || "[]",
        enabled: automationData.enabled ?? true,
        schedule: automationData.schedule || "immediate",
        execution_count: 0,
        success_rate: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setAutomations(prev => [newAutomation, ...prev]);
      
      toast({
        title: "Success",
        description: "Automation created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create automation",
        variant: "destructive",
      });
    }
  };

  const updateAutomation = async (automationId: string, updates: Partial<Automation>) => {
    try {
      setAutomations(prev => 
        prev.map(automation => 
          automation.id === automationId 
            ? { ...automation, ...updates, updated_at: new Date().toISOString() }
            : automation
        )
      );
      
      toast({
        title: "Success",
        description: "Automation updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update automation",
        variant: "destructive",
      });
    }
  };

  const deleteAutomation = async (automationId: string) => {
    try {
      setAutomations(prev => prev.filter(automation => automation.id !== automationId));
      
      toast({
        title: "Success",
        description: "Automation deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete automation",
        variant: "destructive",
      });
    }
  };

  const executeWorkflow = async (workflowData: any) => {
    try {
      const newWorkflow: Workflow = {
        id: Date.now().toString(),
        name: workflowData.name || "",
        description: workflowData.description || "",
        steps: workflowData.steps || "[]",
        trigger_type: workflowData.trigger_type || "manual",
        target_audience: workflowData.target_audience || "all_merchants",
        enabled: workflowData.enabled ?? true,
        completion_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setWorkflows(prev => [newWorkflow, ...prev]);
      
      toast({
        title: "Success",
        description: "Workflow executed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to execute workflow",
        variant: "destructive",
      });
    }
  };

  const getCustomerHealthScore = async (merchantId: string) => {
    // Mock implementation for getting individual customer health score
    try {
      const healthScore = Math.floor(Math.random() * 100);
      return {
        score: healthScore,
        factors: healthScore < 60 ? ["Low usage", "Payment issues"] : ["Active usage"],
        recommendations: healthScore < 60 ? ["Contact merchant", "Offer support"] : ["Continue monitoring"]
      };
    } catch (error: any) {
      console.error("Error getting customer health score:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchAutomationData();
  }, []);

  return {
    automations,
    workflows,
    customerSuccess,
    analytics,
    loading,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    executeWorkflow,
    getCustomerHealthScore,
  };
};