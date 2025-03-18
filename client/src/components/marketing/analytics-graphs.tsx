import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
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
import { cn } from "@/lib/utils";
import { useState } from "react";

// تعريف أنماط البيانات
interface PlatformStat {
  platform: string;
  impressions: number;
  engagements: number;
  reach: number;
  interactions: number;
}

interface HistoricalData {
  date: string;
  impressions: number;
  engagements: number;
  spend: number;
  platform: string;
}

// تعريف أنماط الألوان المتاحة
const colorSchemes = {
  default: {
    primary: '#8884d8',
    secondary: '#82ca9d',
    tertiary: '#ffc658'
  },
  warm: {
    primary: '#ff7300',
    secondary: '#ff9800',
    tertiary: '#ffc107'
  },
  cool: {
    primary: '#00bcd4',
    secondary: '#03a9f4',
    tertiary: '#2196f3'
  }
} as const;

interface ChartProps {
  data: PlatformStat[] | HistoricalData[];
  colorScheme?: keyof typeof colorSchemes;
  className?: string;
}

export function PlatformPerformanceGraphs() {
  const [colorScheme, setColorScheme] = useState<keyof typeof colorSchemes>('default');
  const [updateInterval, setUpdateInterval] = useState(300000); // 5 minutes default

  // Fetch platform-specific analytics with configurable interval
  const { data: platformStats = [] } = useQuery<PlatformStat[]>({
    queryKey: ["/api/marketing/platform-stats"],
    refetchInterval: updateInterval,
  });

  // Fetch historical analytics
  const { data: historicalData = [] } = useQuery<HistoricalData[]>({
    queryKey: ["/api/marketing/historical-stats"],
    refetchInterval: updateInterval,
  });

  const colors = colorSchemes[colorScheme];

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select
          value={colorScheme}
          onValueChange={(value: keyof typeof colorSchemes) => setColorScheme(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="اختر نمط الألوان" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">الألوان الافتراضية</SelectItem>
            <SelectItem value="warm">الألوان الدافئة</SelectItem>
            <SelectItem value="cool">الألوان الباردة</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={updateInterval.toString()}
          onValueChange={(value) => setUpdateInterval(Number(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="فترة التحديث" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30000">كل 30 ثانية</SelectItem>
            <SelectItem value="60000">كل دقيقة</SelectItem>
            <SelectItem value="300000">كل 5 دقائق</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>أداء المنصات</CardTitle>
            <CardDescription>
              إحصائيات حسب كل منصة تواصل اجتماعي
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {platformStats.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  لا توجد بيانات للمنصات. قم بإضافة مفاتيح API للمنصات في الإعدادات.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="platform" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="impressions" name="الانطباعات" fill={colors.primary} />
                    <Bar dataKey="engagements" name="التفاعلات" fill={colors.secondary} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>تحليل الأداء عبر الزمن</CardTitle>
            <CardDescription>
              تطور الأداء على مدار الوقت
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {historicalData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  لا توجد بيانات تاريخية. سيتم عرض البيانات عند توفرها من المنصات.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="impressions" 
                      name="الانطباعات"
                      stroke={colors.primary} 
                      fill={colors.primary} 
                      fillOpacity={0.3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="engagements" 
                      name="التفاعلات"
                      stroke={colors.secondary} 
                      fill={colors.secondary} 
                      fillOpacity={0.3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="spend" 
                      name="الإنفاق"
                      stroke={colors.tertiary} 
                      fill={colors.tertiary} 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>تحليل المنصات عبر الزمن</CardTitle>
            <CardDescription>
              مقارنة أداء المنصات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              {historicalData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  لا توجد بيانات كافية للتحليل التفصيلي.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="impressions"
                      name="الانطباعات"
                      stroke={colors.primary}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="engagements"
                      name="التفاعلات"
                      stroke={colors.secondary}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="spend"
                      name="الإنفاق"
                      stroke={colors.tertiary}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}