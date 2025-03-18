import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

type ExportFormat = 'pdf' | 'excel' | 'csv';

interface ExportOptions {
  filename?: string;
  sheetName?: string;
  orientation?: 'portrait' | 'landscape';
  title?: string;
  subtitle?: string;
  footer?: string;
}

export class ExportManager {
  static async exportData(
    data: any[],
    format: ExportFormat,
    options: ExportOptions = {}
  ) {
    const {
      filename = 'export',
      sheetName = 'Sheet1',
      orientation = 'portrait',
      title,
      subtitle,
      footer
    } = options;

    switch (format) {
      case 'pdf':
        return this.exportToPDF(data, { filename, orientation, title, subtitle, footer });
      case 'excel':
        return this.exportToExcel(data, { filename, sheetName });
      case 'csv':
        return this.exportToCSV(data, { filename });
      default:
        throw new Error('صيغة التصدير غير مدعومة');
    }
  }

  private static async exportToPDF(
    data: any[],
    options: ExportOptions
  ) {
    const { filename, orientation, title, subtitle, footer } = options;
    const doc = new jsPDF(orientation);

    // إضافة الترويسة
    if (title) {
      doc.setFontSize(18);
      doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    }

    if (subtitle) {
      doc.setFontSize(14);
      doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
    }

    // تحويل البيانات إلى مصفوفة للجدول
    const headers = Object.keys(data[0]);
    const rows = data.map(item => Object.values(item));

    // إضافة الجدول
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: subtitle ? 40 : 20,
      theme: 'grid',
      styles: {
        font: 'arial',
        fontSize: 10,
        cellPadding: 5,
        overflow: 'linebreak',
        halign: 'right'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    // إضافة التذييل
    if (footer) {
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          footer,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
    }

    // حفظ الملف
    doc.save(`${filename}.pdf`);
  }

  private static async exportToExcel(
    data: any[],
    options: ExportOptions
  ) {
    const { filename, sheetName } = options;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // تنسيق العرض
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const columns = Object.keys(data[0]);
    const colWidths = columns.map(col => ({
      wch: Math.max(
        col.length,
        ...data.map(row => String(row[col]).length)
      )
    }));

    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  private static async exportToCSV(
    data: any[],
    options: ExportOptions
  ) {
    const { filename } = options;
    const headers = Object.keys(data[0]);
    const rows = data.map(item => Object.values(item));
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => 
          typeof cell === 'string' && cell.includes(',') 
            ? `"${cell}"` 
            : cell
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  }

  static getDateRangeString(startDate: Date, endDate: Date): string {
    const formatter = new Intl.DateTimeFormat('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
  }
}