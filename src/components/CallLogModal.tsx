import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, User, Mail } from 'lucide-react';

interface CallLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (callData: {
    call_status: string;
    call_outcome?: string;
    notes?: string;
    follow_up_date?: string;
    call_duration?: number;
  }) => void;
  contactInfo?: {
    name: string;
    phone: string;
    email: string;
  };
  callPurpose: 'onboarding' | 'payment_follow_up' | 'support' | 'general';
}

export const CallLogModal = ({
  open,
  onOpenChange,
  onSubmit,
  contactInfo,
  callPurpose
}: CallLogModalProps) => {
  const [callStatus, setCallStatus] = useState<string>('');
  const [callOutcome, setCallOutcome] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [callDuration, setCallDuration] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!callStatus) return;

    onSubmit({
      call_status: callStatus,
      call_outcome: callOutcome || undefined,
      notes: notes || undefined,
      follow_up_date: followUpDate || undefined,
      call_duration: callDuration || undefined
    });

    // Reset form
    setCallStatus('');
    setCallOutcome('');
    setNotes('');
    setFollowUpDate('');
    setCallDuration(0);
  };

  const callStatusOptions = [
    { value: 'completed', label: 'Call Completed' },
    { value: 'no_answer', label: 'No Answer' },
    { value: 'busy', label: 'Line Busy' },
    { value: 'invalid_number', label: 'Invalid Number' },
    { value: 'callback_requested', label: 'Callback Requested' }
  ];

  const getOutcomeOptions = () => {
    switch (callPurpose) {
      case 'onboarding':
        return [
          { value: 'interested', label: 'Interested' },
          { value: 'not_interested', label: 'Not Interested' },
          { value: 'call_later', label: 'Call Later' }
        ];
      case 'payment_follow_up':
        return [
          { value: 'payment_confirmed', label: 'Payment Confirmed' },
          { value: 'call_later', label: 'Will Pay Later' },
          { value: 'escalated', label: 'Escalated' }
        ];
      case 'support':
        return [
          { value: 'issue_resolved', label: 'Issue Resolved' },
          { value: 'escalated', label: 'Escalated to Technical' },
          { value: 'call_later', label: 'Follow-up Required' }
        ];
      default:
        return [
          { value: 'call_later', label: 'Call Later' },
          { value: 'escalated', label: 'Escalated' }
        ];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log Call Details</DialogTitle>
        </DialogHeader>

        {contactInfo && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{contactInfo.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{contactInfo.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{contactInfo.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="call_status">Call Status *</Label>
              <Select value={callStatus} onValueChange={setCallStatus} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select call status" />
                </SelectTrigger>
                <SelectContent>
                  {callStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {callStatus === 'completed' && (
              <div className="space-y-2">
                <Label htmlFor="call_outcome">Call Outcome</Label>
                <Select value={callOutcome} onValueChange={setCallOutcome}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    {getOutcomeOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="call_duration">Duration (minutes)</Label>
              <Input
                id="call_duration"
                type="number"
                min="0"
                value={callDuration}
                onChange={(e) => setCallDuration(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            {(callOutcome === 'call_later' || callStatus === 'callback_requested') && (
              <div className="space-y-2">
                <Label htmlFor="follow_up_date">Follow-up Date</Label>
                <Input
                  id="follow_up_date"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about the call..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!callStatus}>
              Save Call Log
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};