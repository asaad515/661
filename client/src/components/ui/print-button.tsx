import { useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Printer, Settings2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnimatedIcon } from "@/components/ui/animated-icon";

interface PrintButtonProps {
  onPrint: () => void;
  onSettingsChange?: (settings: PrintSettings) => void;
  loading?: boolean;
}

export interface PrintSettings {
  showLogo: boolean;
  showHeader: boolean;
  showFooter: boolean;
  pageSize: "A4" | "A5" | "Letter";
}

export function PrintButton({
  onPrint,
  onSettingsChange,
  loading = false,
}: PrintButtonProps) {
  const [settings, setSettings] = useState<PrintSettings>({
    showLogo: true,
    showHeader: true,
    showFooter: true,
    pageSize: "A4",
  });

  const handleSettingChange = (key: keyof PrintSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={loading}
        >
          {loading ? (
            <AnimatedIcon animation="spin" size="sm">
              <Settings2 className="h-4 w-4" />
            </AnimatedIcon>
          ) : (
            <Printer className="h-4 w-4" />
          )}
          طباعة
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>إعدادات الطباعة</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleSettingChange("showLogo", !settings.showLogo)}
        >
          <input
            type="checkbox"
            checked={settings.showLogo}
            className="ml-2"
            readOnly
          />
          إظهار الشعار
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSettingChange("showHeader", !settings.showHeader)}
        >
          <input
            type="checkbox"
            checked={settings.showHeader}
            className="ml-2"
            readOnly
          />
          إظهار الترويسة
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSettingChange("showFooter", !settings.showFooter)}
        >
          <input
            type="checkbox"
            checked={settings.showFooter}
            className="ml-2"
            readOnly
          />
          إظهار التذييل
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>حجم الورق</DropdownMenuLabel>
        {["A4", "A5", "Letter"].map((size) => (
          <DropdownMenuItem
            key={size}
            onClick={() => handleSettingChange("pageSize", size)}
          >
            <input
              type="radio"
              checked={settings.pageSize === size}
              className="ml-2"
              readOnly
            />
            {size}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onPrint}
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          طباعة الآن
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
