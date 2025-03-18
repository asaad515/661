import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Product, Sale, Customer } from "@shared/schema";

export default function StatsCards() {
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // حساب إجمالي المبيعات بالدينار العراقي
  const totalSales = sales.reduce((sum, sale) => {
    return sum + Number(sale.priceIqd) * sale.quantity;
  }, 0);

  // حساب النمو في المبيعات مقارنة بالشهر الماضي
  const currentMonthSales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    const now = new Date();
    return saleDate.getMonth() === now.getMonth() && 
           saleDate.getFullYear() === now.getFullYear();
  }).reduce((sum, sale) => sum + Number(sale.priceIqd) * sale.quantity, 0);

  const lastMonthSales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return saleDate.getMonth() === lastMonth && 
           saleDate.getFullYear() === lastMonthYear;
  }).reduce((sum, sale) => sum + Number(sale.priceIqd) * sale.quantity, 0);

  const salesGrowth = lastMonthSales === 0 ? 100 : 
    ((currentMonthSales - lastMonthSales) / lastMonthSales) * 100;

  const totalProducts = products.length;
  const lowStock = products.filter(p => p.stock < 10).length;
  const totalTransactions = sales.length;

  // حساب نمو المعاملات مقارنة بالساعة الماضية
  const currentHourTransactions = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    const now = new Date();
    return saleDate.getHours() === now.getHours() &&
           saleDate.getDate() === now.getDate() &&
           saleDate.getMonth() === now.getMonth() &&
           saleDate.getFullYear() === now.getFullYear();
  }).length;

  const lastHourTransactions = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    const now = new Date();
    const lastHour = now.getHours() === 0 ? 23 : now.getHours() - 1;
    return saleDate.getHours() === lastHour &&
           saleDate.getDate() === now.getDate() &&
           saleDate.getMonth() === now.getMonth() &&
           saleDate.getFullYear() === now.getFullYear();
  }).length;

  const transactionGrowth = currentHourTransactions - lastHourTransactions;

  // حساب العملاء النشطين (الذين لديهم مشتريات هذا الشهر)
  const activeCustomers = new Set(
    sales
      .filter(sale => {
        const saleDate = new Date(sale.date);
        const now = new Date();
        return saleDate.getMonth() === now.getMonth() && 
               saleDate.getFullYear() === now.getFullYear();
      })
      .map(sale => sale.customerId)
  ).size;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSales.toLocaleString()} د.ع</div>
          <p className="text-xs text-muted-foreground">
            {salesGrowth >= 0 ? "+" : ""}{salesGrowth.toFixed(1)}% عن الشهر الماضي
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">المنتجات</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProducts}</div>
          <p className="text-xs text-muted-foreground">
            {lowStock} منتجات منخفضة المخزون
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">المبيعات</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTransactions}</div>
          <p className="text-xs text-muted-foreground">
            {transactionGrowth >= 0 ? "+" : ""}{transactionGrowth} منذ الساعة الماضية
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">العملاء النشطون</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeCustomers}</div>
          <p className="text-xs text-muted-foreground">
            عملاء نشطون هذا الشهر
          </p>
        </CardContent>
      </Card>
    </div>
  );
}