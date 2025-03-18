import { useState, useRef } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Printer, QrCode, Plus, Trash2 } from "lucide-react";
import { useReactToPrint } from 'react-to-print';
import JsBarcode from 'jsbarcode';

const BARCODE_TYPES = [
  { value: "CODE128", label: "Code 128" },
  { value: "EAN13", label: "EAN-13" },
  { value: "UPC", label: "UPC" },
  { value: "CODE39", label: "Code 39" },
];

interface BarcodeItem {
  id: string;
  text: string;
  type: string;
  quantity: number;
}

export default function BarcodesPage() {
  const { user } = useAuth();
  const [barcodes, setBarcodes] = useState<BarcodeItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const barcodeRefs = useRef<{ [key: string]: (SVGSVGElement | null)[] }>({});

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        generateBarcodes();
        resolve();
      });
    },
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .print-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 5mm;
          page-break-inside: avoid;
        }
        .print-item {
          padding: 2mm;
          text-align: center;
        }
      }
    `,
  });

  const addBarcodeItem = () => {
    const newBarcode: BarcodeItem = {
      id: Date.now().toString(),
      text: "",
      type: "CODE128",
      quantity: 1,
    };
    setBarcodes([...barcodes, newBarcode]);
  };

  const removeBarcodeItem = (id: string) => {
    setBarcodes(barcodes.filter(b => b.id !== id));
  };

  const updateBarcodeItem = (id: string, updates: Partial<BarcodeItem>) => {
    setBarcodes(barcodes.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const generateBarcodes = () => {
    setIsGenerating(true);
    try {
      barcodes.forEach(barcode => {
        const refs = barcodeRefs.current[barcode.id] || [];
        refs.forEach(ref => {
          if (ref && barcode.text) {
            JsBarcode(ref, barcode.text, {
              format: barcode.type,
              width: 2,
              height: 80,
              displayValue: true,
              font: "monospace",
              fontSize: 14,
              margin: 10,
            });
          }
        });
      });
    } catch (error) {
      console.error("خطأ في إنشاء الباركود:", error);
    }
    setIsGenerating(false);
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 h-full">
        <Sidebar />
      </div>
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-bold">إنشاء الباركود</h2>
            <p className="text-muted-foreground">
              إنشاء وطباعة الباركود للمنتجات والعناصر
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>إنشاء باركود جديد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={addBarcodeItem}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة باركود جديد
              </Button>

              <div className="space-y-4">
                {barcodes.map((barcode) => (
                  <div key={barcode.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div>
                      <label className="text-sm font-medium">نوع الباركود</label>
                      <Select
                        value={barcode.type}
                        onValueChange={(value) => updateBarcodeItem(barcode.id, { type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع الباركود" />
                        </SelectTrigger>
                        <SelectContent>
                          {BARCODE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">النص</label>
                      <Input
                        value={barcode.text}
                        onChange={(e) => updateBarcodeItem(barcode.id, { text: e.target.value })}
                        placeholder="أدخل النص أو الرقم"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">عدد النسخ</label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={barcode.quantity}
                        onChange={(e) => updateBarcodeItem(barcode.id, { quantity: Number(e.target.value) })}
                        placeholder="عدد النسخ المطلوبة"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeBarcodeItem(barcode.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={generateBarcodes} 
                  disabled={barcodes.length === 0 || isGenerating || !barcodes.some(b => b.text)}
                >
                  {isGenerating && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                  <QrCode className="h-4 w-4 ml-2" />
                  إنشاء الباركود
                </Button>
                <Button variant="outline" onClick={() => {
                  generateBarcodes();
                  setTimeout(handlePrint, 100);
                }}>
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة
                </Button>
              </div>

              <div ref={printRef} className="mt-6 p-4 border rounded-lg">
                {barcodes.map((barcode) => (
                  <div key={barcode.id} className="mb-6">
                    <div className="print-grid grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Array.from({ length: barcode.quantity }).map((_, index) => (
                        <div key={index} className="print-item border p-2 rounded print:border-none">
                          <svg
                            ref={(el) => {
                              if (!barcodeRefs.current[barcode.id]) {
                                barcodeRefs.current[barcode.id] = [];
                              }
                              barcodeRefs.current[barcode.id][index] = el;
                            }}
                            className="w-full"
                          ></svg>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}