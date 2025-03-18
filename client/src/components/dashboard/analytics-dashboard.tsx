import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, Package, DollarSign, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#2563eb', '#16a34a', '#eab308', '#dc2626'];

export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState({ start: new Date(), end: new Date() });

  const { data: salesData, isLoading: isSalesLoading } = useQuery({
    queryKey: ['/api/reports/sales', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/reports/sales?startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`);
      return response.json();
    }
  });

  const { data: inventoryData, isLoading: isInventoryLoading } = useQuery({
    queryKey: ['/api/reports/inventory', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/reports/inventory?startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`);
      return response.json();
    }
  });

  const { data: customerData, isLoading: isCustomerLoading } = useQuery({
    queryKey: ['/api/reports/customers'],
    queryFn: async () => {
      const response = await fetch('/api/reports/customers');
      return response.json();
    }
  });

  const statsCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const calculateTrends = (data: any) => {
    // حساب اتجاهات البيانات والنسب المئوية للتغيير
    return {
      salesTrend: 15, // مثال - يجب حساب هذه القيم من البيانات الفعلية
      inventoryTrend: -5,
      customerTrend: 25,
      revenueTrend: 30
    };
  };

  const trends = calculateTrends(salesData);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "المبيعات",
            value: salesData?.totalSales || 0,
            trend: trends.salesTrend,
            icon: TrendingUp,
            color: "text-blue-600"
          },
          {
            title: "الإيرادات",
            value: `${(salesData?.totalRevenue || 0).toLocaleString()} د.ع`,
            trend: trends.revenueTrend,
            icon: DollarSign,
            color: "text-green-600"
          },
          {
            title: "العملاء",
            value: customerData?.totalCustomers || 0,
            trend: trends.customerTrend,
            icon: Users,
            color: "text-yellow-600"
          },
          {
            title: "المنتجات",
            value: inventoryData?.totalProducts || 0,
            trend: trends.inventoryTrend,
            icon: Package,
            color: "text-red-600"
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            variants={statsCardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                    <div className="flex items-center mt-2">
                      {stat.trend > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={stat.trend > 0 ? "text-green-500" : "text-red-500"}>
                        {Math.abs(stat.trend)}%
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full bg-opacity-10 ${stat.color.replace('text', 'bg')}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
          <TabsTrigger value="sales">المبيعات</TabsTrigger>
          <TabsTrigger value="inventory">المخزون</TabsTrigger>
          <TabsTrigger value="customers">العملاء</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle>تحليل المبيعات</CardTitle>
                <CardDescription>تحليل اتجاهات المبيعات والإيرادات</CardDescription>
              </CardHeader>
              <CardContent>
                {isSalesLoading ? (
                  <Skeleton className="w-full h-[300px]" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesData?.dailyStats || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="sales" stroke="#2563eb" name="المبيعات" />
                      <Line type="monotone" dataKey="revenue" stroke="#16a34a" name="الإيرادات" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>حالة المخزون</CardTitle>
                <CardDescription>تحليل المخزون والمنتجات</CardDescription>
              </CardHeader>
              <CardContent>
                {isInventoryLoading ? (
                  <Skeleton className="w-full h-[300px]" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={inventoryData?.movements || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="in" fill="#16a34a" name="الوارد" />
                      <Bar dataKey="out" fill="#dc2626" name="الصادر" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>تحليل العملاء</CardTitle>
                <CardDescription>تصنيف وتحليل العملاء</CardDescription>
              </CardHeader>
              <CardContent>
                {isCustomerLoading ? (
                  <Skeleton className="w-full h-[300px]" />
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium mb-4">توزيع المشتريات</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={customerData?.purchaseDistribution || []}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                          >
                            {(customerData?.purchaseDistribution || []).map((entry: any, index: number) => (
                              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-4">نمو العملاء</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={customerData?.growth || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="customers" stroke="#2563eb" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}