import React, { useState, useEffect } from 'react';
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, BarChart, Users, Package, CreditCard, Award } from "lucide-react";

const Icons = {
  dollarSign: DollarSign,
  barChart: BarChart,
  users: Users,
  package: Package,
  creditCard: CreditCard,
  award: Award,
  spinner: () => (<div className="animate-spin">...</div>),
  eye: () => (<span>👁</span>),
  eyeOff: () => (<span>🚫</span>)
};
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@/lib/validations/auth";

type PasswordStrength = {
  score: number;
  message: string;
  color: string;
};

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  let message = "ضعيف جداً";
  let color = "bg-red-500";

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  switch (score) {
    case 0:
    case 1:
      message = "ضعيف جداً";
      color = "bg-red-500";
      break;
    case 2:
      message = "ضعيف";
      color = "bg-orange-500";
      break;
    case 3:
      message = "متوسط";
      color = "bg-yellow-500";
      break;
    case 4:
      message = "قوي";
      color = "bg-lime-500";
      break;
    case 5:
      message = "قوي جداً";
      color = "bg-green-500";
      break;
  }

  return { score, message, color };
}

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    message: "ضعيف جداً",
    color: "bg-red-500",
  });

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginForm = useForm({
    resolver: zodResolver(
      insertUserSchema.pick({
        username: true,
        password: true,
      })
    ),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
    },
  });

  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex flex-col items-center justify-between p-4 relative">
      <div className="animated-background">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      <div className="flex-grow flex items-center justify-center w-full">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
          <div className="hidden md:flex flex-col items-center justify-center p-8">
            <div className="text-[200px] font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent animate-gradient select-none">
              SAS
            </div>
            <div className="grid grid-cols-3 gap-6 mt-8 max-w-2xl mx-auto">
              <div className="flex flex-col items-center space-y-3 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-transparent hover:from-primary/20 transition-all">
                <Icons.dollarSign className="h-10 w-10 text-primary" />
                <p className="text-center text-sm">إدارة المبيعات والفواتير</p>
              </div>
              <div className="flex flex-col items-center space-y-3 p-4 rounded-lg bg-gradient-to-br from-secondary/10 to-transparent hover:from-secondary/20 transition-all">
                <Icons.barChart className="h-10 w-10 text-secondary" />
                <p className="text-center text-sm">تقارير وإحصائيات</p>
              </div>
              <div className="flex flex-col items-center space-y-3 p-4 rounded-lg bg-gradient-to-br from-accent/10 to-transparent hover:from-accent/20 transition-all">
                <Icons.users className="h-10 w-10 text-accent" />
                <p className="text-center text-sm">إدارة العملاء</p>
              </div>
            </div>
            <div className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent animate-gradient mt-8">
              نظام إدارة المبيعات المتكامل
            </div>
            <div className="text-xl text-center text-muted-foreground mt-4">
              حلول متكاملة لإدارة أعمالك
            </div>
          </div>

          <div className="w-full max-w-md mx-auto">
            <Card className="backdrop-blur-sm bg-white/80">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center font-bold">
                  {activeTab === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login" className="font-bold text-black">تسجيل الدخول</TabsTrigger>
                    <TabsTrigger value="register">حساب جديد</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4">
                    <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))}>
                      <div className="space-y-4">
                        <Input
                          placeholder="اسم المستخدم"
                          {...loginForm.register("username")}
                          className="text-right"
                        />
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="كلمة المرور"
                            {...loginForm.register("password")}
                            className="text-right"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2"
                          >
                            {showPassword ? <Icons.eyeOff /> : <Icons.eye />}
                          </button>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity"
                          disabled={loginMutation.isLoading}
                        >
                          {loginMutation.isLoading ? (
                            <>
                              <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />
                              جاري التحميل...
                            </>
                          ) : (
                            "تسجيل الدخول"
                          )}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="register" className="space-y-4">
                    <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))}>
                      <div className="space-y-4">
                        <Input
                          placeholder="اسم المستخدم"
                          {...registerForm.register("username")}
                          className="text-right"
                        />
                        <Input
                          placeholder="البريد الإلكتروني"
                          type="email"
                          {...registerForm.register("email")}
                          className="text-right"
                        />
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="كلمة المرور"
                            {...registerForm.register("password", {
                              onChange: (e) => setPasswordStrength(getPasswordStrength(e.target.value)),
                            })}
                            className="text-right"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2"
                          >
                            {showPassword ? <Icons.eyeOff /> : <Icons.eye />}
                          </button>
                        </div>
                        <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground text-right">
                          {passwordStrength.message}
                        </p>
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity"
                          disabled={registerMutation.isLoading}
                        >
                          {registerMutation.isLoading ? (
                            <>
                              <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />
                              جاري التحميل...
                            </>
                          ) : (
                            "إنشاء حساب"
                          )}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="w-full text-center py-4 text-sm text-muted-foreground">
        <p>جميع الحقوق محفوظة © {new Date().getFullYear()} نظام SAS لإدارة المبيعات</p>
      </footer>
    </div>
  );
}