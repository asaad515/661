import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Minus, Printer, Search, X, ShoppingCart } from "lucide-react";
import type { Product } from "@shared/schema";

export function QuickSale() {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<{id: number, quantity: number, name: string, price: number}[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // المنتجات الأكثر مبيعاً - يمكن تعديلها حسب الحاجة
  const popularProducts = products.slice(0, 12);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { 
        id: product.id, 
        quantity: 1, 
        name: product.name, 
        price: Number(product.priceIqd)
      }];
    });
    toast({
      title: "تمت الإضافة",
      description: `تم إضافة ${product.name} إلى السلة`
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => 
      prev.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      })
    );
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
      setBarcode("");
    } else {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "المنتج غير موجود"
      });
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const completeSale = async () => {
    try {
      // إضافة منطق إتمام البيع هنا
      toast({
        title: "تم البيع بنجاح",
        description: `تم بيع ${cart.length} منتج بقيمة ${total} د.ع`
      });
      setCart([]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء إتمام البيع"
      });
    }
  };

  // التعامل مع اختصارات لوحة المفاتيح
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '+') {
        setQuantity(q => q + 1);
      } else if (e.key === '-' && quantity > 1) {
        setQuantity(q => q - 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [quantity]);

  const commonQuantities = [1, 2, 5, 10];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>المنتجات الشائعة</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2 mb-4">
            <Input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="ادخل الباركود..."
              className="flex-1"
            />
            <Button type="submit">إضافة</Button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {popularProducts.map((product) => (
              <Button
                key={product.id}
                variant="outline"
                className="h-auto py-4 px-2 flex flex-col items-center text-center text-lg p-6 min-h-[4rem] whitespace-normal"
                onClick={() => addToCart(product)}
              >
                <span className="font-bold mb-1">{product.name}</span>
                <span className="text-sm text-muted-foreground">
                  {Number(product.priceIqd).toLocaleString()} د.ع
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>السلة</CardTitle>
          <ShoppingCart className="w-5 h-5" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-2">
                <div className="space-y-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.price.toLocaleString()} د.ع
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {cart.length > 0 && (
              <div className="pt-4">
                <div className="flex justify-between text-lg font-bold mb-4">
                  <span>المجموع:</span>
                  <span>{total.toLocaleString()} د.ع</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={completeSale} className="w-full">
                    إتمام البيع
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Printer className="w-4 h-4 mr-2" />
                    طباعة
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function QuickSale2() {
  const { toast } = useToast(); // Assuming useToast is imported correctly
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState("1");

  const handleSale = async () => {
    try {
      // هنا سيتم إضافة منطق البيع السريع
      toast({
        title: "تم البيع بنجاح",
        description: `تم بيع ${quantity} قطعة من المنتج ${barcode}`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء عملية البيع",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>البيع السريع</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="barcode">الباركود</Label>
          <Input
            id="barcode"
            placeholder="ادخل الباركود"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">الكمية</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => quantity > 1 && setQuantity(parseInt(quantity) - 1)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-20 text-center"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(parseInt(quantity) + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            {commonQuantities.map((q) => (
              <Button
                key={q}
                variant="outline"
                size="sm"
                onClick={() => setQuantity(q)}
                className={quantity === q ? "bg-primary text-primary-foreground" : ""}
              >
                {q}
              </Button>
            ))}
          </div>
        </div>
        <Button className="w-full" onClick={handleSale}>
          إتمام البيع
        </Button>
      </CardContent>
    </Card>
  );
}