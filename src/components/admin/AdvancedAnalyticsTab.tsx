import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target, 
  Zap,
  BarChart3,
  LineChart,
  PieChart,
  Download,
  RefreshCw,
  Calendar,
  Filter
} from "lucide-react";
import { useAdvancedAnalytics } from "@/hooks/useAdvancedAnalytics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const AdvancedAnalyticsTab = () => {
  const { 
    analytics, 
    revenueForecasting, 
    churnAnalysis, 
    planPerformance,
    conversionFunnel,
    loading,
    refreshAnalytics 
  } = useAdvancedAnalytics();
  
  const [dateRange, setDateRange] = useState("30d");
  const [metricType, setMetricType] = useState("revenue");

  const exportReport = async (type: string) => {
    // Implementation for exporting reports
    console.log(`Exporting ${type} report for ${dateRange}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Advanced Analytics</h3>
          <p className="text-muted-foreground">
            Comprehensive insights and forecasting for business decisions
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={refreshAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => exportReport("comprehensive")}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.revenueGrowth > 0 ? '+' : ''}{analytics.revenueGrowth}%
            </div>
            <p className="text-xs text-muted-foreground">vs last period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{churnAnalysis.currentChurnRate}%</div>
            <p className="text-xs text-muted-foreground">
              Predicted: {churnAnalysis.predictedChurnRate}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionFunnel.overallConversion}%</div>
            <p className="text-xs text-muted-foreground">Trial to paid</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer LTV</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics.customerLTV.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Average lifetime value</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Forecasting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <LineChart className="h-5 w-5" />
            <span>Revenue Forecasting</span>
          </CardTitle>
          <CardDescription>
            AI-powered revenue predictions and trend analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ₹{revenueForecasting.nextMonthPrediction.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Next Month Forecast</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ₹{revenueForecasting.quarterPrediction.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Quarterly Forecast</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {revenueForecasting.confidenceScore}%
              </div>
              <p className="text-sm text-muted-foreground">Confidence Score</p>
            </div>
          </div>
          
          {/* Revenue Chart Placeholder */}
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Revenue Trend Chart</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5" />
            <span>Subscription Plan Performance</span>
          </CardTitle>
          <CardDescription>
            Detailed performance metrics for each subscription plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {planPerformance.map((plan) => (
              <div key={plan.planId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold">{plan.planName}</h4>
                  <div className="flex space-x-4 text-sm text-muted-foreground">
                    <span>{plan.activeSubscriptions} subscribers</span>
                    <span>₹{plan.monthlyRevenue.toLocaleString()}/month</span>
                    <span>{plan.churnRate}% churn</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={plan.performance === 'excellent' ? 'default' : 
                                 plan.performance === 'good' ? 'secondary' : 'destructive'}>
                    {plan.performance}
                  </Badge>
                  <div className="text-right">
                    <div className="font-semibold">{plan.conversionRate}%</div>
                    <div className="text-xs text-muted-foreground">conversion</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Conversion Funnel Analysis</span>
          </CardTitle>
          <CardDescription>
            Track user journey from trial to paid subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conversionFunnel.stages.map((stage, index) => (
              <div key={stage.name} className="relative">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold">{stage.name}</h4>
                      <p className="text-sm text-muted-foreground">{stage.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stage.count}</div>
                    <div className="text-sm text-muted-foreground">{stage.percentage}%</div>
                  </div>
                </div>
                {index < conversionFunnel.stages.length - 1 && (
                  <div className="flex justify-center my-2">
                    <div className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                      {stage.dropoffRate}% drop-off
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Merchant Lifecycle Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Merchant Lifecycle Analytics</CardTitle>
          <CardDescription>
            Track merchant progression through different stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.merchantLifecycle.newSignups}
              </div>
              <p className="text-sm text-muted-foreground">New Signups</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.merchantLifecycle.onboarding}
              </div>
              <p className="text-sm text-muted-foreground">In Onboarding</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analytics.merchantLifecycle.active}
              </div>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {analytics.merchantLifecycle.churned}
              </div>
              <p className="text-sm text-muted-foreground">Churned</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};