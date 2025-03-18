import { IconLibrary } from "@/components/ui/icon-library";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function IconsPage() {
  const { toast } = useToast();

  const handleIconSelect = (iconName: string) => {
    // نسخ اسم الأيقونة إلى الحافظة
    navigator.clipboard.writeText(iconName);
    toast({
      title: "تم النسخ",
      description: `تم نسخ اسم الأيقونة: ${iconName}`,
    });
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">مكتبة الأيقونات المتحركة</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>الأيقونات المتاحة</CardTitle>
        </CardHeader>
        <CardContent>
          <IconLibrary onSelect={handleIconSelect} />
        </CardContent>
      </Card>
    </div>
  );
}
