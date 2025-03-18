import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { MdSupervisorAccount, MdAdd } from "react-icons/md";
import type { User } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { MoreVertical } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export default function Staff() {
  const { data: users = [], deleteUserMutation } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { toast } = useToast();
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      phone: "",
      role: "staff",
      permissions: [],
    },
  });

  const onSubmit = async (data: InsertUser) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, saveToDb: true }),
      });

      if (!response.ok) throw new Error("فشل إنشاء الحساب");

      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "تم إضافة الموظف الجديد إلى النظام",
      });
    } catch (error) {
      toast({
        title: "حدث خطأ",
        description: error instanceof Error ? error.message : "فشل إنشاء الحساب",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      toast({
        title: "تم حذف الحساب بنجاح",
        description: "تم حذف الموظف من النظام",
      });
    } catch (error) {
      toast({
        title: "حدث خطأ",
        description: "فشل حذف الحساب",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 h-full">
        <Sidebar />
      </div>
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <MdSupervisorAccount className="h-8 w-8" style={{ color: "#4285F4" }} />
              <h1 className="text-3xl font-bold">إدارة الموظفين</h1>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <MdAdd className="h-4 w-4 ml-2" />
                  إضافة موظف جديد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة موظف جديد</DialogTitle>
                  <DialogDescription>
                    أدخل معلومات الموظف الجديد. سيتم إرسال بيانات تسجيل الدخول إلى البريد الإلكتروني المدخل.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم المستخدم</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم الكامل</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كلمة المرور</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>البريد الإلكتروني</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الهاتف</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الدور</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الدور" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">مدير</SelectItem>
                              <SelectItem value="staff">موظف</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      إضافة الموظف
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle>قائمة الموظفين</CardTitle>
                <CardDescription>
                  إدارة الموظفين وأدوارهم في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المستخدم</TableHead>
                      <TableHead>الاسم الكامل</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.username}
                        </TableCell>
                        <TableCell>
                          {user.fullName}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role === "admin" ? "مدير" : "موظف"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "bg-green-50",
                            user.isActive ? "text-green-700" : "text-red-700"
                          )}>
                            {user.isActive ? "نشط" : "معطل"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">الإجراءات</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>تعديل المعلومات</DropdownMenuItem>
                              <DropdownMenuItem>تعديل الدور</DropdownMenuItem>
                              <DropdownMenuItem>إدارة الصلاحيات</DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-destructive">
                                    حذف الحساب
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>هل أنت متأكد من حذف هذا الحساب؟</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بيانات الموظف نهائياً.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => handleDeleteUser(user.id)}
                                    >
                                      حذف
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>سجل النشاط</CardTitle>
                <CardDescription>
                  آخر نشاطات الموظفين في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center gap-4 text-sm">
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-muted-foreground">
                        {user.lastLoginAt ? `آخر تسجيل دخول ${new Date(user.lastLoginAt).toLocaleString('ar-SA')}` : 'لم يسجل الدخول بعد'}
                      </div>
                    </div>
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