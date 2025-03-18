import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { Installment, InstallmentPayment } from "@shared/schema";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInstallmentPaymentSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface InstallmentDetailsProps {
  installmentId: number | null;
  onClose: () => void;
}

export default function InstallmentDetails({
  installmentId,
  onClose,
}: InstallmentDetailsProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: installment } = useQuery<Installment>({
    queryKey: ["/api/installments", installmentId],
    enabled: !!installmentId,
  });

  const { data: payments = [] } = useQuery<InstallmentPayment[]>({
    queryKey: ["/api/installments", installmentId, "payments"],
    enabled: !!installmentId,
  });

  const form = useForm({
    resolver: zodResolver(insertInstallmentPaymentSchema),
    defaultValues: {
      amount: 0,
      notes: "",
    },
  });

  const monthlyPayment = useMemo(() => {
    if (!installment) return 0;
    return Number(installment.totalAmount) / installment.numberOfPayments;
  }, [installment]);

  async function onSubmit(data: any) {
    if (!installmentId) return;

    setIsSubmitting(true);
    try {
      await apiRequest("POST", `/api/installments/${installmentId}/payments`, {
        amount: Number(data.amount),
        notes: data.notes,
      });

      // تحديث البيانات
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/installments"] }),
        queryClient.invalidateQueries({
          queryKey: ["/api/installments", installmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["/api/installments", installmentId, "payments"],
        }),
      ]);

      form.reset();

      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الدفعة بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تسجيل الدفعة",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!installment) return null;

  return (
    <Sheet open={!!installmentId} onOpenChange={() => onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>تفاصيل التقسيط</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات العميل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">اسم العميل:</span>
                <span className="font-medium">{installment.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">رقم الهاتف:</span>
                <span className="font-medium">{installment.customerPhone}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تفاصيل التقسيط</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المبلغ الإجمالي:</span>
                <span className="font-medium">
                  {Number(installment.totalAmount).toLocaleString()} د.ع
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المبلغ المتبقي:</span>
                <span className="font-medium">
                  {Number(installment.remainingAmount).toLocaleString()} د.ع
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">عدد الأقساط:</span>
                <span className="font-medium">{installment.numberOfPayments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">القسط الشهري:</span>
                <span className="font-medium">
                  {monthlyPayment.toLocaleString()} د.ع
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">تاريخ البدء:</span>
                <span className="font-medium">
                  {new Date(installment.startDate).toLocaleDateString('ar-IQ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">موعد القسط القادم:</span>
                <span className="font-medium">
                  {new Date(installment.nextPaymentDate).toLocaleDateString('ar-IQ')}
                </span>
              </div>
            </CardContent>
          </Card>

          {installment.status === "active" && (
            <Card>
              <CardHeader>
                <CardTitle>تسجيل دفعة جديدة</CardTitle>
                <CardDescription>
                  قم بتسجيل دفعة جديدة للتقسيط
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المبلغ</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ملاحظات</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w

-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "جاري التسجيل..." : "تسجيل الدفعة"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>سجل المدفوعات</CardTitle>
              <CardDescription>
                جميع المدفوعات المسجلة لهذا التقسيط
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {Number(payment.amount).toLocaleString()} د.ع
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.paymentDate).toLocaleDateString('ar-IQ')}
                      </p>
                      {payment.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {payment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
