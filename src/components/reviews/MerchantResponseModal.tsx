import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare } from "lucide-react";
import { useReviews, Review } from "@/hooks/useReviews";

interface MerchantResponseModalProps {
  review: Review | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const MerchantResponseModal = ({
  review,
  open,
  onOpenChange,
  onSuccess
}: MerchantResponseModalProps) => {
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  
  const { addMerchantResponse, loading } = useReviews();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!review) return;
    
    if (!response.trim()) {
      setError("Please enter a response");
      return;
    }

    if (response.length > 500) {
      setError("Response must be less than 500 characters");
      return;
    }

    const result = await addMerchantResponse(review.id, response.trim());
    
    if (result) {
      setResponse("");
      setError("");
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const handleClose = () => {
    setResponse("");
    setError("");
    onOpenChange(false);
  };

  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Respond to Review
          </DialogTitle>
          <DialogDescription>
            Respond to {review.profiles?.full_name || "this customer"}'s review
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Show the original review */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">Customer Review:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-xs ${
                        star <= review.rating ? "text-yellow-500" : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {review.review_text || "No written review provided."}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="response">Your Response</Label>
              <Textarea
                id="response"
                placeholder="Thank you for your feedback..."
                value={response}
                onChange={(e) => {
                  setResponse(e.target.value);
                  setError("");
                }}
                maxLength={500}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Show your appreciation and address any concerns</span>
                <span>{response.length}/500</span>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !response.trim()}
            >
              {loading ? "Sending..." : "Send Response"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};