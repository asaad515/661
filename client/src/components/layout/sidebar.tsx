import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  MdDashboard,
  MdInventory2,
  MdPointOfSale,
  MdPeople,
  MdReceipt,
  MdCalendarMonth,
  MdCampaign,
  MdBarChart,
  MdAccountBalance,
  MdLocalShipping,
  MdQrCode2,
  MdLocalOffer,
  MdSupervisorAccount,
  MdSettings,
  MdAssignment,
  MdPalette,
} from "react-icons/md";

const navigation = [
  { name: "لوحة التحكم", href: "/", icon: MdDashboard, color: "#4285F4" },
  { name: "البيع السريع", href: "/quick-sales", icon: MdPointOfSale, color: "#34A853" },
  { name: "المواعيد", href: "/appointments", icon: MdCalendarMonth, color: "#EA4335" },
  { name: "المخزون", href: "/inventory", icon: MdInventory2, color: "#34A853" },
  { name: "المبيعات", href: "/sales", icon: MdPointOfSale, color: "#EA4335" },
  { name: "العملاء", href: "/customers", icon: MdPeople, color: "#FBBC05" },
  { name: "الفواتير", href: "/invoices", icon: MdReceipt, color: "#4285F4" },
  { name: "المرتجعات", href: "/returns", icon: MdAssignment, color: "#EA4335" },
  { name: "التقسيط", href: "/installments", icon: MdCalendarMonth, color: "#34A853" },
  { name: "التسويق", href: "/marketing", icon: MdCampaign, color: "#EA4335" },
  { name: "التقارير", href: "/reports", icon: MdBarChart, color: "#FBBC05" },
  { name: "المصروفات", href: "/expenses", icon: MdAccountBalance, color: "#4285F4" },
  { name: "الموردين", href: "/suppliers", icon: MdLocalShipping, color: "#34A853" },
  { name: "الباركود", href: "/barcodes", icon: MdQrCode2, color: "#EA4335" },
  { name: "أكواد الخصم", href: "/discount-codes", icon: MdLocalOffer, color: "#FBBC05" },
  { name: "الموظفين", href: "/staff", icon: MdSupervisorAccount, color: "#4285F4" },
  { name: "الأيقونات", href: "/icons", icon: MdPalette, color: "#FBBC05" },
  { name: "الإعدادات", href: "/settings", icon: MdSettings, color: "#34A853" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  return (
    <div className="flex flex-col h-full bg-white border-l">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-base font-medium text-black">
              نظام إدارة الأعمال
            </h1>
            <p className="text-xs text-gray-600">
              مرحباً, {user?.username}
            </p>
          </div>
          <NotificationBell />
        </div>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-10 px-3 text-sm font-normal",
                    location === item.href
                      ? "bg-gray-100 text-black"
                      : "text-black hover:bg-gray-50"
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <Icon
                      className="h-5 w-5"
                      style={{ color: item.color }}
                    />
                    {item.name}
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full h-10 text-sm font-normal text-black hover:bg-gray-50"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="h-5 w-5 ml-3" style={{ color: "#EA4335" }} />
          تسجيل خروج
        </Button>
      </div>
    </div>
  );
}