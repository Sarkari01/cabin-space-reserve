import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Settlement, SettlementTransaction } from "@/hooks/useSettlements";
import { safeFormatDate, safeFormatDateTime } from "@/lib/dateUtils";
import { IndianRupee } from "lucide-react";

interface SettlementDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlement: Settlement | null;
  transactions: SettlementTransaction[];
  loading?: boolean;
}

const StatusBadge: React.FC<{ status?: string | null }> = ({ status }) => {
  const s = (status || "unknown").toLowerCase();
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-blue-100 text-blue-800",
    paid: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
    unknown: "bg-muted text-foreground",
  };
  return <Badge className={colors[s] || colors.unknown}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>;
};

export const SettlementDetailsDrawer: React.FC<SettlementDetailsDrawerProps> = ({
  open,
  onOpenChange,
  settlement,
  transactions,
  loading,
}) => {
  const s = settlement;
  const paddedNumber = s?.settlement_number && s.settlement_number > 0 ? `#${String(s.settlement_number).padStart(6, "0")}` : "#PENDING";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            <span>Settlement Details {paddedNumber}</span>
            <StatusBadge status={s?.status} />
          </DrawerTitle>
          <DrawerDescription>Review settlement summary and associated transactions.</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="font-medium">{safeFormatDateTime(s?.created_at)}</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Total Booking Amount</div>
              <div className="font-semibold flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                {Number(s?.total_booking_amount || 0).toLocaleString()}
              </div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Platform Fee %</div>
              <div className="font-medium">{Number(s?.platform_fee_percentage || 0)}%</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Platform Fee Amount</div>
              <div className="font-semibold flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                {Number(s?.platform_fee_amount || 0).toLocaleString()}
              </div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Net Settlement Amount</div>
              <div className="font-semibold flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                {Number(s?.net_settlement_amount || 0).toLocaleString()}
              </div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Payment</div>
              <div className="space-y-1">
                <div>Reference: {s?.payment_reference || "N/A"}</div>
                <div>Method: {s?.payment_method || "N/A"}</div>
                <div>Date: {s?.payment_date ? safeFormatDate(s?.payment_date) : "N/A"}</div>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Transactions ({transactions?.length || 0})</div>
          </div>

          <div className="relative w-full overflow-auto border rounded-md">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">Loading transactions...</div>
            ) : transactions && transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Txn #</TableHead>
                    <TableHead>Booking #</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.transaction_number ? `#${String(t.transaction_number).padStart(6, "0")}` : "—"}</TableCell>
                      <TableCell>{t.booking_number ? `#${String(t.booking_number).padStart(6, "0")}` : "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-4 w-4" />
                          {Number(t.transaction_amount || 0).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>{safeFormatDateTime(t.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 text-center text-muted-foreground">No transactions found for this settlement.</div>
            )}
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default SettlementDetailsDrawer;
