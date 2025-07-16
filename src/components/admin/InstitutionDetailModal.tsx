import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { School } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InstitutionDetailModalProps {
  institution: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newsCount: number;
}

export function InstitutionDetailModal({ 
  open, 
  onOpenChange 
}: InstitutionDetailModalProps) {
  const { toast } = useToast();

  const handleMigrationNotice = () => {
    toast({
      title: "Migration Required",
      description: "Please run the database migration first to enable institution management.",
      variant: "destructive",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <School className="h-5 w-5 text-primary" />
            </div>
            <span>Database Migration Required</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="border-warning bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <School className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium text-warning">Migration Required</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please run the database migration to enable institution details viewing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMigrationNotice} 
              className="flex-1"
            >
              OK
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}