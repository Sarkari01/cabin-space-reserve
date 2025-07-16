import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExportButton } from '@/components/ui/export-button';
import { ExportColumn } from '@/utils/exportUtils';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading';

interface ReportCardProps {
  title: string;
  description: string;
  data: any[];
  columns: ExportColumn[];
  filename: string;
  loading?: boolean;
  onRefresh?: () => void;
  children?: React.ReactNode;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  title,
  description,
  data,
  columns,
  filename,
  loading = false,
  onRefresh,
  children
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <ExportButton
              data={data}
              columns={columns}
              filename={filename}
              title={title}
              disabled={loading || data.length === 0}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-2 text-muted-foreground">Loading report data...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No data available for this report</p>
            <p className="text-sm">Try adjusting the filters or date range</p>
          </div>
        ) : (
          <div>
            <div className="mb-4 text-sm text-muted-foreground">
              {data.length} record{data.length !== 1 ? 's' : ''} found
            </div>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
};