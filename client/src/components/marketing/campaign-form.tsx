import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCampaignSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const platformConfig = {
  facebook: {
    label: "فيسبوك",
    adManagerUrl: "https://www.facebook.com/adsmanager",
    color: "#1877F2",
  },
  instagram: {
    label: "انستغرام",
    adManagerUrl: "https://www.facebook.com/adsmanager",
    color: "#E1306C",
  },
  twitter: {
    label: "تويتر",
    adManagerUrl: "https://ads.twitter.com",
    color: "#1DA1F2",
  },
  linkedin: {
    label: "لينكد إن",
    adManagerUrl: "https://www.linkedin.com/campaignmanager",
    color: "#0A66C2",
  },
  snapchat: {
    label: "سناب شات",
    adManagerUrl: "https://ads.snapchat.com",
    color: "#FFFC00",
  },
  tiktok: {
    label: "تيك توك",
    adManagerUrl: "https://ads.tiktok.com",
    color: "#000000",
  },
};

export default function CampaignForm() {
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(insertCampaignSchema),
    defaultValues: {
      name: "",
      description: "",
      platforms: [],
      budget: 0,
      startDate: new Date(),
      endDate: undefined,
    },
  });

  const openAdManager = (platform: string) => {
    const config = platformConfig[platform as keyof typeof platformConfig];
    if (!config) return;

    // فتح نافذة مدير الإعلانات بدون شريط العنوان والأزرار
    const popup = window.open(
      config.adManagerUrl,
      'مدير الإعلانات',
      'popup=true,menubar=no,toolbar=no,location=no,status=no,width=1200,height=800'
    );

    if (popup) {
      // التأكد من أن النافذة في المنتصف
      const left = (window.screen.width - 1200) / 2;
      const top = (window.screen.height - 800) / 2;
      popup.moveTo(left, top);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(platformConfig).map(([platform, config]) => (
          <div
            key={platform}
            className="p-4 rounded-lg cursor-pointer transition-all duration-200 border-2"
            style={{
              backgroundColor: selectedPlatform === platform ? config.color : 'transparent',
              borderColor: config.color,
              color: selectedPlatform === platform ? 'white' : 'inherit',
            }}
            onClick={() => {
              setSelectedPlatform(platform);
              openAdManager(platform);
            }}
          >
            <h3 className="font-medium text-center">{config.label}</h3>
            <p className="text-sm text-center mt-2">
              {selectedPlatform === platform ? "تم الاختيار" : "اضغط للاختيار"}
            </p>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          اختر المنصة التي تريد إنشاء حملة إعلانية عليها
        </p>
      </div>
    </div>
  );
}