import { useState, Suspense, lazy } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, Filter, TrendingUp, TrendingDown, BarChart3, PieChart, LineChart } from "lucide-react";
import { LoadingSpinner, LoadingCard } from "@/components/ui/loading";
import { ResponsiveTable } from "@/components/ResponsiveTable";

// Lazy load heavy chart components
// const Chart = lazy(() => import("@/components/ui/chart").then(module => ({ default: module.Chart })));

interface AnalyticsData {
  revenue: number;
  bookings: number;
  users: number;
  growth: number;
  date: string;
}

interface EnhancedAnalyticsProps {
  data: AnalyticsData[];
  title: string;
  description?: string;
  loading?: boolean;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  onRefresh?: () => void;
}

export function EnhancedAnalytics({ 
  data, 
  title, 
  description, 
  loading = false,
  onExport,
  onRefresh 
}: EnhancedAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [chartType, setChartType] = useState<"line" | "bar" | "pie">("line");
  const [filterValue, setFilterValue] = useState("");

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default export implementation
      const csvData = data.map(item => ({
        Date: item.date,
        Revenue: item.revenue,
        Bookings: item.bookings,
        Users: item.users,
        Growth: `${item.growth}%`
      }));
      
      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-analytics.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const getMetricValue = (item: AnalyticsData) => {
    switch (selectedMetric) {
      case 'revenue': return item.revenue;
      case 'bookings': return item.bookings;
      case 'users': return item.users;
      case 'growth': return item.growth;
      default: return item.revenue;
    }
  };

  const getChartIcon = () => {
    switch (chartType) {
      case 'bar': return BarChart3;
      case 'pie': return PieChart;
      default: return LineChart;
    }
  };

  const ChartIcon = getChartIcon();

  const filteredData = data.filter(item => 
    !filterValue || 
    item.date.includes(filterValue) ||
    item.revenue.toString().includes(filterValue)
  );

  const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0);
  const totalBookings = filteredData.reduce((sum, item) => sum + item.bookings, 0);
  const averageGrowth = filteredData.reduce((sum, item) => sum + item.growth, 0) / filteredData.length;

  const tableColumns = [
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'revenue',
      title: 'Revenue',
      sortable: true,
      render: (value: number) => `₹${value.toLocaleString()}`
    },
    {
      key: 'bookings',
      title: 'Bookings',
      sortable: true,
      mobileHidden: true
    },
    {
      key: 'users',
      title: 'Users',
      sortable: true,
      mobileHidden: true
    },
    {
      key: 'growth',
      title: 'Growth',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-1">
          {value >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
          <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
            {value.toFixed(1)}%
          </span>
        </div>
      )
    }
  ];

  if (loading) {
    return <LoadingCard className="h-96" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ChartIcon className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
                <SelectItem value="1y">1 year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Refresh
            </Button>
            
            <Select value="csv" onValueChange={handleExport}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Excel
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    PDF
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{totalBookings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total Bookings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{averageGrowth.toFixed(1)}%</span>
                {averageGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">Avg Growth</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="bookings">Bookings</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={chartType} onValueChange={setChartType as any}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="pie">Pie</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Input
            placeholder="Filter data..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {/* Chart */}
        <div className="h-64 mb-6">
          <Suspense fallback={<LoadingSpinner size="lg" className="mx-auto mt-20" />}>
            {/* Chart implementation would go here */}
            <div className="h-full bg-muted/30 rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ChartIcon className="h-12 w-12 mx-auto mb-2" />
                <p>Chart visualization will be rendered here</p>
                <p className="text-sm">Showing {selectedMetric} data in {chartType} format</p>
              </div>
            </div>
          </Suspense>
        </div>

        {/* Data Table */}
        <ResponsiveTable
          data={filteredData}
          columns={tableColumns}
          searchPlaceholder="Search analytics data..."
          emptyMessage="No analytics data available"
          pageSize={10}
        />
      </CardContent>
    </Card>
  );
}