import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, addDays, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TrialManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchantId: string;
  merchantName: string;
  onTrialAssigned: () => void;
}

export const TrialManagementModal = ({ 
  open, 
  onOpenChange, 
  merchantId, 
  merchantName, 
  onTrialAssigned 
}: TrialManagementModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [trialDuration, setTrialDuration] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());

  const getTrialEndDate = () => {
    switch (trialDuration) {
      case '15-days':
        return addDays(startDate, 15);
      case '1-month':
        return addMonths(startDate, 1);
      case '2-months':
        return addMonths(startDate, 2);
      case '3-months':
        return addMonths(startDate, 3);
      default:
        return addDays(startDate, 15);
    }
  };

  const handleAssignTrial = async () => {
    if (!trialDuration) {
      toast({
        title: "Error",
        description: "Please select a trial duration",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const endDate = getTrialEndDate();

      // First, check if merchant already has an active subscription
      const { data: existingSubscription } = await supabase
        .from('merchant_subscriptions')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('status', 'active')
        .single();

      if (existingSubscription) {
        // Update existing subscription to trial
        const { error: updateError } = await supabase
          .from('merchant_subscriptions')
          .update({
            is_trial: true,
            trial_start_date: startDate.toISOString(),
            trial_end_date: endDate.toISOString(),
            status: 'trial',
            plan_type: 'trial',
            max_study_halls: 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id);

        if (updateError) throw updateError;
      } else {
        // Create new trial subscription
        const { error: insertError } = await supabase
          .from('merchant_subscriptions')
          .insert({
            merchant_id: merchantId,
            plan_id: null, // No specific plan for trial
            is_trial: true,
            trial_start_date: startDate.toISOString(),
            trial_end_date: endDate.toISOString(),
            status: 'trial',
            plan_type: 'trial',
            max_study_halls: 1,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "Trial Assigned",
        description: `${trialDuration.replace('-', ' ')} trial assigned to ${merchantName} until ${format(endDate, 'PPP')}`,
      });

      onTrialAssigned();
      onOpenChange(false);
      
      // Reset form
      setTrialDuration('');
      setStartDate(new Date());
    } catch (error: any) {
      console.error('Error assigning trial:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign trial",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Trial Period</DialogTitle>
          <DialogDescription>
            Assign a custom trial period to <strong>{merchantName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trial Duration Selection */}
          <div className="space-y-2">
            <Label>Trial Duration</Label>
            <Select value={trialDuration} onValueChange={setTrialDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select trial duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15-days">15 Days</SelectItem>
                <SelectItem value="1-month">1 Month</SelectItem>
                <SelectItem value="2-months">2 Months</SelectItem>
                <SelectItem value="3-months">3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date Selection */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Trial End Date Preview */}
          {trialDuration && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Trial will end on:</div>
              <div className="font-medium">{format(getTrialEndDate(), 'PPP')}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignTrial} disabled={loading || !trialDuration}>
              {loading ? 'Assigning...' : 'Assign Trial'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};