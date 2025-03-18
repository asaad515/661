import { ColumnDef } from "@tanstack/react-table";
import { Invoice } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Eye, Printer, FilePenLine, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "invoiceNumber",
    header: "رقم الفاتورة",
  },
  {
    accessorKey: "customerName",
    header: "اسم العميل",
  },
  {
    accessorKey: "totalAmount",
    header: "المبلغ الإجمالي",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalAmount"));
      const formatted = new Intl.NumberFormat("ar-IQ", {
        style: "currency",
        currency: "IQD",
      }).format(amount);
      return formatted;
    },
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "active"
              ? "default"
              : status === "modified"
              ? "secondary"
              : "destructive"
          }
        >
          {status === "active"
            ? "نشط"
            : status === "modified"
            ? "معدل"
            : "ملغي"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "تاريخ الإنشاء",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return date.toLocaleDateString("ar-IQ");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const invoice = row.original;
      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/invoices/${invoice.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];