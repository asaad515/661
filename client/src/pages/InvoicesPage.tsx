import { useQuery } from "@tanstack/react-query";
import { Invoice } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/invoices/columns";
import { Button } from "@/components/ui/button";
import { AlertCircle, Printer, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";

interface InvoiceResponse {
  data: Invoice[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function InvoicesPage() {
  const { toast } = useToast();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [page, setPage] = useState(1);

  // استخدام debounce للبحث
  const debouncedSearch = useDebounce(searchTerm, 500);
  const debouncedDateRange = useDebounce(dateRange, 500);

  const { data: response, isLoading } = useQuery<InvoiceResponse>({
    queryKey: ["/api/invoices", { 
      search: debouncedSearch,
      startDate: debouncedDateRange.from,
      endDate: debouncedDateRange.to,
      page,
      limit: 10
    }],
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const handlePrint = async (invoice: Invoice) => {
    try {
      await apiRequest(`/api/invoices/${invoice.id}/print`, { method: "POST" });
      toast({
        title: "تم إرسال الفاتورة للطباعة",
        description: `تم إرسال الفاتورة رقم ${invoice.invoiceNumber} للطباعة بنجاح`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في الطباعة",
        description: "حدث خطأ أثناء محاولة طباعة الفاتورة",
      });
    }
  };

  const handleCancel = async () => {
    if (!selectedInvoice) return;

    try {
      await apiRequest(`/api/invoices/${selectedInvoice.id}/cancel`, { method: "POST" });
      toast({
        title: "تم إلغاء الفاتورة",
        description: `تم إلغاء الفاتورة رقم ${selectedInvoice.invoiceNumber} بنجاح`,
      });
      setShowCancelDialog(false);
      setSelectedInvoice(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في الإلغاء",
        description: "حدث خطأ أثناء محاولة إلغاء الفاتورة",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">الفواتير</h1>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="ml-2 h-4 w-4" />
          طباعة القائمة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Label htmlFor="search">بحث</Label>
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              className="pr-10"
              placeholder="رقم الفاتورة أو اسم العميل"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <Label>نطاق التاريخ</Label>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="text-lg">جاري تحميل الفواتير...</div>
        </div>
      ) : !response?.data.length ? (
        <div className="flex justify-center items-center h-32">
          <div className="text-lg">لا توجد فواتير متطابقة مع معايير البحث</div>
        </div>
      ) : (
        <>
          <DataTable 
            columns={columns} 
            data={response.data}
            onPageChange={setPage}
            pagination={response.pagination}
          />
        </>
      )}

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إلغاء الفاتورة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في إلغاء الفاتورة رقم {selectedInvoice?.invoiceNumber}؟
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>
              <AlertCircle className="ml-2 h-4 w-4" />
              تأكيد الإلغاء
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}