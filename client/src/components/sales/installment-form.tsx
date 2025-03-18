import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInstallmentSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { addMonths } from "date-fns";

interface InstallmentFormProps {
  saleId: number;
  totalAmount: number;
  onSuccess: () => void;
}

export default function InstallmentForm({ saleId, totalAmount, onSuccess }: InstallmentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertInstallmentSchema),
    defaultValues: {
      saleId,
      totalAmount,
      customerName: "",
      customerPhone: "",
      numberOfPayments: 3,
      nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      remainingAmount: totalAmount,
    },
  });

  async function onSubmit(data: any) {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/installments", {
        ...data,
        nextPaymentDate: new Date(data.nextPaymentDate),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/installments"] });
      
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء التقسيط بنجاح",
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقسيط",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const monthlyPayment = totalAmount / form.watch("numberOfPayments");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم العميل</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customerPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رقم الهاتف</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="numberOfPayments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>عدد الأقساط</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <div className="text-sm text-muted-foreground">
                القسط الشهري: {monthlyPayment.toLocaleString()} د.ع
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nextPaymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تاريخ أول قسط</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "جاري الإنشاء..." : "إنشاء التقسيط"}
        </Button>
      </form>
    </Form>
  );
}
