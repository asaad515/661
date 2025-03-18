import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import type { Expense, ExpenseCategory } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertExpenseCategorySchema, insertExpenseSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

type InsertExpenseCategoryForm = z.infer<typeof insertExpenseCategorySchema>;
type InsertExpenseForm = z.infer<typeof insertExpenseSchema>;

export default function ExpensesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<ExpenseCategory[]>({
    queryKey: ["/api/expenses/categories"],
  });

  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const categoryForm = useForm<InsertExpenseCategoryForm>({
    resolver: zodResolver(insertExpenseCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      budgetAmount: undefined,
    },
  });

  const expenseForm = useForm<InsertExpenseForm>({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      description: "",
      amount: undefined,
      date: new Date(),
      categoryId: undefined,
      isRecurring: false,
      recurringPeriod: undefined,
      recurringDay: undefined,
      notes: "",
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertExpenseCategoryForm) => {
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");

      console.log("Submitting category data:", data);

      const response = await fetch("/api/expenses/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          budgetAmount: data.budgetAmount ? Number(data.budgetAmount) : null,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "فشل في إنشاء فئة المصروفات");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/categories"] });
      setCategorySheetOpen(false);
      categoryForm.reset();
      toast({
        title: "تم بنجاح",
        description: "تم إضافة فئة المصروفات الجديدة",
      });
    },
    onError: (error: Error) => {
      console.error("Error creating category:", error);
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: InsertExpenseForm) => {
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");
      if (!data.categoryId) throw new Error("يجب اختيار فئة المصروف");

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId: user.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create expense");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setExpenseSheetOpen(false);
      expenseForm.reset();
      toast({
        title: "تم بنجاح",
        description: "تم إضافة المصروف الجديد",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoadingCategories || isLoadingExpenses) {
    return (
      <div className="flex h-screen">
        <div className="w-64 h-full">
          <Sidebar />
        </div>
        <main className="flex-1 p-8">
          <div className="h-[400px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="w-64 h-full">
        <Sidebar />
      </div>
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold">المصروفات</h2>
              <p className="text-muted-foreground">
                إدارة المصروفات وفئات المصروفات
              </p>
            </div>
            <div className="space-x-4 rtl:space-x-reverse">
              <Sheet open={categorySheetOpen} onOpenChange={setCategorySheetOpen}>
                <SheetTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة فئة مصروفات
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>إضافة فئة مصروفات جديدة</SheetTitle>
                    <SheetDescription>
                      قم بإدخال معلومات فئة المصروفات الجديدة
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <Form {...categoryForm}>
                      <form onSubmit={categoryForm.handleSubmit((data) => createCategoryMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={categoryForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم الفئة</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={categoryForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الوصف</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={categoryForm.control}
                          name="budgetAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الميزانية المخصصة</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={createCategoryMutation.isPending}>
                          {createCategoryMutation.isPending && (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          )}
                          إضافة فئة جديدة
                        </Button>
                      </form>
                    </Form>
                  </div>
                </SheetContent>
              </Sheet>

              <Sheet open={expenseSheetOpen} onOpenChange={setExpenseSheetOpen}>
                <SheetTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مصروف
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>إضافة مصروف جديد</SheetTitle>
                    <SheetDescription>
                      قم بإدخال معلومات المصروف الجديد
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <Form {...expenseForm}>
                      <form onSubmit={expenseForm.handleSubmit((data) => createExpenseMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={expenseForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الوصف</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={expenseForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>المبلغ</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={expenseForm.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الفئة</FormLabel>
                              <Select
                                value={field.value?.toString()}
                                onValueChange={(value) => field.onChange(parseInt(value))}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="اختر فئة المصروف" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem
                                      key={category.id}
                                      value={category.id.toString()}
                                    >
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={expenseForm.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>التاريخ</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-right font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP", { locale: ar })
                                      ) : (
                                        <span>اختر تاريخ</span>
                                      )}
                                      <CalendarIcon className="mr-auto h-4 w-4" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={expenseForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ملاحظات</FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={createExpenseMutation.isPending}>
                          {createExpenseMutation.isPending && (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          )}
                          إضافة مصروف جديد
                        </Button>
                      </form>
                    </Form>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>فئات المصروفات</CardTitle>
                <CardDescription>
                  {categories.length === 0
                    ? "لم يتم إضافة أي فئات مصروفات بعد"
                    : `${categories.length} فئات مصروفات`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد فئات مصروفات. قم بإضافة فئة جديدة باستخدام الزر أعلاه.
                  </div>
                ) : (
                  <div className="divide-y">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="py-4 flex justify-between items-center"
                      >
                        <div>
                          <h3 className="font-medium">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-muted-foreground">
                              {category.description}
                            </p>
                          )}
                        </div>
                        {category.budgetAmount && (
                          <div className="text-lg font-semibold">
                            {Number(category.budgetAmount).toLocaleString()} د.ع
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المصروفات الحالية</CardTitle>
                <CardDescription>
                  {expenses.length === 0
                    ? "لم يتم تسجيل أي مصروفات بعد"
                    : `${expenses.length} مصروفات مسجلة`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد مصروفات. قم بإضافة مصروف جديد باستخدام الزر أعلاه.
                  </div>
                ) : (
                  <div className="divide-y">
                    {expenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="py-4 flex justify-between items-center"
                      >
                        <div>
                          <h3 className="font-medium">{expense.description}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(expense.date), "PPP", { locale: ar })}
                          </p>
                        </div>
                        <div className="text-lg font-semibold">
                          {Number(expense.amount).toLocaleString()} د.ع
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}