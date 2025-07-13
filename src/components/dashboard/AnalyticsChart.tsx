import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Button } from "@/components/ui/button";

interface AnalyticsChartProps {
  title: string;
  description?: string;
  data: any[];
  type: 'line' | 'bar' | 'pie';
  dataKey: string;
  xAxisKey?: string;
  trend?: number;
  value?: string | number;
  className?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

export const AnalyticsChart = ({ 
  title, 
  description, 
  data, 
  type, 
  dataKey, 
  xAxisKey = 'date', 
  trend, 
  value,
  className = "",
  onRefresh,
  loading = false
}: AnalyticsChartProps) => {
  const renderChart = () => {
    if (loading) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (xAxisKey === 'date') {
                    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }
                  return value;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => {
                  if (xAxisKey === 'date') {
                    return new Date(value).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric' 
                    });
                  }
                  return value;
                }}
                formatter={(value: any) => {
                  if (dataKey.includes('revenue') || dataKey.includes('amount')) {
                    return [`₹${Number(value).toLocaleString()}`, dataKey];
                  }
                  return [value, dataKey];
                }}
              />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: any) => {
                  if (dataKey.includes('revenue') || dataKey.includes('amount')) {
                    return [`₹${Number(value).toLocaleString()}`, dataKey];
                  }
                  return [value, dataKey];
                }}
              />
              <Bar 
                dataKey={dataKey} 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80 transition-opacity"
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={dataKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => {
                  if (dataKey.includes('revenue') || dataKey.includes('amount')) {
                    return [`₹${Number(value).toLocaleString()}`, dataKey];
                  }
                  return [value, dataKey];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {trend !== undefined && (
              <Badge variant={trend >= 0 ? "default" : "destructive"} className="text-xs">
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(trend).toFixed(1)}%
              </Badge>
            )}
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
        {value && (
          <div className="text-2xl font-bold mt-2">{value}</div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {renderChart()}
      </CardContent>
    </Card>
  );
};