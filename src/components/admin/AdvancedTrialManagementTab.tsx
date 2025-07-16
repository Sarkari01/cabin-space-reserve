import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Clock, 
  Users, 
  Target, 
  TrendingUp,
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Play,
  Pause
} from "lucide-react";
import { useAdvancedTrials } from "@/hooks/useAdvancedTrials";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const AdvancedTrialManagementTab = () => {
  const { 
    trialConfigurations, 
    trialAnalytics, 
    loading,
    createTrialConfiguration,
    updateTrialConfiguration,
    extendTrial,
    convertTrialToPaid,
    getTrialConversionAnalytics
  } = useAdvancedTrials();
  
  const [newTrialModalOpen, setNewTrialModalOpen] = useState(false);
  const [editTrialModalOpen, setEditTrialModalOpen] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState<any>(null);
  
  // Form state for new trial configuration
  const [trialForm, setTrialForm] = useState({
    name: "",
    type: "time_limited" as "time_limited" | "feature_limited" | "usage_limited" | "hybrid",
    duration_days: 14,
    feature_limits: {
      max_study_halls: 1,
      max_bookings: 10,
      analytics_access: false,
      support_level: "basic"
    },
    description: "",
    is_active: true,
    auto_convert: false,
    conversion_incentive: ""
  });

  const handleCreateTrial = async () => {
    try {
      await createTrialConfiguration(trialForm);
      setNewTrialModalOpen(false);
      setTrialForm({
        name: "",
        type: "time_limited",
        duration_days: 14,
        feature_limits: {
          max_study_halls: 1,
          max_bookings: 10,
          analytics_access: false,
          support_level: "basic"
        },
        description: "",
        is_active: true,
        auto_convert: false,
        conversion_incentive: ""
      });
    } catch (error) {
      console.error("Error creating trial:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Advanced Trial Management</h3>
          <p className="text-muted-foreground">
            Configure and manage multiple trial types with advanced analytics
          </p>
        </div>
        <Button onClick={() => setNewTrialModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Trial Type
        </Button>
      </div>

      {/* Trial Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trialAnalytics.activeTrials}</div>
            <p className="text-xs text-muted-foreground">
              +{trialAnalytics.newTrialsThisWeek} this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trialAnalytics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {trialAnalytics.conversionTrend > 0 ? '+' : ''}{trialAnalytics.conversionTrend}% vs last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Trial Duration</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trialAnalytics.avgTrialDuration} days</div>
            <p className="text-xs text-muted-foreground">Before conversion</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{trialAnalytics.trialRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Post-conversion revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Trial Configurations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Trial Configurations</span>
          </CardTitle>
          <CardDescription>
            Manage different trial types and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trialConfigurations.map((trial) => (
              <div key={trial.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-semibold">{trial.name}</h4>
                    <Badge variant={trial.is_active ? 'default' : 'secondary'}>
                      {trial.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">{trial.type.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {trial.description}
                  </p>
                  <div className="flex space-x-4 text-sm text-muted-foreground mt-2">
                    <span>Duration: {trial.duration_days} days</span>
                    <span>Max Study Halls: {trial.feature_limits.max_study_halls}</span>
                    <span>Conversions: {trial.total_conversions}</span>
                    <span>Rate: {trial.conversion_rate}%</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedTrial(trial);
                      setEditTrialModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateTrialConfiguration(trial.id, { is_active: !trial.is_active })}
                  >
                    {trial.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* A/B Testing Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>A/B Testing Results</span>
          </CardTitle>
          <CardDescription>
            Compare performance of different trial configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trialAnalytics.abTestResults?.map((test, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{test.testName}</h4>
                  <Badge variant={test.status === 'completed' ? 'default' : 'secondary'}>
                    {test.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded">
                    <h5 className="font-medium">Variant A: {test.variantA.name}</h5>
                    <div className="text-sm text-muted-foreground">
                      <p>Participants: {test.variantA.participants}</p>
                      <p>Conversions: {test.variantA.conversions}</p>
                      <p>Rate: {test.variantA.conversionRate}%</p>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <h5 className="font-medium">Variant B: {test.variantB.name}</h5>
                    <div className="text-sm text-muted-foreground">
                      <p>Participants: {test.variantB.participants}</p>
                      <p>Conversions: {test.variantB.conversions}</p>
                      <p>Rate: {test.variantB.conversionRate}%</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center space-x-2">
                  {test.winner && (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Winner: {test.winner}</span>
                      <span className="text-sm text-muted-foreground">
                        (+{test.improvement}% improvement)
                      </span>
                    </>
                  )}
                  {!test.winner && test.status === 'running' && (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Test in progress - {test.daysRemaining} days remaining</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create New Trial Configuration Modal */}
      <Dialog open={newTrialModalOpen} onOpenChange={setNewTrialModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Trial Configuration</DialogTitle>
            <DialogDescription>
              Set up a new trial type with custom features and limitations
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="trial-name">Trial Name</Label>
              <Input
                id="trial-name"
                value={trialForm.name}
                onChange={(e) => setTrialForm({ ...trialForm, name: e.target.value })}
                placeholder="e.g., Premium Trial, Feature-Limited Trial"
              />
            </div>
            
            <div>
              <Label htmlFor="trial-type">Trial Type</Label>
              <Select value={trialForm.type} onValueChange={(value: "time_limited" | "feature_limited" | "usage_limited" | "hybrid") => setTrialForm({ ...trialForm, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time_limited">Time Limited</SelectItem>
                  <SelectItem value="feature_limited">Feature Limited</SelectItem>
                  <SelectItem value="usage_limited">Usage Limited</SelectItem>
                  <SelectItem value="hybrid">Hybrid (Time + Feature)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                value={trialForm.duration_days}
                onChange={(e) => setTrialForm({ ...trialForm, duration_days: parseInt(e.target.value) })}
              />
            </div>
            
            <div>
              <Label htmlFor="max-study-halls">Max Study Halls</Label>
              <Input
                id="max-study-halls"
                type="number"
                value={trialForm.feature_limits.max_study_halls}
                onChange={(e) => setTrialForm({ 
                  ...trialForm, 
                  feature_limits: { 
                    ...trialForm.feature_limits, 
                    max_study_halls: parseInt(e.target.value) 
                  }
                })}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="analytics-access"
                checked={trialForm.feature_limits.analytics_access}
                onCheckedChange={(checked) => setTrialForm({ 
                  ...trialForm, 
                  feature_limits: { 
                    ...trialForm.feature_limits, 
                    analytics_access: checked 
                  }
                })}
              />
              <Label htmlFor="analytics-access">Analytics Access</Label>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={trialForm.description}
                onChange={(e) => setTrialForm({ ...trialForm, description: e.target.value })}
                placeholder="Describe this trial configuration..."
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-convert"
                checked={trialForm.auto_convert}
                onCheckedChange={(checked) => setTrialForm({ ...trialForm, auto_convert: checked })}
              />
              <Label htmlFor="auto-convert">Auto-convert on trial end</Label>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setNewTrialModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTrial}>
                Create Trial Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};