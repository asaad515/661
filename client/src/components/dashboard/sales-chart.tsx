import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Sale } from "@shared/schema";

export default function SalesChart() {
  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  // تجميع المبيعات حسب التاريخ بالدينار العراقي
  const salesByDate = sales.reduce((acc, sale) => {
    const date = new Date(sale.date).toLocaleDateString('ar-IQ');
    const amount = Number(sale.priceIqd) * sale.quantity;

    acc[date] = (acc[date] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(salesByDate)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, total]) => ({
      date,
      total,
    }));

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>نظرة عامة على المبيعات</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value.toLocaleString()} د.ع`}
            />
            <Tooltip 
              formatter={(value: number) => [`${value.toLocaleString()} د.ع`, "المبيعات"]}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}