import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Package, Plus, Trash2, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Product, ExchangeRate } from "@shared/schema";
import { insertProductSchema } from "@shared/schema"; //This schema needs updating to include costPrice
import { apiRequest, queryClient } from "@/lib/queryClient";

// Added mock data for inventory trends (will be replaced with real data)
const mockInventoryTrends = [
  { date: "2025-01", stock: 120 },
  { date: "2025-02", stock: 150 },
  { date: "2025-03", stock: 90 },
  { date: "2025-04", stock: 75 },
];

export default function InventoryTable() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productImage, setProductImage] = useState<File | null>(null);
  const { toast } = useToast();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: exchangeRate } = useQuery<ExchangeRate>({
    queryKey: ["/api/exchange-rate"],
    staleTime: 0,
    refetchInterval: 5000,
  });

  const form = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      productCode: "",
      barcode: "",
      priceIqd: "",
      costPrice:"",
      stock: 0,
      productionDate: null,
      expiryDate: null,
      productType: "piece",
      isWeightBased: false,
      enableDirectWeighing: false,
    },
  });

  // حذف المنتج
  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف المنتج بنجاح"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف المنتج",
        variant: "destructive"
      });
    }
  });

  const watchPriceIqd = form.watch("priceIqd");
  const priceUsd =
    exchangeRate && watchPriceIqd
      ? Number(watchPriceIqd) / Number(exchangeRate.usdToIqd)
      : 0;

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  // حساب إحصائيات المخزون
  const inventoryStats = {
    totalProducts: products.length,
    lowStock: products.filter(p => p.stock < 10).length,
    totalValue: products.reduce((sum, p) => sum + (Number(p.priceIqd) * p.stock), 0),
  };

  async function onSubmit(data: any) {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      if (productImage) {
        formData.append("image", productImage);
      }

      await fetch("/api/products", {
        method: "POST",
        body: formData,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDialogOpen(false);
      setProductImage(null);
      form.reset();

      toast({
        title: <div className="flex items-center gap-2">
          <AnimatedIcon color="#4CAF50" animation="bounce">
            <Package className="w-4 h-4" />
          </AnimatedIcon>
          تم بنجاح
        </div>,
        description: "تم إضافة المنتج بنجاح",
      });
    } catch (error) {
      toast({
        title: <div className="flex items-center gap-2">
          <AnimatedIcon color="#f44336" animation="shake">
            <AlertCircle className="w-4 h-4" />
          </AnimatedIcon>
          خطأ
        </div>,
        description: "فشل في إضافة المنتج. الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي المنتجات</p>
              <p className="text-2xl font-bold">{inventoryStats.totalProducts}</p>
            </div>
            <AnimatedIcon color="#4285F4" animation="pulse">
              <Package className="h-8 w-8" />
            </AnimatedIcon>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">منتجات منخفضة المخزون</p>
              <p className="text-2xl font-bold">{inventoryStats.lowStock}</p>
            </div>
            <AnimatedIcon color="#EA4335" animation="shake">
              <AlertCircle className="h-8 w-8" />
            </AnimatedIcon>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">القيمة الإجمالية للمخزون</p>
              <p className="text-2xl font-bold">
                {inventoryStats.totalValue.toLocaleString()} د.ع
              </p>
            </div>
            <AnimatedIcon color="#34A853" animation="bounce">
              <TrendingUp className="h-8 w-8" />
            </AnimatedIcon>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">اتجاهات المخزون</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockInventoryTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="stock"
                stroke="#4285F4"
                fill="#4285F4"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Package className="h-5 w-5" />
          <h2 className="text-2xl font-bold">المخزون</h2>
        </div>

        <div className="flex items-center gap-4">
          <Input
            placeholder="بحث عن المنتجات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة منتج
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4">
              <DialogHeader className="mb-2">
                <DialogTitle className="text-lg">إضافة منتج جديد</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 pb-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المنتج</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="productCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رمز المنتج / الباركود</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ادخل رمز المنتج او امسح الباركود" className="text-lg" autoFocus/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوصف</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="productType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع المنتج</FormLabel>
                          <Select 
                            {...field}
                            value={field.value}
                            onValueChange={e => {
                              field.onChange(e);
                              form.setValue("isWeightBased", e === "weight" || e === "direct_weight");
                              form.setValue("enableDirectWeighing", e === "direct_weight");
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نوع المنتج" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="piece">قطعة</SelectItem>
                              <SelectItem value="weight">وزني (إدخال يدوي)</SelectItem>
                              <SelectItem value="direct_weight">وزني (ميزان مباشر)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priceIqd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>سعر البيع (د.ع)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <div className="text-xs text-muted-foreground">
                            ما يعادل: ${priceUsd.toFixed(2)} دولار
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="costPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>سعر التكلفة (د.ع)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المخزون</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="productionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ الإنتاج</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ الانتهاء</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* حقل إضافة الصورة */}
                  <div className="space-y-1">
                    <FormLabel>صورة المنتج</FormLabel>
                    <FileUpload
                      onFileSelect={(file) => setProductImage(file)}
                      maxSize={2}
                      accept="image/*"
                      label="اضغط لإضافة صورة"
                    />
                    {productImage && (
                      <div className="mt-1">
                        <p className="text-xs text-green-600">
                          تم اختيار الصورة: {productImage.name}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 mt-4">
                    <DialogClose asChild>
                      <Button variant="outline" type="button">
                        إلغاء
                      </Button>
                    </DialogClose>
                    <Button type="submit">
                      إضافة
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم المنتج</TableHead>
              <TableHead>رمز المنتج</TableHead>
              <TableHead>الباركود</TableHead>
              <TableHead>الوصف</TableHead>
              <TableHead>السعر</TableHead>
              <TableHead>المخزون</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const priceUsd = exchangeRate
                ? Number(product.priceIqd) / Number(exchangeRate.usdToIqd)
                : 0;

              return (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.productCode}</TableCell>
                  <TableCell>{product.barcode}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>
                    {Number(product.priceIqd).toLocaleString()} د.ع
                    <br />
                    <span className="text-sm text-muted-foreground">
                      ${priceUsd.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {product.stock < 10 && (
                        <AnimatedIcon color="#f44336" animation="pulse" size="sm">
                          <AlertCircle />
                        </AnimatedIcon>
                      )}
                      {product.stock}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (window.confirm("هل أنت متأكد من حذف هذا المنتج؟\nلا يمكن حذف المنتج إذا كان لديه مبيعات مرتبطة به.")) {
                          deleteMutation.mutate(product.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 ml-2" />
                          حذف
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}