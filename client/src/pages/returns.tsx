import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileUpload } from "@/components/ui/file-upload";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { insertReturnSchema } from "@shared/schema";
import type { Return, Sale, Product, ReturnStatusHistory } from "@shared/schema";
import {
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Package,
  Receipt,
  User,
  History,
  Activity
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ReturnsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedReturnId, setSelectedReturnId] = useState<number | null>(null);

  // جلب المبيعات والمنتجات
  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // جلب المرتجعات
  const { data: returns = [] } = useQuery<Return[]>({
    queryKey: ["/api/returns"],
  });

  // جلب تاريخ حالة المرتجع المحدد
  const { data: statusHistory = [] } = useQuery<ReturnStatusHistory[]>({
    queryKey: ["/api/returns/status-history", selectedReturnId],
    enabled: !!selectedReturnId,
  });

  const form = useForm({
    resolver: zodResolver(insertReturnSchema),
    defaultValues: {
      saleId: 0,
      productId: 0,
      quantity: 1,
      reason: "",
      refundAmount: 0,
      notes: "",
      attachments: [],
    },
  });

  // إضافة مرتجع جديد
  const createReturnMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();

      // إضافة البيانات الأساسية
      Object.keys(data).forEach(key => {
        if (key !== 'attachments') {
          formData.append(key, data[key].toString());
        }
      });

      // إضافة المرفقات
      selectedFiles.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await fetch('/api/returns', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('فشل في إنشاء طلب الإرجاع');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
      toast({
        title: "تم إنشاء طلب الإرجاع",
        description: "سيتم مراجعة طلبك من قبل الإدارة",
      });
      form.reset();
      setSelectedFiles([]);
    },
  });

  // تحديث حالة المرتجع
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const response = await fetch(`/api/returns/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) {
        throw new Error('فشل في تحديث حالة الإرجاع');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/returns/status-history", selectedReturnId] });
      toast({
        title: "تم تحديث الحالة",
        description: "تم تحديث حالة المرتجع بنجاح",
      });
    },
  });

  const onSubmit = (data: any) => {
    createReturnMutation.mutate(data);
  };

  const handleStatusUpdate = (returnId: number, newStatus: string) => {
    updateStatusMutation.mutate({
      id: returnId,
      status: newStatus,
      notes: `تم تحديث الحالة إلى ${newStatus}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-500';
      case 'rejected':
        return 'text-red-500';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5" />;
      case 'pending':
        return <Clock className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 h-full">
        <Sidebar />
      </div>
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-bold">إدارة المرتجعات</h2>
            <p className="text-muted-foreground">
              إنشاء وإدارة طلبات إرجاع المنتجات
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>طلب إرجاع جديد</CardTitle>
                <CardDescription>
                  قم بتعبئة النموذج لإنشاء طلب إرجاع جديد
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="saleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم عملية البيع</FormLabel>
                          <FormControl>
                            <select
                              className="w-full rounded-md border border-input bg-background px-3 py-2"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            >
                              <option value={0}>اختر عملية البيع</option>
                              {sales.map((sale) => (
                                <option key={sale.id} value={sale.id}>
                                  #{sale.id} - {new Date(sale.date).toLocaleDateString()}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المنتج</FormLabel>
                          <FormControl>
                            <select
                              className="w-full rounded-md border border-input bg-background px-3 py-2"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            >
                              <option value={0}>اختر المنتج</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الكمية</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>سبب الإرجاع</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="اذكر سبب الإرجاع" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="refundAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>مبلغ الاسترجاع</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ملاحظات إضافية</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="أي ملاحظات إضافية" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel>المرفقات</FormLabel>
                      <FileUpload
                        onFileSelect={(file) => setSelectedFiles([...selectedFiles, file])}
                        accept="image/*,.pdf"
                        maxSize={5}
                        label="إضافة مرفقات"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createReturnMutation.isPending}
                    >
                      {createReturnMutation.isPending ? (
                        <>جاري الإنشاء...</>
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 ml-2" />
                          إنشاء طلب إرجاع
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>طلبات الإرجاع الحالية</CardTitle>
                <CardDescription>
                  عرض وإدارة طلبات الإرجاع
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {returns.map((returnItem) => (
                    <div
                      key={returnItem.id}
                      className="p-4 border rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span className="font-medium">
                            طلب إرجاع #{returnItem.id}
                          </span>
                        </div>
                        <div className={`flex items-center gap-2 ${getStatusColor(returnItem.status)}`}>
                          {getStatusIcon(returnItem.status)}
                          <span>{returnItem.status === 'pending' ? 'قيد المراجعة' : returnItem.status === 'approved' ? 'تمت الموافقة' : 'مرفوض'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          <span>رقم البيع: {returnItem.saleId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>السبب: {returnItem.reason}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>
                            تاريخ الطلب: {new Date(returnItem.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* أزرار تحديث الحالة للمسؤولين */}
                      {user?.role === 'admin' && returnItem.status === 'pending' && (
                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-500"
                            onClick={() => handleStatusUpdate(returnItem.id, 'approved')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500"
                            onClick={() => handleStatusUpdate(returnItem.id, 'rejected')}
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            رفض
                          </Button>
                        </div>
                      )}

                      {/* عرض تاريخ تتبع الحالة */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2"
                        onClick={() => setSelectedReturnId(returnItem.id)}
                      >
                        <History className="h-4 w-4 mr-2" />
                        عرض التاريخ
                      </Button>

                      {selectedReturnId === returnItem.id && (
                        <div className="mt-4 space-y-2">
                          <h4 className="font-medium flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            تاريخ التحديثات
                          </h4>
                          {statusHistory.map((history) => (
                            <div
                              key={history.id}
                              className="text-sm text-muted-foreground border-l-2 pl-4 py-2"
                            >
                              <div className="flex items-center gap-2">
                                {getStatusIcon(history.status)}
                                <span>{history.status}</span>
                              </div>
                              <p className="text-xs mt-1">{history.notes}</p>
                              <span className="text-xs">
                                {new Date(history.date).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {returns.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      لا توجد طلبات إرجاع حالياً
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}