import { useQuery } from "@tanstack/react-query";
import { Calendar, Plus } from "lucide-react";
import type { Installment } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import InstallmentDetails from "@/components/installments/installment-details";
import { useState } from "react";
import { useLocation } from "wouter";

export default function InstallmentsPage() {
  const [selectedInstallment, setSelectedInstallment] = useState<number | null>(null);
  const [_, navigate] = useLocation();

  const { data: installments = [] } = useQuery<Installment[]>({
    queryKey: ["/api/installments"],
  });

  // فلترة التقسيطات النشطة
  const activeInstallments = installments.filter(
    (installment) => installment.status === "active"
  );

  // فلترة التقسيطات المكتملة
  const completedInstallments = installments.filter(
    (installment) => installment.status === "completed"
  );

  return (
    <div className="flex h-screen">
      <div className="w-64 h-full">
        <Sidebar />
      </div>
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Calendar className="h-6 w-6" />
              <h1 className="text-3xl font-bold">نظام التقسيط</h1>
            </div>
            <Button onClick={() => navigate("/sales")}>
              <Plus className="h-4 w-4 ml-2" />
              إنشاء تقسيط جديد
            </Button>
          </div>

          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle>التقسيطات النشطة</CardTitle>
                <CardDescription>
                  التقسيطات التي لا تزال قيد السداد
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العميل</TableHead>
                      <TableHead>رقم الهاتف</TableHead>
                      <TableHead>المبلغ المتبقي</TableHead>
                      <TableHead>موعد القسط القادم</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeInstallments.map((installment) => (
                      <TableRow
                        key={installment.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedInstallment(installment.id)}
                      >
                        <TableCell className="font-medium">
                          {installment.customerName}
                        </TableCell>
                        <TableCell>{installment.customerPhone}</TableCell>
                        <TableCell>
                          {Number(installment.remainingAmount).toLocaleString()} د.ع
                        </TableCell>
                        <TableCell>
                          {new Date(installment.nextPaymentDate).toLocaleDateString('ar-IQ')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">نشط</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>التقسيطات المكتملة</CardTitle>
                <CardDescription>
                  التقسيطات التي تم سدادها بالكامل
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العميل</TableHead>
                      <TableHead>رقم الهاتف</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>تاريخ الإكمال</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedInstallments.map((installment) => (
                      <TableRow
                        key={installment.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedInstallment(installment.id)}
                      >
                        <TableCell className="font-medium">
                          {installment.customerName}
                        </TableCell>
                        <TableCell>{installment.customerPhone}</TableCell>
                        <TableCell>
                          {Number(installment.totalAmount).toLocaleString()} د.ع
                        </TableCell>
                        <TableCell>
                          {new Date(installment.nextPaymentDate).toLocaleDateString('ar-IQ')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">مكتمل</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <InstallmentDetails
        installmentId={selectedInstallment}
        onClose={() => setSelectedInstallment(null)}
      />
    </div>
  );
}