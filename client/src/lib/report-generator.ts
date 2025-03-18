import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { ExportManager } from './export-manager';
import { I18nManager } from './i18n-manager';

interface ReportOptions {
  title: string;
  subtitle?: string;
  author?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'a3' | 'letter';
  margins?: { top: number; right: number; bottom: number; left: number };
  rtl?: boolean;
  watermark?: string;
  header?: {
    text?: string;
    image?: string;
    height?: number;
  };
  footer?: {
    text?: string;
    pagination?: boolean;
  };
}

interface TableData {
  headers: string[];
  rows: any[][];
  widths?: number[];
  alignments?: ('left' | 'center' | 'right')[];
}

interface ChartData {
  type: 'bar' | 'line' | 'pie';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
  }[];
}

export class ReportGenerator {
  private doc: jsPDF;
  private currentY: number;
  private pageHeight: number;
  private pageWidth: number;
  private options: ReportOptions;
  private i18n: I18nManager;
  private pageCount: number;

  constructor(options: ReportOptions) {
    this.options = {
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      rtl: true,
      ...options
    };

    this.doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.pageSize || 'a4'
    });

    this.i18n = I18nManager.getInstance();
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.currentY = this.options.margins.top;
    this.pageCount = 1;

    this.setupDocument();
  }

  private setupDocument(): void {
    // إعداد اتجاه النص
    if (this.options.rtl) {
      this.doc.setR2L(true);
    }

    // إضافة البيانات الوصفية
    this.doc.setProperties({
      title: this.options.title,
      author: this.options.author || 'Business Management System',
      subject: this.options.subtitle,
      keywords: 'report, business, management',
      creator: 'Report Generator'
    });

    // إضافة العلامة المائية إذا وجدت
    if (this.options.watermark) {
      this.addWatermark(this.options.watermark);
    }

    // إعداد الترويسة
    if (this.options.header) {
      this.setupHeader();
    }

    // إعداد التذييل
    if (this.options.footer) {
      this.setupFooter();
    }

    // إضافة العنوان الرئيسي
    this.addTitle();
  }

  private setupHeader(): void {
    const headerHeight = this.options.header.height || 20;
    
    if (this.options.header.image) {
      this.doc.addImage(
        this.options.header.image,
        'JPEG',
        this.options.margins.left,
        5,
        30,
        headerHeight - 5
      );
    }

    if (this.options.header.text) {
      this.doc.setFontSize(12);
      this.doc.text(
        this.options.header.text,
        this.pageWidth / 2,
        10,
        { align: 'center' }
      );
    }

    this.currentY = headerHeight + 5;
  }

  private setupFooter(): void {
    const footer = this.options.footer;
    
    const addFooter = (pageNumber: number) => {
      this.doc.setPage(pageNumber);
      
      if (footer.text) {
        this.doc.setFontSize(10);
        this.doc.text(
          footer.text,
          this.pageWidth / 2,
          this.pageHeight - 10,
          { align: 'center' }
        );
      }

      if (footer.pagination) {
        this.doc.text(
          `${this.i18n.translate('report.page')} ${pageNumber} ${this.i18n.translate('report.of')} ${this.pageCount}`,
          this.pageWidth - this.options.margins.right,
          this.pageHeight - 10,
          { align: 'right' }
        );
      }
    };

    // حفظ الدالة لاستخدامها عند إضافة صفحات جديدة
    this.doc.internal.events.subscribe('addPage', () => {
      this.pageCount++;
      addFooter(this.pageCount);
    });

    // إضافة التذييل للصفحة الأولى
    addFooter(1);
  }

  private addWatermark(text: string): void {
    this.doc.setFontSize(60);
    this.doc.setTextColor(190, 190, 190);
    this.doc.text(
      text,
      this.pageWidth / 2,
      this.pageHeight / 2,
      {
        align: 'center',
        angle: 45
      }
    );
    this.doc.setTextColor(0);
    this.doc.setFontSize(12);
  }

  private addTitle(): void {
    this.doc.setFontSize(20);
    this.doc.text(
      this.options.title,
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    );
    this.currentY += 10;

    if (this.options.subtitle) {
      this.doc.setFontSize(14);
      this.doc.text(
        this.options.subtitle,
        this.pageWidth / 2,
        this.currentY,
        { align: 'center' }
      );
      this.currentY += 15;
    }

    this.doc.setFontSize(12);
  }

  addParagraph(text: string, options: {
    fontSize?: number;
    align?: 'left' | 'center' | 'right';
    spacing?: number;
    maxWidth?: number;
  } = {}): void {
    const {
      fontSize = 12,
      align = 'right',
      spacing = 5,
      maxWidth = this.pageWidth - this.options.margins.left - this.options.margins.right
    } = options;

    this.doc.setFontSize(fontSize);
    
    const lines = this.doc.splitTextToSize(text, maxWidth);
    const textHeight = lines.length * this.doc.getTextDimensions('').h;

    // التحقق من الحاجة لصفحة جديدة
    if (this.currentY + textHeight > this.pageHeight - this.options.margins.bottom) {
      this.doc.addPage();
      this.currentY = this.options.margins.top;
    }

    this.doc.text(
      lines,
      align === 'center' ? this.pageWidth / 2 :
      align === 'right' ? this.pageWidth - this.options.margins.right :
      this.options.margins.left,
      this.currentY,
      { align }
    );

    this.currentY += textHeight + spacing;
  }

  addTable(data: TableData): void {
    autoTable(this.doc, {
      head: [data.headers],
      body: data.rows,
      startY: this.currentY,
      margin: this.options.margins,
      columnStyles: data.alignments?.reduce((styles, align, index) => ({
        ...styles,
        [index]: { halign: align }
      }), {}),
      columnWidths: data.widths,
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      tableLineColor: [189, 195, 199],
      tableLineWidth: 0.1,
      didDrawPage: () => {
        this.currentY = this.doc.lastAutoTable.finalY || this.currentY;
      }
    });

    this.currentY += 10;
  }

  addChart(data: ChartData, options: {
    width?: number;
    height?: number;
    title?: string;
  } = {}): void {
    // سيتم تنفيذ هذه الميزة في التحديثات القادمة
    // حالياً يمكن تصدير الرسوم البيانية كصور وإضافتها باستخدام addImage
  }

  addImage(imageData: string, options: {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    align?: 'left' | 'center' | 'right';
  } = {}): void {
    const {
      width = 50,
      height = 50,
      align = 'center'
    } = options;

    let x = options.x;
    if (!x) {
      switch (align) {
        case 'center':
          x = (this.pageWidth - width) / 2;
          break;
        case 'right':
          x = this.pageWidth - this.options.margins.right - width;
          break;
        default:
          x = this.options.margins.left;
      }
    }

    const y = options.y || this.currentY;

    // التحقق من الحاجة لصفحة جديدة
    if (y + height > this.pageHeight - this.options.margins.bottom) {
      this.doc.addPage();
      this.currentY = this.options.margins.top;
    }

    this.doc.addImage(imageData, 'JPEG', x, y, width, height);
    this.currentY = y + height + 10;
  }

  addPageBreak(): void {
    this.doc.addPage();
    this.currentY = this.options.margins.top;
  }

  generatePDF(): Uint8Array {
    return this.doc.output('arraybuffer');
  }

  save(filename: string = 'report.pdf'): void {
    this.doc.save(filename);
  }

  getBlob(): Blob {
    return new Blob([this.generatePDF()], { type: 'application/pdf' });
  }
}

// هوك مخصص لإنشاء التقارير
export function useReportGenerator(options: ReportOptions) {
  return new ReportGenerator(options);
}