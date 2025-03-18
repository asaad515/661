import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MdDelete } from "react-icons/md";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import { ProductGallery } from "@/components/products/product-gallery";
import { FileUpload } from "@/components/ui/file-upload";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { Package, ShoppingCart, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/schema";

export default function Products() {
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productImage, setProductImage] = useState<File | null>(null);

  const form = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      productCode: "",
      barcode: "",
      priceIqd: "",
      stock: 0,
      productionDate: null,
      expiryDate: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const formData = new FormData();

        // تنظيف وتحويل البيانات
        const cleanedData = {
          name: data.name?.trim(),
          description: data.description?.trim() || "",
          productCode: data.productCode?.trim() || Date.now().toString(),
          barcode: data.barcode?.trim() || null,
          priceIqd: data.priceIqd ? data.priceIqd.toString() : "0",
          stock: parseInt(data.stock?.toString() || "0"),
          productionDate: data.productionDate ? new Date(data.productionDate).toISOString() : null,
          expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : null
        };

        // إضافة البيانات إلى FormData
        Object.entries(cleanedData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString());
          }
        });

        // إضافة الصورة إذا وجدت
        if (productImage) {
          formData.append("image", productImage);
        }

        const response = await fetch("/api/products", {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "فشل في إنشاء المنتج");
        }

        const result = await response.json();
        console.log("تم إنشاء المنتج بنجاح:", result);
        return result;
      } catch (error) {
        console.error("خطأ في إرسال النموذج:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDialogOpen(false);
      setProductImage(null);
      form.reset();
      toast({
        title: "تم بنجاح",
        description: "تم إضافة المنتج بنجاح"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة المنتج",
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData();
      
      // تحويل وتنظيف البيانات قبل الإرسال
      const cleanedData = {
        name: data.name?.trim(),
        description: data.description?.trim() || "",
        productCode: data.productCode?.trim() || Date.now().toString(),
        barcode: data.barcode?.trim() || null,
        priceIqd: data.priceIqd ? data.priceIqd.toString() : "0",
        stock: parseInt(data.stock?.toString() || "0")
      };

      // إضافة البيانات المنظفة إلى FormData
      Object.entries(cleanedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // إضافة الصورة إذا وجدت
      if (productImage) {
        formData.append("image", productImage);
      }

      const response = await fetch("/api/products", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "فشل في إنشاء المنتج");
      }

      const result = await response.json();
      console.log("Product created successfully:", result);

      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDialogOpen(false);
      setProductImage(null);
      form.reset();
      
      toast({
        title: "تم إنشاء المنتج بنجاح",
        description: "تمت إضافة المنتج بنجاح إلى قائمة المنتجات",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "حدث خطأ",
        description: error instanceof Error ? error.message : "فشل في إنشاء المنتج",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <AnimatedIcon color="#4285F4" animation="pulse">
            <Package className="h-6 w-6" />
          </AnimatedIcon>
          <h1 className="text-3xl font-bold">المنتجات</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>إضافة منتج جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة منتج جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المنتج</Label>
                <Input {...form.register("name")} placeholder="ادخل اسم المنتج" />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">وصف المنتج</Label>
                <Input {...form.register("description")} placeholder="ادخل وصف المنتج" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productCode">رمز المنتج / الباركود</Label>
                <Input
                  type="text"
                  {...form.register("productCode")}
                  placeholder="ادخل رمز المنتج او امسح الباركود"
                  className="text-lg"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productionDate">تاريخ الإنتاج</Label>
                  <Input
                    type="date"
                    {...form.register("productionDate")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">تاريخ الانتهاء</Label>
                  <Input
                    type="date"
                    {...form.register("expiryDate")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceIqd">السعر (دينار عراقي)</Label>
                <Input
                  type="number"
                  {...form.register("priceIqd")}
                  placeholder="ادخل السعر"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">الكمية المتوفرة</Label>
                <Input
                  type="number"
                  {...form.register("stock")}
                  placeholder="ادخل الكمية"
                />
              </div>

              {/* حقل إضافة الصورة */}
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="image">صورة المنتج (اختياري)</Label>
                <div className="text-sm text-muted-foreground mb-2">
                  يمكنك رفع صورة للمنتج. الصورة اختيارية ويمكن إضافتها لاحقاً.
                </div>
                <FileUpload
                  onFileSelect={(file) => setProductImage(file)}
                  maxSize={2}
                  accept="image/*"
                  label="اضغط لإضافة صورة"
                />
                {productImage && (
                  <div className="mt-2">
                    <p className="text-sm text-green-600">
                      تم اختيار الصورة: {productImage.name}
                    </p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء المنتج"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ProductGallery />

      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AnimatedIcon color="#34A853" animation="bounce">
              <ShoppingCart className="h-5 w-5" />
            </AnimatedIcon>
            <CardTitle>المنتجات</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-bold">{product.name}</h3>
                      <p className="text-gray-600 mt-1">{product.description}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{product.priceIqd} د.ع</p>
                        <div className="flex items-center gap-2">
                          {product.stock < 10 ? (
                            <AnimatedIcon color="#EA4335" animation="shake" size="sm">
                              <AlertCircle />
                            </AnimatedIcon>
                          ) : null}
                          <p className="text-sm text-gray-500">
                            المخزون: {product.stock}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}