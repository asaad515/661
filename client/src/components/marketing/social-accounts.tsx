import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SocialMediaAccount } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  SiFacebook,
  SiInstagram,
  SiX,
  SiLinkedin,
  SiSnapchat,
  SiTiktok,
} from "react-icons/si";

const platformIcons = {
  facebook: SiFacebook,
  instagram: SiInstagram,
  twitter: SiX,
  linkedin: SiLinkedin,
  snapchat: SiSnapchat,
  tiktok: SiTiktok,
};

const platformConfig = {
  facebook: {
    label: "فيسبوك",
    authUrl: "https://www.facebook.com/login",
    color: "#1877F2",
    hoverColor: "#1559b7",
    textColor: "white"
  },
  instagram: {
    label: "انستغرام",
    authUrl: "https://www.instagram.com/accounts/login",
    color: "linear-gradient(45deg, #833AB4, #C13584, #E1306C, #FD1D1D)",
    hoverColor: "linear-gradient(45deg, #6d2e94, #a02d6e, #bc285a, #d41919)",
    textColor: "white"
  },
  twitter: {
    label: "تويتر",
    authUrl: "https://twitter.com/login",
    color: "#1DA1F2",
    hoverColor: "#1884c7",
    textColor: "white"
  },
  linkedin: {
    label: "لينكد إن",
    authUrl: "https://www.linkedin.com/login",
    color: "#0A66C2",
    hoverColor: "#084d94",
    textColor: "white"
  },
  snapchat: {
    label: "سناب شات",
    authUrl: "https://accounts.snapchat.com/accounts/login",
    color: "#FFFC00",
    hoverColor: "#e6e300",
    textColor: "black"
  },
  tiktok: {
    label: "تيك توك",
    authUrl: "https://www.tiktok.com/login",
    color: "linear-gradient(90deg, #00f2ea, #ff0050)",
    hoverColor: "linear-gradient(90deg, #00d6cf, #e6004a)",
    textColor: "white"
  },
};

export default function SocialAccounts() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState<{[key: string]: boolean}>({});

  const { data: accounts = [] } = useQuery<SocialMediaAccount[]>({
    queryKey: ["/api/marketing/social-accounts"],
  });

  const connectPlatform = async (platform: string) => {
    const config = platformConfig[platform as keyof typeof platformConfig];
    if (!config) return;

    // فتح نافذة تسجيل الدخول بدون شريط العنوان والأزرار
    const popup = window.open(
      config.authUrl,
      'تسجيل الدخول',
      'popup=true,menubar=no,toolbar=no,location=no,status=no,width=600,height=700'
    );

    if (popup) {
      // التأكد من أن النافذة في المنتصف
      const left = (window.screen.width - 600) / 2;
      const top = (window.screen.height - 700) / 2;
      popup.moveTo(left, top);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>حسابات التواصل الاجتماعي</CardTitle>
        <CardDescription>
          قم بتسجيل الدخول إلى حساباتك على منصات التواصل الاجتماعي
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(platformConfig).map(([platform, config]) => {
            const Icon = platformIcons[platform as keyof typeof platformIcons];

            return (
              <div
                key={platform}
                className="flex flex-col items-center p-4 border rounded-lg space-y-4"
                style={{
                  background: config.color,
                  transition: "all 0.3s ease"
                }}
              >
                <Icon className="h-8 w-8" style={{ color: config.textColor }} />
                <h3 className="font-medium" style={{ color: config.textColor }}>
                  {config.label}
                </h3>
                <Button
                  className="hover:opacity-90 transition-opacity"
                  style={{
                    background: "transparent",
                    border: `2px solid ${config.textColor}`,
                    color: config.textColor
                  }}
                  onClick={() => connectPlatform(platform)}
                >
                  تسجيل الدخول
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}