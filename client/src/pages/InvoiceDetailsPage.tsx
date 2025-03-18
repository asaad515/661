import { useQuery } from "@tanstack/react-query";
import { Invoice } from "@shared/schema";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, FileEdit, Printer, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";

export default function InvoiceDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ["/api/invoices", id],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">جاري تحميل تفاصيل الفاتورة...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">الفاتورة غير موجودة</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost">
              <ArrowRight className="ml-2 h-4 w-4" />
              عودة للفواتير
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            فاتورة رقم {invoice.invoiceNumber}
          </h1>
          <Badge
            variant={invoice.status === "active" ? "default" : "destructive"}
          >
            {invoice.status === "active" ? "نشط" : "ملغي"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="ml-2 h-4 w-4" />
            طباعة
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل الفاتورة</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt>رقم الفاتورة</dt>
                <dd>{invoice.invoiceNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt>اسم العميل</dt>
                <dd>{invoice.customerName}</dd>
              </div>
              <div className="flex justify-between">
                <dt>تاريخ الإنشاء</dt>
                <dd>{new Date(invoice.createdAt).toLocaleDateString("ar-IQ")}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المبالغ</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt>المبلغ الإجمالي</dt>
                <dd>
                  {new Intl.NumberFormat("ar-IQ", {
                    style: "currency",
                    currency: "IQD",
                  }).format(invoice.totalAmount)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>المنتجات</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right py-2">المنتج</th>
                <th className="text-right py-2">الكمية</th>
                <th className="text-right py-2">السعر</th>
                <th className="text-right py-2">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.productName || `منتج ${item.productId}`}</td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">
                    {new Intl.NumberFormat("ar-IQ", {
                      style: "currency",
                      currency: "IQD",
                    }).format(item.unitPrice)}
                  </td>
                  <td className="py-2">
                    {new Intl.NumberFormat("ar-IQ", {
                      style: "currency",
                      currency: "IQD",
                    }).format(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}