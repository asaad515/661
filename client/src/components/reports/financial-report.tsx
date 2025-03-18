
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface FinancialData {
  revenue: number;
  costs: number;
  netProfit: number;
  capital: number;
  remainingCapital: number;
  salesCount: number;
}

export function FinancialReport() {
  const [startDate] = useState(new Date(new Date().setDate(1))); // أول الشهر
  const [endDate] = useState(new Date()); // اليوم

  const { data: financialData, isLoading } = useQuery<FinancialData>({
    queryKey: [
      "/api/reports/financial",
      {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      },
    ],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>إجمالي المبيعات</CardTitle>
          <CardDescription>إجمالي قيمة المبيعات</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{financialData?.revenue.toLocaleString()} د.ع</p>
          <p className="text-sm text-muted-foreground">عدد المبيعات: {financialData?.salesCount}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>صافي الربح</CardTitle>
          <CardDescription>الربح بعد خصم التكاليف</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{financialData?.netProfit.toLocaleString()} د.ع</p>
          <p className="text-sm text-muted-foreground">
            نسبة الربح: {((financialData?.netProfit || 0) / (financialData?.revenue || 1) * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>رأس المال المتبقي</CardTitle>
          <CardDescription>رأس المال المتاح للاستثمار</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{financialData?.remainingCapital.toLocaleString()} د.ع</p>
          <p className="text-sm text-muted-foreground">
            من أصل: {financialData?.capital.toLocaleString()} د.ع
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
