import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Filter, X } from 'lucide-react';

interface ReportFiltersProps {
  filters: {
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    merchantId?: string;
    studyHallId?: string;
    paymentMethod?: string;
    planType?: string;
  };
  onFiltersChange: (filters: any) => void;
  options?: {
    statuses?: { value: string; label: string }[];
    merchants?: { value: string; label: string }[];
    studyHalls?: { value: string; label: string }[];
    paymentMethods?: { value: string; label: string }[];
    planTypes?: { value: string; label: string }[];
  };
  showMerchantFilter?: boolean;
  showStudyHallFilter?: boolean;
  showPaymentMethodFilter?: boolean;
  showPlanTypeFilter?: boolean;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  filters,
  onFiltersChange,
  options = {},
  showMerchantFilter = false,
  showStudyHallFilter = false,
  showPaymentMethodFilter = false,
  showPlanTypeFilter = false
}) => {
  const updateFilter = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value && value !== 'all');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Report Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label htmlFor="dateFrom">From Date</Label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dateTo">To Date</Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
            />
          </div>

          {/* Status Filter */}
          {options.statuses && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {options.statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Merchant Filter */}
          {showMerchantFilter && options.merchants && (
            <div className="space-y-2">
              <Label>Merchant</Label>
              <Select value={filters.merchantId || 'all'} onValueChange={(value) => updateFilter('merchantId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Merchants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Merchants</SelectItem>
                  {options.merchants.map((merchant) => (
                    <SelectItem key={merchant.value} value={merchant.value}>
                      {merchant.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Study Hall Filter */}
          {showStudyHallFilter && options.studyHalls && (
            <div className="space-y-2">
              <Label>Study Hall</Label>
              <Select value={filters.studyHallId || 'all'} onValueChange={(value) => updateFilter('studyHallId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Study Halls" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Study Halls</SelectItem>
                  {options.studyHalls.map((hall) => (
                    <SelectItem key={hall.value} value={hall.value}>
                      {hall.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Payment Method Filter */}
          {showPaymentMethodFilter && options.paymentMethods && (
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={filters.paymentMethod || 'all'} onValueChange={(value) => updateFilter('paymentMethod', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {options.paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Plan Type Filter */}
          {showPlanTypeFilter && options.planTypes && (
            <div className="space-y-2">
              <Label>Plan Type</Label>
              <Select value={filters.planType || 'all'} onValueChange={(value) => updateFilter('planType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {options.planTypes.map((plan) => (
                    <SelectItem key={plan.value} value={plan.value}>
                      {plan.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};