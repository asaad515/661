import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, TrendingUp, Users, DollarSign } from "lucide-react";
import type { Campaign } from "@shared/schema";
import type { SocialMediaAccount } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import CampaignForm from "@/components/marketing/campaign-form";
import SocialAccounts from "@/components/marketing/social-accounts";
import { PlatformPerformanceGraphs } from "@/components/marketing/analytics-graphs";
import { PerformanceIndicators } from "@/components/marketing/performance-indicators";

// تعريف نوع البيانات للإحصائيات الاجتماعية
type SocialStats = {
  impressions: number;
  engagement: number;
  spend: number;
};

export default function MarketingPage() {
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/marketing/campaigns"],
  });

  const { data: accounts = [] } = useQuery<SocialMediaAccount[]>({
    queryKey: ["/api/marketing/social-accounts"],
  });

  // تصفية الحملات النشطة
  const activeCampaigns = campaigns.filter(campaign => campaign.status === "active");

  // تجميع الإحصائيات من API منصات التواصل الاجتماعي
  const { data: socialStats = { impressions: 0, engagement: 0, spend: 0 } } = useQuery<SocialStats>({
    queryKey: ["/api/marketing/social-stats"],
    refetchInterval: 300000, // تحديث كل 5 دقائق
  });

  return (
    <div className="flex h-screen">
      <div className="w-64 h-full">
        <Sidebar />
      </div>
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Megaphone className="h-6 w-6" />
              <h1 className="text-3xl font-bold">التسويق</h1>
            </div>
            <Dialog open={showNewCampaign} onOpenChange={setShowNewCampaign}>
              <DialogTrigger asChild>
                <Button>
                  إنشاء حملة إعلانية جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>إنشاء حملة إعلانية جديدة</DialogTitle>
                  <DialogDescription>
                    اختر المنصة التي تريد إنشاء حملة إعلانية عليها
                  </DialogDescription>
                </DialogHeader>
                <CampaignForm />
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-6">
            <SocialAccounts />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    الحملات النشطة
                  </CardTitle>
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeCampaigns.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    إجمالي الانطباعات
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {socialStats.impressions.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    معدل التفاعل
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(socialStats.engagement * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    إجمالي الإنفاق
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${socialStats.spend.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* مؤشرات الأداء */}
            <PerformanceIndicators />

            {/* الرسوم البيانية للتحليلات */}
            <PlatformPerformanceGraphs />

            {/* قائمة الحملات النشطة */}
            <Card>
              <CardHeader>
                <CardTitle>الحملات النشطة</CardTitle>
                <CardDescription>
                  قائمة بجميع الحملات الإعلانية النشطة حالياً
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeCampaigns.map(campaign => (
                    <Card key={campaign.id}>
                      <CardHeader>
                        <CardTitle>{campaign.name}</CardTitle>
                        <CardDescription>{campaign.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">المنصات</p>
                            <p>{campaign.platforms.join(", ")}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">الميزانية</p>
                            <p>${Number(campaign.budget).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">تاريخ البدء</p>
                            <p>{new Date(campaign.startDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}