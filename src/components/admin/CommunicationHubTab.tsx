import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  Mail, 
  Bell, 
  Users, 
  Send,
  Plus,
  Eye,
  Edit,
  Trash,
  Filter,
  Search,
  Megaphone,
  Target,
  Calendar,
  BarChart
} from "lucide-react";
import { useCommunicationHub } from "@/hooks/useCommunicationHub";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const CommunicationHubTab = () => {
  const { 
    campaigns, 
    messages, 
    templates, 
    analytics,
    loading,
    createCampaign,
    sendMessage,
    createTemplate,
    deleteTemplate,
    getCampaignAnalytics
  } = useCommunicationHub();
  
  const [newCampaignModalOpen, setNewCampaignModalOpen] = useState(false);
  const [newMessageModalOpen, setNewMessageModalOpen] = useState(false);
  const [newTemplateModalOpen, setNewTemplateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  // Form states
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    type: "email" as "email" | "sms" | "push" | "in_app",
    target_audience: "all_merchants",
    subject: "",
    content: "",
    schedule_date: "",
    is_immediate: true,
    template_id: ""
  });
  
  const [messageForm, setMessageForm] = useState({
    recipient_type: "individual",
    recipient_id: "",
    subject: "",
    content: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
    type: "email" as "email" | "sms" | "in_app"
  });
  
  const [templateForm, setTemplateForm] = useState({
    name: "",
    type: "email" as "email" | "sms" | "push",
    category: "general",
    subject: "",
    content: "",
    variables: ""
  });

  const handleCreateCampaign = async () => {
    try {
      await createCampaign(campaignForm);
      setNewCampaignModalOpen(false);
      setCampaignForm({
        name: "",
        type: "email",
        target_audience: "all_merchants",
        subject: "",
        content: "",
        schedule_date: "",
        is_immediate: true,
        template_id: ""
      });
    } catch (error) {
      console.error("Error creating campaign:", error);
    }
  };

  const handleSendMessage = async () => {
    try {
      await sendMessage(messageForm);
      setNewMessageModalOpen(false);
      setMessageForm({
        recipient_type: "individual",
        recipient_id: "",
        subject: "",
        content: "",
        priority: "normal",
        type: "email"
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      await createTemplate({
        ...templateForm,
        variables: templateForm.variables.split(",").map(v => v.trim()).filter(v => v)
      });
      setNewTemplateModalOpen(false);
      setTemplateForm({
        name: "",
        type: "email",
        category: "general",
        subject: "",
        content: "",
        variables: ""
      });
    } catch (error) {
      console.error("Error creating template:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Communication Hub</h3>
          <p className="text-muted-foreground">
            Manage campaigns, messages, and merchant communications
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setNewMessageModalOpen(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Send Message
          </Button>
          <Button onClick={() => setNewCampaignModalOpen(true)}>
            <Megaphone className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Communication Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Mail className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMessagesSent}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.messagesThisWeek} this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.openRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.openRateTrend > 0 ? '+' : ''}{analytics.openRateTrend}% vs last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.responseRate}%</div>
            <p className="text-xs text-muted-foreground">Merchant responses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {/* Campaigns Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Megaphone className="h-5 w-5" />
                <span>Email Campaigns</span>
              </CardTitle>
              <CardDescription>
                Manage bulk communication campaigns to merchants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold">{campaign.name}</h4>
                        <Badge variant={campaign.status === 'sent' ? 'default' : 
                                       campaign.status === 'scheduled' ? 'secondary' : 'outline'}>
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline">{campaign.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {campaign.subject}
                      </p>
                      <div className="flex space-x-4 text-sm text-muted-foreground mt-2">
                        <span>Recipients: {campaign.recipients_count}</span>
                        <span>Sent: {campaign.sent_count}</span>
                        <span>Opened: {campaign.opened_count}</span>
                        <span>Rate: {campaign.open_rate}%</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <BarChart className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          {/* Individual Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Individual Messages</span>
              </CardTitle>
              <CardDescription>
                Direct communication with specific merchants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold">{message.subject}</h4>
                        <Badge variant={message.status === 'sent' ? 'default' : 
                                       message.status === 'delivered' ? 'secondary' : 'outline'}>
                          {message.status}
                        </Badge>
                        <Badge variant="outline">{message.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        To: {message.recipient_name} ({message.recipient_email})
                      </p>
                      <div className="text-sm text-muted-foreground mt-2">
                        Sent: {new Date(message.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {/* Message Templates */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Message Templates</span>
                  </CardTitle>
                  <CardDescription>
                    Reusable templates for common communications
                  </CardDescription>
                </div>
                <Button onClick={() => setNewTemplateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold">{template.name}</h4>
                        <Badge variant="outline">{template.category}</Badge>
                        <Badge variant="outline">{template.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.subject}
                      </p>
                      <div className="text-sm text-muted-foreground mt-2">
                        Used: {template.usage_count} times
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Communication Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Communication Performance</CardTitle>
              <CardDescription>
                Detailed analytics on communication effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Campaign Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Email Open Rate</span>
                      <span className="text-sm font-medium">68%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Click Through Rate</span>
                      <span className="text-sm font-medium">24%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Response Rate</span>
                      <span className="text-sm font-medium">12%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Best Performing Content</h4>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <div className="font-medium">Plan Upgrade Reminders</div>
                      <div className="text-muted-foreground">85% open rate</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Feature Announcements</div>
                      <div className="text-muted-foreground">72% open rate</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Payment Reminders</div>
                      <div className="text-muted-foreground">91% open rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Campaign Modal */}
      <Dialog open={newCampaignModalOpen} onOpenChange={setNewCampaignModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Set up a bulk communication campaign for merchants
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                placeholder="e.g., Monthly Newsletter, Feature Update"
              />
            </div>
            
            <div>
              <Label htmlFor="campaign-type">Type</Label>
              <Select value={campaignForm.type} onValueChange={(value: "email" | "sms" | "push" | "in_app") => setCampaignForm({ ...campaignForm, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push Notification</SelectItem>
                  <SelectItem value="in_app">In-App Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="target-audience">Target Audience</Label>
              <Select value={campaignForm.target_audience} onValueChange={(value) => setCampaignForm({ ...campaignForm, target_audience: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_merchants">All Merchants</SelectItem>
                  <SelectItem value="active_subscribers">Active Subscribers</SelectItem>
                  <SelectItem value="trial_users">Trial Users</SelectItem>
                  <SelectItem value="churned_users">Churned Users</SelectItem>
                  <SelectItem value="new_signups">New Signups</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="campaign-subject">Subject</Label>
              <Input
                id="campaign-subject"
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                placeholder="Email subject line"
              />
            </div>
            
            <div>
              <Label htmlFor="campaign-content">Content</Label>
              <Textarea
                id="campaign-content"
                value={campaignForm.content}
                onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                placeholder="Campaign content..."
                rows={4}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="immediate-send"
                checked={campaignForm.is_immediate}
                onCheckedChange={(checked) => setCampaignForm({ ...campaignForm, is_immediate: checked })}
              />
              <Label htmlFor="immediate-send">Send immediately</Label>
            </div>
            
            {!campaignForm.is_immediate && (
              <div>
                <Label htmlFor="schedule-date">Schedule Date</Label>
                <Input
                  id="schedule-date"
                  type="datetime-local"
                  value={campaignForm.schedule_date}
                  onChange={(e) => setCampaignForm({ ...campaignForm, schedule_date: e.target.value })}
                />
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setNewCampaignModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCampaign}>
                Create Campaign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Message Modal */}
      <Dialog open={newMessageModalOpen} onOpenChange={setNewMessageModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Individual Message</DialogTitle>
            <DialogDescription>
              Send a direct message to a specific merchant
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient-type">Recipient Type</Label>
              <Select value={messageForm.recipient_type} onValueChange={(value) => setMessageForm({ ...messageForm, recipient_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual Merchant</SelectItem>
                  <SelectItem value="group">Merchant Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="recipient">Recipient</Label>
              <Input
                id="recipient"
                value={messageForm.recipient_id}
                onChange={(e) => setMessageForm({ ...messageForm, recipient_id: e.target.value })}
                placeholder="Enter merchant email or ID"
              />
            </div>
            
            <div>
              <Label htmlFor="message-subject">Subject</Label>
              <Input
                id="message-subject"
                value={messageForm.subject}
                onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                placeholder="Message subject"
              />
            </div>
            
            <div>
              <Label htmlFor="message-content">Message</Label>
              <Textarea
                id="message-content"
                value={messageForm.content}
                onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                placeholder="Type your message..."
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={messageForm.priority} onValueChange={(value: "low" | "normal" | "high" | "urgent") => setMessageForm({ ...messageForm, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setNewMessageModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage}>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Template Modal */}
      <Dialog open={newTemplateModalOpen} onOpenChange={setNewTemplateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Message Template</DialogTitle>
            <DialogDescription>
              Create a reusable template for common communications
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="e.g., Welcome Email, Payment Reminder"
              />
            </div>
            
            <div>
              <Label htmlFor="template-category">Category</Label>
              <Select value={templateForm.category} onValueChange={(value) => setTemplateForm({ ...templateForm, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="template-subject">Subject</Label>
              <Input
                id="template-subject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="Template subject with {{variables}}"
              />
            </div>
            
            <div>
              <Label htmlFor="template-content">Content</Label>
              <Textarea
                id="template-content"
                value={templateForm.content}
                onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                placeholder="Template content with {{variables}}..."
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="template-variables">Available Variables</Label>
              <Input
                id="template-variables"
                value={templateForm.variables}
                onChange={(e) => setTemplateForm({ ...templateForm, variables: e.target.value })}
                placeholder="name, email, plan_name (comma separated)"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setNewTemplateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate}>
                Create Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};