import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Loader2, Plus, Tag, Calendar, Percent, QrCode } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import JsBarcode from 'jsbarcode';
import { useReactToPrint } from 'react-to-print';
import { useRef } from "react";

interface DiscountCode {
  id: string;
  code: string;
  discountPercentage: number;
  validFrom: Date;
  validTo: Date;
  maxUses: number;
  currentUses: number;
  description: string;
}

export default function DiscountCodesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCode, setSelectedCode] = useState<DiscountCode | null>(null);
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<SVGSVGElement>(null);

  const form = useForm({
    defaultValues: {
      code: "",
      discountPercentage: 10,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      maxUses: 100,
      description: "",
    },
  });

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        if (barcodeRef.current && selectedCode) {
          JsBarcode(barcodeRef.current, selectedCode.code, {
            format: "CODE128",
            width: 2,
            height: 80,
            displayValue: true,
            font: "monospace",
            fontSize: 14,
            margin: 10,
          });
        }
        setIsPrinting(true);
        resolve();
      });
    },
    onAfterPrint: () => {
      setIsPrinting(false);
    },
    pageStyle: `
      @page {
        size: 80mm 30mm;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .discount-code-print {
          width: 100%;
          text-align: center;
        }
      }
    `,
  });

  const onSubmit = async (data: any) => {
    const newCode: DiscountCode = {
      id: Date.now().toString(),
      ...data,
      currentUses: 0,
    };
    setCodes([...codes, newCode]);
    form.reset();
    toast({
      title: "تم إنشاء كود الخصم",
      description: `تم إنشاء كود الخصم ${newCode.code} بنجاح`,
    });
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 h-full">
        <Sidebar />
      </div>
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-bold">أكواد الخصم</h2>
            <p className="text-muted-foreground">
              إنشاء وإدارة أكواد الخصم مع إمكانية طباعة الباركود
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>إنشاء كود خصم جديد</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كود الخصم</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="مثال: SALE2025" dir="ltr" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="discountPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نسبة الخصم (%)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="0" max="100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="validFrom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تاريخ البداية</FormLabel>
                            <FormControl>
                              <DatePicker
                                date={field.value}
                                onSelect={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="validTo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تاريخ الانتهاء</FormLabel>
                            <FormControl>
                              <DatePicker
                                date={field.value}
                                onSelect={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="maxUses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الحد الأقصى للاستخدام</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" />
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
                            <Input {...field} placeholder="وصف العرض أو الخصم" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">
                      <Plus className="h-4 w-4 ml-2" />
                      إنشاء كود خصم
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أكواد الخصم الحالية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {codes.map((code) => (
                    <div
                      key={code.id}
                      className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => setSelectedCode(code)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          <span className="font-medium">{code.code}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          <span>{code.discountPercentage}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(code.validTo).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          {code.currentUses} / {code.maxUses} استخدام
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCode(code);
                          setTimeout(handlePrint, 100);
                        }}
                      >
                        <QrCode className="h-4 w-4 ml-2" />
                        طباعة الباركود
                      </Button>
                    </div>
                  ))}

                  {codes.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      لا توجد أكواد خصم حالياً
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* منطقة الطباعة */}
          <div className="hidden">
            <div ref={printRef} className="discount-code-print p-4">
              {selectedCode && (
                <>
                  <div className="text-center mb-2">
                    <div className="font-bold">{selectedCode.code}</div>
                    <div className="text-sm">{selectedCode.description}</div>
                    <div className="text-sm">
                      خصم {selectedCode.discountPercentage}%
                    </div>
                  </div>
                  <svg ref={barcodeRef} className="w-full"></svg>
                  <div className="text-sm mt-2">
                    صالح حتى: {new Date(selectedCode.validTo).toLocaleDateString()}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}