import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ExchangeRate } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ExchangeRateCard() {
  const { toast } = useToast();
  const [newRate, setNewRate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: exchangeRate, refetch } = useQuery<ExchangeRate>({
    queryKey: ["/api/exchange-rate"],
    staleTime: 0,
    refetchInterval: 5000,
  });

  async function updateRate() {
    if (!newRate) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال سعر الصرف الجديد",
        variant: "destructive",
      });
      return;
    }

    const rateNumber = Number(newRate);
    if (isNaN(rateNumber) || rateNumber <= 0) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال رقم صحيح وموجب",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await apiRequest("POST", "/api/exchange-rate", {
        usdToIqd: rateNumber
      });

      // تحديث البيانات مباشرة
      await refetch();

      // إلغاء صلاحية جميع الاستعلامات المتعلقة بالأسعار
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/exchange-rate"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/products"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/sales"] }),
      ]);

      setNewRate("");

      toast({
        title: "تم التحديث",
        description: "تم تحديث سعر الصرف بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تحديث سعر الصرف. الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">سعر صرف الدولار</CardTitle>
        <RefreshCw className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-2xl font-bold">
            1 دولار = {exchangeRate?.usdToIqd} دينار عراقي
          </div>
          <p className="text-xs text-muted-foreground">
            آخر تحديث: {exchangeRate ? new Date(exchangeRate.date).toLocaleString('ar-IQ') : '-'}
          </p>

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="أدخل السعر الجديد"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
            />
            <Button onClick={updateRate} disabled={isUpdating}>
              {isUpdating ? "جاري التحديث..." : "تحديث"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}