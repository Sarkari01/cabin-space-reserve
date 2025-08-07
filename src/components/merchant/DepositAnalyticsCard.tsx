import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, Building } from 'lucide-react';
import { usePrivateHalls } from '@/hooks/usePrivateHalls';

interface DepositAnalyticsProps {
  privateHallId?: string;
}

export const DepositAnalyticsCard: React.FC<DepositAnalyticsProps> = ({ privateHallId }) => {
  const { privateHalls } = usePrivateHalls();
  
  const calculateDepositAnalytics = () => {
    const halls = privateHallId 
      ? privateHalls.filter(hall => hall.id === privateHallId)
      : privateHalls.filter(hall => hall.status === 'active');

    const analytics = {
      totalHalls: halls.length,
      totalCabins: halls.reduce((sum, hall) => sum + hall.cabin_count, 0),
      averageDeposit: 0,
      totalPotentialDeposits: 0,
      depositRanges: {
        low: 0,    // < ₹1000
        medium: 0, // ₹1000 - ₹1999
        high: 0    // ≥ ₹2000
      }
    };

    // This is a simplified calculation - in a real implementation,
    // you'd fetch actual cabin data with deposits
    if (halls.length > 0) {
      // Estimate based on typical deposit amounts from our migration
      analytics.averageDeposit = 1250; // Average of ₹500, ₹1000, ₹1500, ₹2000
      analytics.totalPotentialDeposits = analytics.totalCabins * analytics.averageDeposit;
      
      // Estimate distribution
      analytics.depositRanges.low = Math.floor(analytics.totalCabins * 0.25);
      analytics.depositRanges.medium = Math.floor(analytics.totalCabins * 0.5);
      analytics.depositRanges.high = analytics.totalCabins - analytics.depositRanges.low - analytics.depositRanges.medium;
    }

    return analytics;
  };

  const analytics = calculateDepositAnalytics();

  if (analytics.totalHalls === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Deposit Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No active private halls found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Deposit Analytics
          {privateHallId && <Badge variant="outline">Single Hall</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
              <Building className="h-4 w-4" />
              Halls
            </div>
            <div className="text-2xl font-bold">{analytics.totalHalls}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              Cabins
            </div>
            <div className="text-2xl font-bold">{analytics.totalCabins}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              Avg Deposit
            </div>
            <div className="text-2xl font-bold">₹{analytics.averageDeposit}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
              <DollarSign className="h-4 w-4" />
              Total Potential
            </div>
            <div className="text-2xl font-bold">₹{analytics.totalPotentialDeposits.toLocaleString()}</div>
          </div>
        </div>

        {/* Deposit Distribution */}
        <div>
          <h4 className="font-semibold mb-3">Deposit Distribution</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Low (&lt; ₹1,000)</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${analytics.totalCabins > 0 ? (analytics.depositRanges.low / analytics.totalCabins) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{analytics.depositRanges.low}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Medium (₹1,000 - ₹1,999)</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ width: `${analytics.totalCabins > 0 ? (analytics.depositRanges.medium / analytics.totalCabins) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{analytics.depositRanges.medium}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">High (≥ ₹2,000)</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full" 
                    style={{ width: `${analytics.totalCabins > 0 ? (analytics.depositRanges.high / analytics.totalCabins) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{analytics.depositRanges.high}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-semibold text-sm text-blue-800 mb-2">Key Insights</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Deposits provide security for both parties</li>
            <li>• Higher deposits may reduce booking conversion</li>
            <li>• Consider market rates in your area</li>
            <li>• Regular review and adjustment recommended</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};