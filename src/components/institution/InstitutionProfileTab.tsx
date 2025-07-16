import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { School } from "lucide-react";

export function InstitutionProfileTab() {
  return (
    <div className="space-y-6">
      <Card className="border-warning bg-warning/5">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <School className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium text-warning">Database Migration Required</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please run the database migration to enable profile management.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Institution Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <School className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Profile management will be available after the database migration is complete.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}