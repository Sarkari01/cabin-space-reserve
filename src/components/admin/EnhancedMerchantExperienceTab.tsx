import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Star,
  TrendingUp,
  MessageSquare,
  Settings,
  Download,
  Bell,
  Users,
  BarChart,
  Search,
  Filter,
  Calendar,
  FileText,
  CreditCard,
  HelpCircle,
  Lightbulb,
  Target,
  Zap
} from "lucide-react";
import { useEnhancedMerchantExperience } from "@/hooks/useEnhancedMerchantExperience";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export const EnhancedMerchantExperienceTab = () => {
  const { 
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
    generateUsageReport
  } = useEnhancedMerchantExperience();
  
  const [newRecommendationModalOpen, setNewRecommendationModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  // Form states
  const [recommendationForm, setRecommendationForm] = useState({
    merchantId: "",
    type: "plan_upgrade" as "plan_upgrade" | "feature_adoption" | "usage_optimization" | "cost_savings",
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    expectedImpact: "",
    actionRequired: ""
  });
  
  const [feedbackForm, setFeedbackForm] = useState({
    type: "feature_request" as "feature_request" | "bug_report" | "improvement" | "general",
    title: "",
    description: "",
    category: "subscription",
    priority: "medium" as "low" | "medium" | "high"
  });

  const handleCreateRecommendation = async () => {
    try {
      await createRecommendation(recommendationForm);
      setNewRecommendationModalOpen(false);
      setRecommendationForm({
        merchantId: "",
        type: "plan_upgrade",
        title: "",
        description: "",
        priority: "medium",
        expectedImpact: "",
        actionRequired: ""
      });
    } catch (error) {
      console.error("Error creating recommendation:", error);
    }
  };

  const handleCreateFeedbackRequest = async () => {
    try {
      await createFeedbackRequest(feedbackForm);
      setFeedbackModalOpen(false);
      setFeedbackForm({
        type: "feature_request",
        title: "",
        description: "",
        category: "subscription",
        priority: "medium"
      });
    } catch (error) {
      console.error("Error creating feedback request:", error);
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    const matchesSearch = rec.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || rec.type === filterType;
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
          <h2 className="text-3xl font-bold tracking-tight">Enhanced Merchant Experience</h2>
          <p className="text-muted-foreground">Improve merchant interface and provide intelligent recommendations</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={newRecommendationModalOpen} onOpenChange={setNewRecommendationModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Lightbulb className="mr-2 h-4 w-4" />
                New Recommendation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Merchant Recommendation</DialogTitle>
                <DialogDescription>Generate personalized recommendations for merchants</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="merchant-id">Merchant ID</Label>
                  <Input
                    id="merchant-id"
                    value={recommendationForm.merchantId}
                    onChange={(e) => setRecommendationForm({ ...recommendationForm, merchantId: e.target.value })}
                    placeholder="Enter merchant ID"
                  />
                </div>
                
                <div>
                  <Label htmlFor="recommendation-type">Type</Label>
                  <Select value={recommendationForm.type} onValueChange={(value: "plan_upgrade" | "feature_adoption" | "usage_optimization" | "cost_savings") => setRecommendationForm({ ...recommendationForm, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plan_upgrade">Plan Upgrade</SelectItem>
                      <SelectItem value="feature_adoption">Feature Adoption</SelectItem>
                      <SelectItem value="usage_optimization">Usage Optimization</SelectItem>
                      <SelectItem value="cost_savings">Cost Savings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="recommendation-title">Title</Label>
                  <Input
                    id="recommendation-title"
                    value={recommendationForm.title}
                    onChange={(e) => setRecommendationForm({ ...recommendationForm, title: e.target.value })}
                    placeholder="Upgrade to Premium Plan"
                  />
                </div>
                
                <div>
                  <Label htmlFor="recommendation-description">Description</Label>
                  <Textarea
                    id="recommendation-description"
                    value={recommendationForm.description}
                    onChange={(e) => setRecommendationForm({ ...recommendationForm, description: e.target.value })}
                    placeholder="Based on your usage patterns, upgrading to Premium would provide better value..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="recommendation-priority">Priority</Label>
                  <Select value={recommendationForm.priority} onValueChange={(value: "low" | "medium" | "high") => setRecommendationForm({ ...recommendationForm, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="expected-impact">Expected Impact</Label>
                  <Input
                    id="expected-impact"
                    value={recommendationForm.expectedImpact}
                    onChange={(e) => setRecommendationForm({ ...recommendationForm, expectedImpact: e.target.value })}
                    placeholder="30% cost savings, Better features"
                  />
                </div>
                
                <Button onClick={handleCreateRecommendation} className="w-full">
                  Create Recommendation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Feedback Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Feedback Request</DialogTitle>
                <DialogDescription>Collect merchant feedback for improvements</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="feedback-type">Type</Label>
                  <Select value={feedbackForm.type} onValueChange={(value: "feature_request" | "bug_report" | "improvement" | "general") => setFeedbackForm({ ...feedbackForm, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                      <SelectItem value="bug_report">Bug Report</SelectItem>
                      <SelectItem value="improvement">Improvement</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="feedback-title">Title</Label>
                  <Input
                    id="feedback-title"
                    value={feedbackForm.title}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, title: e.target.value })}
                    placeholder="Mobile app improvement feedback"
                  />
                </div>
                
                <div>
                  <Label htmlFor="feedback-description">Description</Label>
                  <Textarea
                    id="feedback-description"
                    value={feedbackForm.description}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, description: e.target.value })}
                    placeholder="Describe the feedback request..."
                    rows={3}
                  />
                </div>
                
                <Button onClick={handleCreateFeedbackRequest} className="w-full">
                  Create Feedback Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Usage Dashboard</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="mobile">Mobile Optimization</TabsTrigger>
          <TabsTrigger value="self-service">Self-Service Tools</TabsTrigger>
          <TabsTrigger value="feedback">Feedback & Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageMetrics.activeSessions}</div>
                <p className="text-xs text-muted-foreground">+5% from yesterday</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Feature Adoption</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageMetrics.featureAdoption}%</div>
                <Progress value={usageMetrics.featureAdoption} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageMetrics.supportTickets}</div>
                <p className="text-xs text-muted-foreground">-12% this week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageMetrics.satisfactionScore}/5</div>
                <p className="text-xs text-muted-foreground">+0.2 from last month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Feature Usage Analytics</CardTitle>
                <CardDescription>Most and least used features by merchants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usageMetrics.featureUsage.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          feature.usage >= 80 ? 'bg-green-500' :
                          feature.usage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium">{feature.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-secondary rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              feature.usage >= 80 ? 'bg-green-500' :
                              feature.usage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${feature.usage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{feature.usage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Journey Analytics</CardTitle>
                <CardDescription>Common paths and bottlenecks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usageMetrics.userJourney.map((step, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{step.step}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{step.completionRate}%</p>
                        <p className="text-xs text-muted-foreground">completion</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recommendations..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="plan_upgrade">Plan Upgrade</SelectItem>
                <SelectItem value="feature_adoption">Feature Adoption</SelectItem>
                <SelectItem value="usage_optimization">Usage Optimization</SelectItem>
                <SelectItem value="cost_savings">Cost Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredRecommendations.map((recommendation) => (
              <Card key={recommendation.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                        <CardDescription>For: {recommendation.merchantName}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        recommendation.priority === "high" ? "destructive" :
                        recommendation.priority === "medium" ? "default" : "secondary"
                      }>
                        {recommendation.priority}
                      </Badge>
                      <Badge variant="outline">{recommendation.type.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm">{recommendation.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground">Expected Impact</p>
                        <p>{recommendation.expectedImpact}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Status</p>
                        <p>{recommendation.status}</p>
                      </div>
                    </div>
                    {recommendation.actionRequired && (
                      <div className="mt-3">
                        <p className="font-medium text-muted-foreground mb-1">Action Required</p>
                        <p className="text-sm">{recommendation.actionRequired}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mobile" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mobile Users</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mobileOptimization.mobileUsers}%</div>
                <p className="text-xs text-muted-foreground">of total users</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mobile Performance</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mobileOptimization.performanceScore}/100</div>
                <Progress value={mobileOptimization.performanceScore} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">App Downloads</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mobileOptimization.appDownloads}</div>
                <p className="text-xs text-muted-foreground">this month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
              <CardDescription>Usage statistics by device type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mobileOptimization.deviceBreakdown.map((device, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {device.type === "mobile" && <Smartphone className="h-5 w-5 text-primary" />}
                      {device.type === "tablet" && <Tablet className="h-5 w-5 text-secondary" />}
                      {device.type === "desktop" && <Monitor className="h-5 w-5 text-accent" />}
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-sm text-muted-foreground">{device.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{device.percentage}%</p>
                      <p className="text-xs text-muted-foreground">{device.users} users</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="self-service" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selfServiceTools.map((tool, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {tool.type === "billing" && <CreditCard className="h-5 w-5 text-primary" />}
                      {tool.type === "reports" && <FileText className="h-5 w-5 text-primary" />}
                      {tool.type === "settings" && <Settings className="h-5 w-5 text-primary" />}
                      {tool.type === "support" && <HelpCircle className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <CardDescription>{tool.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Usage Rate</span>
                      <span className="font-medium">{tool.usageRate}%</span>
                    </div>
                    <Progress value={tool.usageRate} />
                    <div className="flex justify-between text-sm">
                      <span>User Satisfaction</span>
                      <span className="font-medium">{tool.satisfaction}/5</span>
                    </div>
                    <Button className="w-full" variant="outline">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <div className="grid gap-4">
            {feedbackRequests.map((feedback) => (
              <Card key={feedback.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{feedback.title}</CardTitle>
                        <CardDescription>By: {feedback.submittedBy}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        feedback.priority === "high" ? "destructive" :
                        feedback.priority === "medium" ? "default" : "secondary"
                      }>
                        {feedback.priority}
                      </Badge>
                      <Badge variant="outline">{feedback.type.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm">{feedback.description}</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground">Category</p>
                        <p>{feedback.category}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Status</p>
                        <p>{feedback.status}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Votes</p>
                        <p>{feedback.votes} votes</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};