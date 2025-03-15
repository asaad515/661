import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LiveNotifications } from '../ui/live-notifications';
import { LineChart, BarChart } from '@tremor/react';
import { useQuery } from '@tanstack/react-query';

interface MetricData {
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    timestamp: Date;
  };
  cpu: {
    user: number;
    system: number;
    timestamp: Date;
  };
  database: {
    responseTime: number;
    status: string;
    timestamp: Date;
  };
  cache: {
    hits: number;
    misses: number;
    keys: number;
    timestamp: Date;
  };
}

export function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [activeTab, setActiveTab] = useState('system');

  // جلب الإحصائيات
  const { data: systemStats } = useQuery({
    queryKey: ['systemStats'],
    queryFn: () => fetch('/api/monitoring/stats').then(res => res.json()),
    refetchInterval: 60000, // تحديث كل دقيقة
  });

  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:5000');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'metrics') {
        setMetrics(data.metrics);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="space-y-4 p-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">لوحة المراقبة</h2>
        <LiveNotifications />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>الذاكرة</CardTitle>
            <CardDescription>استخدام الذاكرة الحالي</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.memory && (
              <>
                <div className="text-2xl font-bold">
                  {Math.round((metrics.memory.heapUsed / metrics.memory.heapTotal) * 100)}%
                </div>
                <Progress 
                  value={(metrics.memory.heapUsed / metrics.memory.heapTotal) * 100} 
                  className="mt-2"
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المعالج</CardTitle>
            <CardDescription>استخدام المعالج</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.cpu && (
              <>
                <div className="text-2xl font-bold">
                  {Math.round((metrics.cpu.user + metrics.cpu.system) / 1000000)}%
                </div>
                <Progress 
                  value={(metrics.cpu.user + metrics.cpu.system) / 1000000}
                  className="mt-2" 
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>قاعدة البيانات</CardTitle>
            <CardDescription>زمن الاستجابة</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.database && (
              <>
                <div className="text-2xl font-bold">
                  {metrics.database.responseTime}ms
                </div>
                <div className={`mt-2 text-sm ${
                  metrics.database.status === 'healthy' 
                    ? 'text-green-500' 
                    : 'text-red-500'
                }`}>
                  {metrics.database.status === 'healthy' ? 'متصل' : 'غير متصل'}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الذاكرة المؤقتة</CardTitle>
            <CardDescription>نسبة النجاح</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.cache && (
              <>
                <div className="text-2xl font-bold">
                  {Math.round(
                    (metrics.cache.hits / (metrics.cache.hits + metrics.cache.misses)) * 100
                  )}%
                </div>
                <div className="mt-2 text-sm">
                  {metrics.cache.keys} عناصر مخزنة
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="system">أداء النظام</TabsTrigger>
          <TabsTrigger value="usage">الاستخدام</TabsTrigger>
          <TabsTrigger value="errors">الأخطاء</TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>أداء النظام خلال آخر 24 ساعة</CardTitle>
            </CardHeader>
            <CardContent>
              {systemStats?.performance && (
                <LineChart
                  data={systemStats.performance}
                  index="timestamp"
                  categories={['memory', 'cpu', 'responseTime']}
                  colors={['blue', 'green', 'yellow']}
                  valueFormatter={(value) => `${value}%`}
                  yAxisWidth={40}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات الاستخدام</CardTitle>
            </CardHeader>
            <CardContent>
              {systemStats?.usage && (
                <BarChart
                  data={systemStats.usage}
                  index="hour"
                  categories={['requests', 'users']}
                  colors={['blue', 'green']}
                  valueFormatter={(value) => value.toString()}
                  yAxisWidth={40}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>معدل الأخطاء</CardTitle>
            </CardHeader>
            <CardContent>
              {systemStats?.errors && (
                <LineChart
                  data={systemStats.errors}
                  index="timestamp"
                  categories={['count']}
                  colors={['red']}
                  valueFormatter={(value) => value.toString()}
                  yAxisWidth={40}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}