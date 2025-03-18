import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Download, FileType, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const reportTypes = [
  { id: 'sales', name: 'تقرير المبيعات' },
  { id: 'inventory', name: 'تقرير المخزون' },
  { id: 'financial', name: 'التقرير المالي' },
  { id: 'customers', name: 'تقرير العملاء' },
  { id: 'appointments', name: 'تقرير المواعيد' }
];

export function AdvancedReport() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
  const [exportFormat, setExportFormat] = useState('pdf');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['/api/reports', reportType, dateRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/reports/${reportType}?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`
      );
      return response.json();
    },
  });

  const handleExport = async () => {
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: reportType,
          format: exportFormat,
          dateRange,
          data: reportData,
        }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير التقرير بصيغة ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير التقرير",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>إعدادات التقرير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع التقرير</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع التقرير" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الفترة الزمنية</label>
              <DateRangePicker 
                value={dateRange}
                onChange={setDateRange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">صيغة التصدير</label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر صيغة التصدير" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 ml-2" />
              طباعة
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 ml-2" />
              تصدير
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <motion.div
            key={reportType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="print:block"
          >
            <Card>
              <CardHeader className="print:hidden">
                <CardTitle>
                  {reportTypes.find(t => t.id === reportType)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData && (
                  <div className="space-y-8">
                    {/* عرض محتوى التقرير حسب نوعه */}
                    {reportType === 'sales' && (
                      <SalesReportContent data={reportData} />
                    )}
                    {reportType === 'inventory' && (
                      <InventoryReportContent data={reportData} />
                    )}
                    {reportType === 'financial' && (
                      <FinancialReportContent data={reportData} />
                    )}
                    {reportType === 'customers' && (
                      <CustomersReportContent data={reportData} />
                    )}
                    {reportType === 'appointments' && (
                      <AppointmentsReportContent data={reportData} />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// مكونات عرض التقارير المختلفة
function SalesReportContent({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* محتوى تقرير المبيعات */}
    </div>
  );
}

function InventoryReportContent({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* محتوى تقرير المخزون */}
    </div>
  );
}

function FinancialReportContent({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* محتوى التقرير المالي */}
    </div>
  );
}

function CustomersReportContent({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* محتوى تقرير العملاء */}
    </div>
  );
}

function AppointmentsReportContent({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* محتوى تقرير المواعيد */}
    </div>
  );
}