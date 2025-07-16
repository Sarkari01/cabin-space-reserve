import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Zap, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Users,
  Bell,
  Filter,
  Search,
  Calendar,
  Activity,
  Target,
  Workflow
} from "lucide-react";
import { useAutomationWorkflow } from "@/hooks/useAutomationWorkflow";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export const AutomationWorkflowTab = () => {
  const { 
    automations, 
    workflows, 
    customerSuccess,
    analytics,
    loading,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    executeWorkflow,
    getCustomerHealthScore
  } = useAutomationWorkflow();
  
  const [newAutomationModalOpen, setNewAutomationModalOpen] = useState(false);
  const [newWorkflowModalOpen, setNewWorkflowModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Form states
  const [automationForm, setAutomationForm] = useState({
    name: "",
    type: "subscription_lifecycle" as "subscription_lifecycle" | "payment_retry" | "usage_based" | "renewal_reminder",
    trigger: "payment_failed",
    conditions: "",
    actions: "",
    enabled: true,
    schedule: "immediate"
  });
  
  const [workflowForm, setWorkflowForm] = useState({
    name: "",
    description: "",
    steps: "",
    trigger_type: "manual" as "manual" | "scheduled" | "event_based",
    target_audience: "all_merchants",
    enabled: true
  });

  const handleCreateAutomation = async () => {
    try {
      await createAutomation(automationForm);
      setNewAutomationModalOpen(false);
      setAutomationForm({
        name: "",
        type: "subscription_lifecycle",
        trigger: "payment_failed",
        conditions: "",
        actions: "",
        enabled: true,
        schedule: "immediate"
      });
    } catch (error) {
      console.error("Error creating automation:", error);
    }
  };

  const handleCreateWorkflow = async () => {
    try {
      await executeWorkflow(workflowForm);
      setNewWorkflowModalOpen(false);
      setWorkflowForm({
        name: "",
        description: "",
        steps: "",
        trigger_type: "manual",
        target_audience: "all_merchants",
        enabled: true
      });
    } catch (error) {
      console.error("Error creating workflow:", error);
    }
  };

  const filteredAutomations = automations.filter(automation => {
    const matchesSearch = automation.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || 
      (filterStatus === "active" && automation.enabled) ||
      (filterStatus === "inactive" && !automation.enabled);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Automation & Workflows</h2>
          <p className="text-muted-foreground">Automate subscription management and customer success processes</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={newAutomationModalOpen} onOpenChange={setNewAutomationModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Zap className="mr-2 h-4 w-4" />
                New Automation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Automation</DialogTitle>
                <DialogDescription>Set up automated processes for subscription management</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="automation-name">Name</Label>
                  <Input
                    id="automation-name"
                    value={automationForm.name}
                    onChange={(e) => setAutomationForm({ ...automationForm, name: e.target.value })}
                    placeholder="Payment Failure Recovery"
                  />
                </div>
                
                <div>
                  <Label htmlFor="automation-type">Type</Label>
                  <Select value={automationForm.type} onValueChange={(value: "subscription_lifecycle" | "payment_retry" | "usage_based" | "renewal_reminder") => setAutomationForm({ ...automationForm, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subscription_lifecycle">Subscription Lifecycle</SelectItem>
                      <SelectItem value="payment_retry">Payment Retry</SelectItem>
                      <SelectItem value="usage_based">Usage Based</SelectItem>
                      <SelectItem value="renewal_reminder">Renewal Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="automation-trigger">Trigger</Label>
                  <Input
                    id="automation-trigger"
                    value={automationForm.trigger}
                    onChange={(e) => setAutomationForm({ ...automationForm, trigger: e.target.value })}
                    placeholder="payment_failed, subscription_expiring, etc."
                  />
                </div>
                
                <div>
                  <Label htmlFor="automation-conditions">Conditions (JSON)</Label>
                  <Textarea
                    id="automation-conditions"
                    value={automationForm.conditions}
                    onChange={(e) => setAutomationForm({ ...automationForm, conditions: e.target.value })}
                    placeholder='{"payment_attempts": {"gt": 2}, "subscription_status": "active"}'
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="automation-actions">Actions (JSON)</Label>
                  <Textarea
                    id="automation-actions"
                    value={automationForm.actions}
                    onChange={(e) => setAutomationForm({ ...automationForm, actions: e.target.value })}
                    placeholder='[{"type": "send_email", "template": "payment_failed"}, {"type": "suspend_account", "delay": "7d"}]'
                    rows={4}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={automationForm.enabled}
                    onCheckedChange={(checked) => setAutomationForm({ ...automationForm, enabled: checked })}
                  />
                  <Label>Enable automation</Label>
                </div>
                
                <Button onClick={handleCreateAutomation} className="w-full">
                  Create Automation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={newWorkflowModalOpen} onOpenChange={setNewWorkflowModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Workflow className="mr-2 h-4 w-4" />
                New Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Workflow</DialogTitle>
                <DialogDescription>Design custom workflows for merchant management</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="workflow-name">Name</Label>
                  <Input
                    id="workflow-name"
                    value={workflowForm.name}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                    placeholder="Onboarding Workflow"
                  />
                </div>
                
                <div>
                  <Label htmlFor="workflow-description">Description</Label>
                  <Textarea
                    id="workflow-description"
                    value={workflowForm.description}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
                    placeholder="Automated onboarding process for new merchants"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="workflow-steps">Steps (JSON)</Label>
                  <Textarea
                    id="workflow-steps"
                    value={workflowForm.steps}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, steps: e.target.value })}
                    placeholder='[{"step": "welcome_email", "delay": "0h"}, {"step": "verification_reminder", "delay": "24h"}]'
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="workflow-trigger">Trigger Type</Label>
                  <Select value={workflowForm.trigger_type} onValueChange={(value: "manual" | "scheduled" | "event_based") => setWorkflowForm({ ...workflowForm, trigger_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="event_based">Event Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleCreateWorkflow} className="w-full">
                  Create Workflow
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="automations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="customer-success">Customer Success</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="automations" className="space-y-4">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search automations..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredAutomations.map((automation) => (
              <Card key={automation.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{automation.name}</CardTitle>
                        <CardDescription>{automation.type.replace('_', ' ').toUpperCase()}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={automation.enabled ? "default" : "secondary"}>
                        {automation.enabled ? "Active" : "Inactive"}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateAutomation(automation.id, { enabled: !automation.enabled })}
                        >
                          {automation.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteAutomation(automation.id)}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Trigger</p>
                      <p>{automation.trigger}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Executions</p>
                      <p>{automation.execution_count}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Success Rate</p>
                      <p>{automation.success_rate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <Workflow className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <CardDescription>{workflow.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={workflow.enabled ? "default" : "secondary"}>
                        {workflow.enabled ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => executeWorkflow(workflow)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Execute
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Type</p>
                      <p>{workflow.trigger_type}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Target</p>
                      <p>{workflow.target_audience}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Completions</p>
                      <p>{workflow.completion_count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="customer-success" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Healthy Merchants</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customerSuccess.healthyMerchants}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customerSuccess.atRiskMerchants}</div>
                <p className="text-xs text-muted-foreground">-8% from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customerSuccess.averageHealthScore}</div>
                <Progress value={customerSuccess.averageHealthScore} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interventions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customerSuccess.interventionCount}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Customer Health Monitoring</CardTitle>
              <CardDescription>Real-time health scores and intervention triggers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerSuccess.healthScores.map((score, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        score.score >= 80 ? 'bg-green-500' :
                        score.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium">{score.merchantName}</p>
                        <p className="text-sm text-muted-foreground">{score.lastActivity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{score.score}/100</p>
                        <p className="text-xs text-muted-foreground">Health Score</p>
                      </div>
                      {score.score < 60 && (
                        <Button size="sm" variant="outline">
                          <Bell className="h-4 w-4 mr-2" />
                          Intervene
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Automation Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Payment Recovery</span>
                    <span className="text-sm font-medium">94% success</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Renewal Reminders</span>
                    <span className="text-sm font-medium">78% success</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Usage Alerts</span>
                    <span className="text-sm font-medium">89% success</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Workflow Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Completion Time</span>
                    <span className="text-sm font-medium">2.3 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Manual Interventions</span>
                    <span className="text-sm font-medium">5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Hours Saved/Month</span>
                    <span className="text-sm font-medium">156 hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cost Reduction</span>
                    <span className="text-sm font-medium">₹89,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">ROI</span>
                    <span className="text-sm font-medium">340%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};