import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

interface AuditResult {
  id: string;
  name: string;
  expected_seats: number;
  actual_seats: number;
  status: 'OK' | 'MISMATCH';
}

export function SeatAuditTool() {
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const runAudit = async () => {
    try {
      setLoading(true);
      
      // Use manual query to get audit data
      const { data: auditData, error: queryError } = await supabase
        .from('study_halls')
        .select(`
          id,
          name,
          total_seats,
          seats(count)
        `)
        .eq('status', 'active');
        
      if (queryError) throw queryError;
      
      const results: AuditResult[] = auditData?.map(hall => {
        const seatCount = hall.seats?.length || 0;
        return {
          id: hall.id,
          name: hall.name,
          expected_seats: hall.total_seats,
          actual_seats: seatCount,
          status: seatCount === hall.total_seats ? 'OK' as const : 'MISMATCH' as const
        };
      }) || [];
      
      setAuditResults(results);
      
      toast({
        title: "Audit Complete",
        description: "Seat audit has been completed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Audit Failed",
        description: error.message || "Failed to run seat audit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fixMismatches = async () => {
    try {
      setLoading(true);
      
      const mismatchedHalls = auditResults.filter(result => result.status === 'MISMATCH');
      
      for (const hall of mismatchedHalls) {
        // Trigger seat regeneration by updating the study hall
        await supabase
          .from('study_halls')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', hall.id);
      }
      
      toast({
        title: "Fix Applied",
        description: `Fixed ${mismatchedHalls.length} study halls. Seats are being regenerated...`,
      });
      
      // Re-run audit after a delay
      setTimeout(() => {
        runAudit();
      }, 2000);
      
    } catch (error: any) {
      toast({
        title: "Fix Failed",
        description: error.message || "Failed to fix seat mismatches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Seat Audit Tool
        </CardTitle>
        <CardDescription>
          Check and fix seat synchronization issues across study halls
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runAudit} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Run Audit
          </Button>
          
          {auditResults.some(r => r.status === 'MISMATCH') && (
            <Button 
              onClick={fixMismatches} 
              disabled={loading}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Fix Mismatches
            </Button>
          )}
        </div>

        {auditResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Audit Results:</h4>
            {auditResults.map((result) => (
              <div 
                key={result.id} 
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <span className="font-medium">{result.name}</span>
                  <div className="text-sm text-muted-foreground">
                    Expected: {result.expected_seats} | Actual: {result.actual_seats}
                  </div>
                </div>
                <Badge 
                  variant={result.status === 'OK' ? 'default' : 'destructive'}
                  className="flex items-center gap-1"
                >
                  {result.status === 'OK' ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {result.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}