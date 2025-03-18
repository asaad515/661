import { useEffect, useState } from "react";
import { Check, Palette, Type, Moon, Sun, Monitor, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
// import { apiRequest } from "@/lib/queryClient"; //Removed as we are using localStorage
import { motion } from "framer-motion";

const themes = [
  {
    id: "professional",
    name: "مظهر احترافي",
    colors: {
      primary: "#2563eb",
      secondary: "#3b82f6",
      accent: "#60a5fa",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
      background: "var(--background)",
      foreground: "var(--foreground)"
    }
  },
  {
    id: "modern",
    name: "مظهر عصري",
    colors: {
      primary: "#8b5cf6",
      secondary: "#a78bfa",
      accent: "#c4b5fd",
      success: "#34d399",
      warning: "#fbbf24",
      error: "#f87171",
      background: "var(--background)",
      foreground: "var(--foreground)"
    }
  },
  {
    id: "elegant",
    name: "مظهر أنيق",
    colors: {
      primary: "#0f172a",
      secondary: "#1e293b",
      accent: "#334155",
      success: "#15803d",
      warning: "#b45309",
      error: "#b91c1c",
      background: "var(--background)",
      foreground: "var(--foreground)"
    }
  }
];

const fonts = [
  {
    id: "noto-kufi",
    name: "نوتو كوفي",
    family: "'Noto Kufi Arabic', sans-serif",
    weights: [400, 500, 700]
  },
  {
    id: "cairo",
    name: "القاهرة",
    family: "'Cairo', sans-serif",
    weights: [400, 600, 700]
  },
  {
    id: "tajawal",
    name: "طجوال",
    family: "'Tajawal', sans-serif",
    weights: [400, 500, 700]
  }
];

const fontSizes = {
  small: {
    base: 14,
    scale: 1.2,
  },
  medium: {
    base: 16,
    scale: 1.25,
  },
  large: {
    base: 18,
    scale: 1.333,
  },
  xlarge: {
    base: 20,
    scale: 1.4,
  },
};

const ThemeSettings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("theme");
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const [selectedFont, setSelectedFont] = useState(fonts[0]);
  const [fontSize, setFontSize] = useState("medium");
  const [appearance, setAppearance] = useState<"light" | "dark" | "system">("system");
  const [isLoading, setIsLoading] = useState(false);

  const applyAppearance = (mode: "light" | "dark" | "system") => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (mode === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(mode);
    }

    root.style.setProperty("--current-appearance", mode);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (appearance === "system") {
        applyAppearance("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [appearance]);

  useEffect(() => {
    const storedSettings = localStorage.getItem("themeSettings");
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      const theme = themes.find(t => t.id === settings.theme.id) || themes[0];
      const font = fonts.find(f => f.id === settings.font.id) || fonts[0];

      // تطبيق الإعدادات المحفوظة
      document.documentElement.style.setProperty("--primary-color", theme.colors.primary);
      document.documentElement.style.setProperty("--secondary-color", theme.colors.secondary);
      document.documentElement.style.setProperty("--accent-color", theme.colors.accent);
      document.documentElement.style.setProperty("--font-family", font.family);
      document.documentElement.style.setProperty("--font-size-base", `${fontSizes[settings.fontSize || "medium"].base}px`);

      setSelectedTheme(theme);
      setSelectedFont(font);
      setFontSize(settings.fontSize || "medium");
      setAppearance(settings.appearance || "system");
      applyAppearance(settings.appearance || "system");
    }
  }, []);

  const saveToLocalStorage = (settings: any) => {
    localStorage.setItem("themeSettings", JSON.stringify(settings));
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const settings = {
        theme: selectedTheme,
        font: selectedFont,
        fontSize,
        appearance,
      };

      saveToLocalStorage(settings);
      applyAppearance(appearance);

      // Request notification permission if not already granted
      if (Notification.permission !== "granted") {
        await Notification.requestPermission();
      }

      // Show notification if permission is granted
      if (Notification.permission === "granted") {
        new Notification("إعدادات المظهر", {
          body: "تم حفظ إعدادات المظهر بنجاح. سيتم تطبيقها تلقائياً في المرة القادمة.",
          //icon: "/generated-icon.png"  //Commented out as icon path may not be available in this context.
        });
      }

      toast({
        title: "تم حفظ الإعدادات",
        description: "تم تحديث مظهر التطبيق بنجاح",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto overflow-hidden">
      <CardHeader className="space-y-2 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CardTitle className="text-2xl font-bold">تخصيص المظهر</CardTitle>
          <CardDescription className="text-base">
            قم بتخصيص مظهر التطبيق حسب تفضيلاتك
          </CardDescription>
        </motion.div>
      </CardHeader>
      <CardContent className="pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 mb-8">
            {[
              { value: "theme", icon: <Palette className="w-4 h-4" />, label: "الألوان" },
              { value: "font", icon: <Type className="w-4 h-4" />, label: "الخطوط" },
              { value: "size", icon: <Plus className="w-4 h-4" />, label: "الحجم" },
              { value: "appearance", icon: <Sun className="w-4 h-4" />, label: "السطوع" }
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 py-2 px-4"
              >
                {tab.icon}
                <span className="hidden md:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <TabsContent value="theme">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themes.map((theme) => (
                  <motion.div
                    key={theme.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedTheme.id === theme.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => {
                        setSelectedTheme(theme);
                        document.documentElement.style.setProperty("--primary-color", theme.colors.primary);
                        document.documentElement.style.setProperty("--secondary-color", theme.colors.secondary);
                        document.documentElement.style.setProperty("--accent-color", theme.colors.accent);
                      }}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-medium">{theme.name}</CardTitle>
                          {selectedTheme.id === theme.id && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex gap-2">
                          {Object.entries(theme.colors).map(([key, color]) => (
                            <div
                              key={key}
                              className="w-8 h-8 rounded-full shadow-inner"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="font">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fonts.map((font) => (
                  <motion.div
                    key={font.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedFont.id === font.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => {
                        setSelectedFont(font);
                        document.documentElement.style.setProperty("--font-family", font.family);
                      }}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-medium">{font.name}</CardTitle>
                          {selectedFont.id === font.id && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p
                          className="text-xl leading-relaxed"
                          style={{ fontFamily: font.family }}
                        >
                          {font.preview}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="size">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-medium">حجم الخط</CardTitle>
                  <CardDescription>اختر حجم الخط المناسب للعرض</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(fontSizes).map(([size, config]) => (
                        <motion.div
                          key={size}
                          variants={itemVariants}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className={`cursor-pointer p-4 hover:shadow-lg ${
                              fontSize === size ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => {
                              setFontSize(size);
                              document.documentElement.style.setProperty("--font-size-base", `${config.base}px`);
                            }}
                          >
                            <div className="text-center">
                              <div 
                                className="mb-2 font-medium"
                                style={{ fontSize: `${config.base}px` }}
                              >
                                نص تجريبي
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {size === "small" && "صغير"}
                                {size === "medium" && "متوسط"}
                                {size === "large" && "كبير"}
                                {size === "xlarge" && "كبير جداً"}
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <Label className="text-lg font-medium">معاينة الحجم</Label>
                      <div 
                        className="space-y-4 p-6 bg-card rounded-lg"
                        style={{
                          fontSize: `${fontSizes[fontSize as keyof typeof fontSizes].base}px`,
                          fontFamily: selectedFont.family
                        }}
                      >
                        <h1 className="text-2xl font-bold">عنوان رئيسي</h1>
                        <h2 className="text-xl font-semibold">عنوان فرعي</h2>
                        <p className="leading-relaxed">
                          هذا نص تجريبي لمعاينة حجم الخط المختار. يمكنك رؤية كيف سيظهر النص في مختلف العناصر.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: "light", name: "فاتح", icon: Sun },
                  { id: "dark", name: "داكن", icon: Moon },
                  { id: "system", name: "تلقائي", icon: Monitor }
                ].map((mode) => (
                  <motion.div
                    key={mode.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        appearance === mode.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => {
                        setAppearance(mode.id as "light" | "dark" | "system");
                        applyAppearance(mode.id as "light" | "dark" | "system");
                      }}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-medium">{mode.name}</CardTitle>
                          {appearance === mode.id && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <mode.icon className="w-8 h-8" />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </motion.div>
        </Tabs>

        <motion.div
          className="mt-8 flex justify-end"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={saveSettings}
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            {isLoading ? "جارِ الحفظ..." : "حفظ التغييرات"}
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default ThemeSettings;