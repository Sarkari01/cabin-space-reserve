import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, DollarSign, Calendar, Star, Clock } from "lucide-react";

interface AnalyticsData {
  occupancyRate: number;
  revenue: number;
  bookings: number;
  rating: number;
  peakHours: { hour: string; bookings: number }[];
  monthlyTrends: { month: string; bookings: number; revenue: number }[];
  seatUtilization: { seatType: string; utilization: number; color: string }[];
}

interface StudyHallAnalyticsProps {
  studyHallId?: string;
  disabled?: boolean;
}

export function StudyHallAnalytics({ studyHallId, disabled = false }: StudyHallAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    occupancyRate: 85,
    revenue: 125000,
    bookings: 342,
    rating: 4.6,
    peakHours: [
      { hour: '09:00', bookings: 25 },
      { hour: '10:00', bookings: 45 },
      { hour: '11:00', bookings: 52 },
      { hour: '14:00', bookings: 48 },
      { hour: '15:00', bookings: 38 },
      { hour: '16:00', bookings: 42 },
    ],
    monthlyTrends: [
      { month: 'Jan', bookings: 280, revenue: 84000 },
      { month: 'Feb', bookings: 310, revenue: 93000 },
      { month: 'Mar', bookings: 342, revenue: 125000 },
      { month: 'Apr', bookings: 295, revenue: 88500 },
      { month: 'May', bookings: 380, revenue: 114000 },
      { month: 'Jun', bookings: 420, revenue: 126000 },
    ],
    seatUtilization: [
      { seatType: 'Regular', utilization: 82, color: '#3b82f6' },
      { seatType: 'VIP', utilization: 95, color: '#f59e0b' },
      { seatType: 'Window', utilization: 88, color: '#10b981' },
    ]
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (studyHallId) {
      // In a real app, fetch analytics data from API
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  }, [studyHallId]);

  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Occupancy Rate</p>
                <p className={`text-2xl font-bold ${getOccupancyColor(analytics.occupancyRate)}`}>
                  {analytics.occupancyRate}%
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <Progress value={analytics.occupancyRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{analytics.revenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-green-600 mt-1">↗ +12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.bookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-blue-600 mt-1">↗ +8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className={`text-2xl font-bold ${getRatingColor(analytics.rating)}`}>
                  {analytics.rating}/5
                </p>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < Math.floor(analytics.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Peak Hours Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.peakHours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Bar dataKey="bookings" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="bookings" orientation="left" />
              <YAxis yAxisId="revenue" orientation="right" />
              <Bar yAxisId="bookings" dataKey="bookings" fill="#3b82f6" name="Bookings" />
              <Bar yAxisId="revenue" dataKey="revenue" fill="#10b981" name="Revenue (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Seat Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Seat Utilization by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.seatUtilization.map((seat) => (
              <div key={seat.seatType} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{seat.seatType}</span>
                  <span className="text-sm text-muted-foreground">{seat.utilization}%</span>
                </div>
                <Progress 
                  value={seat.utilization} 
                  className="h-2"
                  style={{ 
                    '--progress-background': seat.color 
                  } as React.CSSProperties}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-1">Peak</Badge>
              <div>
                <p className="text-sm font-medium">High demand at 11:00 AM</p>
                <p className="text-xs text-muted-foreground">Consider premium pricing during peak hours</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">Capacity</Badge>
              <div>
                <p className="text-sm font-medium">VIP seats have 95% utilization</p>
                <p className="text-xs text-muted-foreground">Consider adding more VIP seating</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="default" className="mt-1">Rating</Badge>
              <div>
                <p className="text-sm font-medium">Excellent rating of 4.6/5</p>
                <p className="text-xs text-muted-foreground">Maintain current service quality</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}