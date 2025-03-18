import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Activity, 
  TrendingUp, 
  Users, 
  Share2, 
  Heart, 
  MessageCircle,
  BarChart2,
  Globe,
  Target,
  Zap,
  Eye,
  MousePointer,
  DollarSign,
  RefreshCw
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PlatformStat {
  engagement: number;
  interactions: number;
  reach: number;
  responseRate: number;
  impressions: number;
  clicks: number;
  cpc: number;
  conversions: number;
}

interface Indicator {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  change: string;
  color: string;
  progress: number;
}

const calculatePercentage = (value: number, total: number): number => {
  return total > 0 ? (value / total) * 100 : 0;
};

const calculateMetric = (stats: PlatformStat[], key: keyof PlatformStat): number => {
  return stats.reduce((acc, curr) => acc + curr[key], 0);
};

const calculateAverage = (stats: PlatformStat[], key: keyof PlatformStat): number => {
  return stats.length > 0 ? calculateMetric(stats, key) / stats.length : 0;
};

export function PerformanceIndicators() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds default

  // Fetch platform-specific analytics with configurable interval
  const { data: platformStats = [], isLoading: isStatsLoading, refetch } = useQuery<PlatformStat[]>({
    queryKey: ["/api/marketing/platform-stats"],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const createIndicators = (stats: PlatformStat[]): Indicator[] => [
    {
      title: "معدل المشاركة",
      icon: Share2,
      value: `${calculateAverage(stats, 'engagement').toFixed(2)}%`,
      change: "+12.3%",
      color: "text-blue-600",
      progress: calculatePercentage(calculateMetric(stats, 'engagement'), stats.length * 100)
    },
    {
      title: "معدل التفاعل",
      icon: Heart,
      value: `${calculateAverage(stats, 'interactions').toFixed(2)}%`,
      change: "+5.7%",
      color: "text-rose-500",
      progress: calculatePercentage(calculateMetric(stats, 'interactions'), stats.length * 100)
    },
    {
      title: "الوصول الكلي",
      icon: Users,
      value: calculateMetric(stats, 'reach').toLocaleString(),
      change: "+28.4%",
      color: "text-green-500",
      progress: calculatePercentage(calculateMetric(stats, 'reach'), stats.length * 1000)
    },
    {
      title: "معدل الردود",
      icon: MessageCircle,
      value: `${calculateAverage(stats, 'responseRate').toFixed(2)}%`,
      change: "+3.2%",
      color: "text-purple-500",
      progress: calculatePercentage(calculateMetric(stats, 'responseRate'), stats.length * 100)
    },
    {
      title: "الانطباعات",
      icon: Eye,
      value: calculateMetric(stats, 'impressions').toLocaleString(),
      change: "0%",
      color: "text-cyan-500",
      progress: calculatePercentage(calculateMetric(stats, 'impressions'), stats.length * 10000)
    },
    {
      title: "معدل النقر",
      icon: MousePointer,
      value: `${(calculatePercentage(calculateMetric(stats, 'clicks'), calculateMetric(stats, 'impressions'))).toFixed(2)}%`,
      change: "0%",
      color: "text-amber-500",
      progress: calculatePercentage(calculateMetric(stats, 'clicks'), calculateMetric(stats, 'impressions'))
    },
    {
      title: "تكلفة النقرة",
      icon: DollarSign,
      value: `$${calculateAverage(stats, 'cpc').toFixed(2)}`,
      change: "0%",
      color: "text-emerald-500",
      progress: calculatePercentage(calculateMetric(stats, 'cpc'), stats.length)
    },
    {
      title: "معدل التحويل",
      icon: Target,
      value: `${(calculatePercentage(calculateMetric(stats, 'conversions'), calculateMetric(stats, 'clicks'))).toFixed(2)}%`,
      change: "0%",
      color: "text-indigo-500",
      progress: calculatePercentage(calculateMetric(stats, 'conversions'), calculateMetric(stats, 'clicks'))
    }
  ];

  const indicators = createIndicators(platformStats);

  const socialPlatforms = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok', 'Snapchat'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">مؤشرات الأداء</h2>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "gap-2",
              autoRefresh && "text-green-500 border-green-500"
            )}
          >
            <RefreshCw className={cn("h-4 w-4", autoRefresh && "animate-spin")} />
            {autoRefresh ? "إيقاف التحديث التلقائي" : "تفعيل التحديث التلقائي"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isStatsLoading}
          >
            تحديث يدوي
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {indicators.map((indicator, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {indicator.title}
              </CardTitle>
              <indicator.icon className={`h-4 w-4 ${indicator.color}`} />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{indicator.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  {indicator.change} من الشهر الماضي
                </div>
                <Progress 
                  value={indicator.progress} 
                  className="h-1" 
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform Activity Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {socialPlatforms.map((platform) => (
          <Card key={platform} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {platform}
              </CardTitle>
              <Globe className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">النشاط</span>
                  <Zap className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">المشاهدات:</span>
                    <span className="ml-1">{Math.floor(Math.random() * 1000)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">التفاعلات:</span>
                    <span className="ml-1">{Math.floor(Math.random() * 100)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">النقرات:</span>
                    <span className="ml-1">{Math.floor(Math.random() * 50)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">المشاركات:</span>
                    <span className="ml-1">{Math.floor(Math.random() * 20)}</span>
                  </div>
                </div>
                <Progress 
                  value={Math.random() * 100} 
                  className="h-1" 
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {autoRefresh ? "تحديث تلقائي" : "آخر تحديث منذ دقيقة"}
                  </span>
                  <Activity className={cn(
                    "h-3 w-3",
                    autoRefresh ? "text-green-500" : "text-yellow-500"
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}