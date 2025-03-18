import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ComposedChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import type { Sale, Product, Customer } from "@shared/schema";
import { cn } from "@/lib/utils";

const colorSchemes = {
  default: {
    primary: 'hsl(var(--primary))',
    secondary: '#82ca9d',
    tertiary: '#ffc658',
    background: 'hsl(var(--background))'
  },
  warm: {
    primary: '#ff7300',
    secondary: '#ff9800',
    tertiary: '#ffc107',
    background: '#fff5e6'
  },
  cool: {
    primary: '#00bcd4',
    secondary: '#03a9f4',
    tertiary: '#2196f3',
    background: '#e1f5fe'
  }
} as const;

type ColorScheme = keyof typeof colorSchemes;

export function SalesTrendsChart() {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [updateInterval, setUpdateInterval] = useState(30000);
  const [chartType, setChartType] = useState<'area' | 'line' | 'composed'>('area');

  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
    refetchInterval: updateInterval,
  });

  // تجميع المبيعات حسب اليوم مع تنبؤات مستقبلية
  const chartData = useMemo(() => {
    const dailySales = sales.reduce((acc: any[], sale, index) => {
      // إضافة الفهرس للمفتاح لضمان تفردها
      const uniqueKey = `sale-${index}-${Date.now()}`;
      const date = new Date(sale.date).toLocaleDateString('ar-IQ');
      const existingDay = acc.find(d => d.date === date);

      if (existingDay) {
        existingDay.amount += Number(sale.priceIqd) * sale.quantity;
        existingDay.count += 1;
        existingDay.avgOrder = existingDay.amount / existingDay.count;
      } else {
        acc.push({
          date,
          amount: Number(sale.priceIqd) * sale.quantity,
          count: 1,
          avgOrder: Number(sale.priceIqd) * sale.quantity
        });
      }
      return acc;
    }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // إضافة تنبؤات بسيطة للأيام القادمة
    const lastAmount = dailySales[dailySales.length - 1]?.amount || 0;
    const growth = 0.05; // معدل نمو افتراضي 5%

    for (let i = 1; i <= 7; i++) {
      const lastDate = new Date(dailySales[dailySales.length - 1]?.date);
      lastDate.setDate(lastDate.getDate() + 1);

      dailySales.push({
        date: lastDate.toLocaleDateString('ar-IQ'),
        predictedAmount: lastAmount * (1 + growth * i),
        isPrediction: true
      });
    }

    return dailySales;
  }, [sales]);

  const colors = colorSchemes[colorScheme];

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `${value.toLocaleString()} د.ع`}
              labelFormatter={(label) => `التاريخ: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="amount"
              name="المبيعات"
              stroke={colors.primary}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="predictedAmount"
              name="التنبؤات"
              stroke={colors.tertiary}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
            />
            <Brush dataKey="date" height={30} stroke={colors.primary} />
          </LineChart>
        );

      case 'composed':
        return (
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `${value.toLocaleString()} د.ع`}
              labelFormatter={(label) => `التاريخ: ${label}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="amount"
              name="المبيعات"
              fill={colors.primary}
              fillOpacity={0.3}
              stroke={colors.primary}
            />
            <Bar
              dataKey="count"
              name="عدد الطلبات"
              fill={colors.secondary}
              barSize={20}
            />
            <Line
              type="monotone"
              dataKey="avgOrder"
              name="متوسط الطلب"
              stroke={colors.tertiary}
              strokeWidth={2}
            />
            <Scatter
              dataKey="predictedAmount"
              name="التنبؤات"
              fill={colors.tertiary}
            />
          </ComposedChart>
        );

      default:
        return (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `${value.toLocaleString()} د.ع`}
              labelFormatter={(label) => `التاريخ: ${label}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="amount"
              name="المبيعات"
              stroke={colors.primary}
              fillOpacity={1}
              fill="url(#colorAmount)"
            />
            <Area
              type="monotone"
              dataKey="predictedAmount"
              name="التنبؤات"
              stroke={colors.tertiary}
              strokeDasharray="5 5"
              fill={colors.tertiary}
              fillOpacity={0.1}
            />
          </AreaChart>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>اتجاهات المبيعات</CardTitle>
            <CardDescription>
              تحليل المبيعات اليومية والتنبؤات المستقبلية
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={colorScheme}
              onValueChange={(value: ColorScheme) => setColorScheme(value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="نمط الألوان" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">الافتراضي</SelectItem>
                <SelectItem value="warm">دافئ</SelectItem>
                <SelectItem value="cool">بارد</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={updateInterval.toString()}
              onValueChange={(value) => setUpdateInterval(Number(value))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="فترة التحديث" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5000">كل 5 ثواني</SelectItem>
                <SelectItem value="30000">كل 30 ثانية</SelectItem>
                <SelectItem value="60000">كل دقيقة</SelectItem>
              </SelectContent>
            </Select>

            <Tabs value={chartType} onValueChange={(value: typeof chartType) => setChartType(value)}>
              <TabsList>
                <TabsTrigger value="area">مساحي</TabsTrigger>
                <TabsTrigger value="line">خطي</TabsTrigger>
                <TabsTrigger value="composed">مركب</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductPerformanceChart() {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [updateInterval, setUpdateInterval] = useState(30000);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    refetchInterval: updateInterval,
  });

  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  // تحليل أداء المنتجات
  const productPerformance = useMemo(() => {
    return products.map(product => {
      const productSales = sales.filter(sale => sale.productId === product.id);
      const totalQuantity = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
      const totalRevenue = productSales.reduce((sum, sale) => 
        sum + (Number(sale.priceIqd) * sale.quantity), 0
      );

      return {
        name: product.name,
        quantity: totalQuantity,
        revenue: totalRevenue,
        stock: product.stock
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [products, sales]);

  const colors = colorSchemes[colorScheme];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>أداء المنتجات</CardTitle>
          <CardDescription>
            أفضل 5 منتجات من حيث المبيعات
          </CardDescription>
          <Select
            value={colorScheme}
            onValueChange={(value: ColorScheme) => setColorScheme(value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="نمط الألوان" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">الافتراضي</SelectItem>
              <SelectItem value="warm">دافئ</SelectItem>
              <SelectItem value="cool">بارد</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={updateInterval.toString()}
            onValueChange={(value) => setUpdateInterval(Number(value))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="فترة التحديث" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5000">كل 5 ثواني</SelectItem>
              <SelectItem value="30000">كل 30 ثانية</SelectItem>
              <SelectItem value="60000">كل دقيقة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke={colors.primary} />
              <YAxis yAxisId="right" orientation="right" stroke={colors.secondary} />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="revenue"
                name="الإيرادات"
                fill={colors.primary}
              />
              <Bar
                yAxisId="right"
                dataKey="quantity"
                name="الكمية المباعة"
                fill={colors.secondary}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function CustomerGrowthChart() {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [updateInterval, setUpdateInterval] = useState(30000);
  const [chartView, setChartView] = useState<'growth' | 'segments' | 'retention' | 'value'>('growth');

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    refetchInterval: updateInterval,
  });

  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  // تحليل نمو العملاء مع التنبؤات المستقبلية
  const customerAnalytics = useMemo(() => {
    const growthData = customers.reduce((acc: any[], customer) => {
      const date = new Date(customer.createdAt).toLocaleDateString('ar-IQ');
      const existingDay = acc.find(d => d.date === date);

      if (existingDay) {
        existingDay.total += 1;
        existingDay.active = (existingDay.active || 0) + 1;
      } else {
        acc.push({
          date,
          total: acc.length > 0 ? acc[acc.length - 1].total + 1 : 1,
          active: 1
        });
      }
      return acc;
    }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // إضافة التنبؤات المستقبلية
    const lastTotal = growthData[growthData.length - 1]?.total || 0;
    const growthRate = 0.15; // معدل نمو افتراضي 15%

    for (let i = 1; i <= 7; i++) {
      const lastDate = new Date(growthData[growthData.length - 1]?.date);
      lastDate.setDate(lastDate.getDate() + 1);

      growthData.push({
        date: lastDate.toLocaleDateString('ar-IQ'),
        predicted: Math.round(lastTotal * (1 + growthRate * i)),
        isPrediction: true
      });
    }

    // تحليل شرائح العملاء
    const segments = [
      { name: 'عملاء جدد', value: customers.filter(c => 
        new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length },
      { name: 'عملاء نشطون', value: customers.filter(c => 
        sales.some(s => s.customerId === c.id)
      ).length },
      { name: 'عملاء متكررون', value: customers.filter(c =>
        sales.filter(s => s.customerId === c.id).length > 1
      ).length },
      { name: 'عملاء مميزون', value: customers.filter(c =>
        sales.filter(s => s.customerId === c.id)
          .reduce((sum, s) => sum + (Number(s.priceIqd) * s.quantity), 0) > 1000000
      ).length }
    ];

    // تحليل معدل الاحتفاظ
    const retentionData = customers.reduce((acc: any[], customer) => {
      const monthYear = new Date(customer.createdAt).toLocaleDateString('ar-IQ', { month: 'long', year: 'numeric' });
      const existingMonth = acc.find(m => m.month === monthYear);

      if (existingMonth) {
        existingMonth.total += 1;
        existingMonth.retained = (existingMonth.retained || 0) + 
          (sales.some(s => s.customerId === customer.id) ? 1 : 0);
      } else {
        acc.push({
          month: monthYear,
          total: 1,
          retained: sales.some(s => s.customerId === customer.id) ? 1 : 0
        });
      }
      return acc;
    }, []);

    // تحليل قيمة العميل
    const customerValue = customers.map(customer => {
      const customerSales = sales.filter(s => s.customerId === customer.id);
      const totalValue = customerSales.reduce((sum, s) => 
        sum + (Number(s.priceIqd) * s.quantity), 0
      );
      const frequency = customerSales.length;
      const lastPurchase = customerSales.length > 0 
        ? new Date(Math.max(...customerSales.map(s => new Date(s.date).getTime())))
        : new Date(customer.createdAt);

      return {
        id: customer.id,
        name: customer.name,
        value: totalValue,
        frequency,
        recency: Math.round((Date.now() - lastPurchase.getTime()) / (24 * 60 * 60 * 1000))
      };
    }).sort((a, b) => b.value - a.value);

    return {
      growthData,
      segments,
      retentionData,
      customerValue
    };
  }, [customers, sales]);

  const colors = colorSchemes[colorScheme];

  const renderChart = () => {
    switch (chartView) {
      case 'segments':
        return (
          <PieChart>
            <Pie
              data={customerAnalytics.segments}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ name, value }) => `${name}: ${value}`}
            >
              {customerAnalytics.segments.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={[colors.primary, colors.secondary, colors.tertiary, colors.accent][index % 4]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );

      case 'retention':
        return (
          <ComposedChart data={customerAnalytics.retentionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" name="إجمالي العملاء" fill={colors.primary} />
            <Bar dataKey="retained" name="العملاء المحتفظ بهم" fill={colors.secondary} />
            <Line
              type="monotone"
              dataKey="retained"
              name="معدل الاحتفاظ"
              stroke={colors.tertiary}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </ComposedChart>
        );

      case 'value':
        return (
          <RadarChart outerRadius={120} data={customerAnalytics.customerValue.slice(0, 5)}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
            <Radar
              name="قيمة العميل"
              dataKey="value"
              stroke={colors.primary}
              fill={colors.primary}
              fillOpacity={0.6}
            />
            <Radar
              name="تكرار الشراء"
              dataKey="frequency"
              stroke={colors.secondary}
              fill={colors.secondary}
              fillOpacity={0.6}
            />
            <Legend />
            <Tooltip />
          </RadarChart>
        );

      default:
        return (
          <ComposedChart data={customerAnalytics.growthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="total"
              name="إجمالي العملاء"
              stroke={colors.primary}
              fill={colors.primary}
              fillOpacity={0.3}
            />
            <Bar
              dataKey="active"
              name="العملاء النشطون"
              fill={colors.secondary}
              barSize={20}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              name="التنبؤات المستقبلية"
              stroke={colors.tertiary}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
            />
            <Brush dataKey="date" height={30} stroke={colors.primary} />
          </ComposedChart>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>تحليل نمو العملاء</CardTitle>
            <CardDescription>
              تحليلات متقدمة لنمو وسلوك العملاء
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={colorScheme}
              onValueChange={(value: ColorScheme) => setColorScheme(value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="نمط الألوان" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">الافتراضي</SelectItem>
                <SelectItem value="warm">دافئ</SelectItem>
                <SelectItem value="cool">بارد</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={updateInterval.toString()}
              onValueChange={(value) => setUpdateInterval(Number(value))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="فترة التحديث" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5000">كل 5 ثواني</SelectItem>
                <SelectItem value="30000">كل 30 ثانية</SelectItem>
                <SelectItem value="60000">كل دقيقة</SelectItem>
              </SelectContent>
            </Select>

            <Tabs value={chartView} onValueChange={(value: typeof chartView) => setChartView(value)}>
              <TabsList>
                <TabsTrigger value="growth">النمو</TabsTrigger>
                <TabsTrigger value="segments">الشرائح</TabsTrigger>
                <TabsTrigger value="retention">الاحتفاظ</TabsTrigger>
                <TabsTrigger value="value">القيمة</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}