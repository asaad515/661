import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { PrintTemplate } from "@/components/ui/print-template";
import { PrintButton, type PrintSettings } from "@/components/ui/print-button";
import { useReactToPrint } from "react-to-print";

export default function InvoicePrint() {
  const { id } = useParams();
  const printRef = useRef<HTMLDivElement>(null);
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    showLogo: true,
    showHeader: true,
    showFooter: true,
    pageSize: "A4",
  });

  const { data: invoice, isLoading } = useQuery({
    queryKey: [`/api/invoices/${id}`],
  });

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  if (isLoading) {
    return <div>جاري التحميل...</div>;
  }

  if (!invoice) {
    return <div>لم يتم العثور على الفاتورة</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">طباعة الفاتورة #{invoice.id}</h1>
          <PrintButton
            onPrint={handlePrint}
            onSettingsChange={setPrintSettings}
            loading={isLoading}
          />
        </div>

        <div className="hidden print:block">
          <PrintTemplate
            ref={printRef}
            type="invoice"
            title={`فاتورة #${invoice.id}`}
            subtitle={`العميل: ${invoice.customerName}`}
            {...printSettings}
          >
            <div className="space-y-6">
              {/* معلومات الفاتورة */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">معلومات العميل</h3>
                  <p>{invoice.customerName}</p>
                  <p>{invoice.customerPhone}</p>
                  <p>{invoice.customerEmail}</p>
                </div>
                <div className="text-left">
                  <h3 className="font-medium">تفاصيل الفاتورة</h3>
                  <p>تاريخ الإصدار: {new Date(invoice.date).toLocaleDateString("ar-SA")}</p>
                  <p>رقم الفاتورة: {invoice.invoiceNumber}</p>
                  <p>حالة الدفع: {invoice.paymentStatus}</p>
                </div>
              </div>

              {/* جدول المنتجات */}
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border p-2 text-right">المنتج</th>
                    <th className="border p-2 text-right">الكمية</th>
                    <th className="border p-2 text-right">السعر</th>
                    <th className="border p-2 text-right">المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="border p-2">{item.name}</td>
                      <td className="border p-2">{item.quantity}</td>
                      <td className="border p-2">{item.price} د.ع</td>
                      <td className="border p-2">{item.quantity * item.price} د.ع</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td colSpan={3} className="border p-2 text-left">المجموع الكلي</td>
                    <td className="border p-2">
                      {invoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)} د.ع
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* ملاحظات */}
              {invoice.notes && (
                <div className="mt-8">
                  <h3 className="font-medium mb-2">ملاحظات</h3>
                  <p className="text-muted-foreground">{invoice.notes}</p>
                </div>
              )}
            </div>
          </PrintTemplate>
        </div>
      </Card>
    </div>
  );
}
