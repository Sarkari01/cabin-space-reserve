import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface InstitutionNewsModalProps {
  institutionId?: string;
  news?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  onSuccess: () => void;
}

export function InstitutionNewsModal({ 
  open, 
  onOpenChange 
}: InstitutionNewsModalProps) {
  const { toast } = useToast();

  const handleMigrationNotice = () => {
    toast({
      title: "Migration Required",
      description: "Please run the database migration first to enable news management.",
      variant: "destructive",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Database Migration Required</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            The news management functionality requires running the database migration first.
          </p>
          <p className="text-sm text-muted-foreground">
            Please run the migration and then try again.
          </p>
        </div>

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
      </DialogContent>
    </Dialog>
  );
}