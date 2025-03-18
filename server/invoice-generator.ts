
import PDFDocument from 'pdfkit-table';
import { Sale, Customer, Product } from '@shared/schema';
import fs from 'fs';
import path from 'path';

export async function generateInvoicePDF(sale: Sale, customer?: Customer, product?: Product): Promise<string> {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  
  const fileName = `invoice-${sale.id}-${Date.now()}.pdf`;
  const filePath = path.join(process.cwd(), 'uploads', fileName);
  
  doc.pipe(fs.createWriteStream(filePath));

  // Add header
  doc.fontSize(20).text('فاتورة مبيعات', { align: 'right' });
  doc.fontSize(12).text(`رقم الفاتورة: ${sale.id}`, { align: 'right' });
  doc.text(`التاريخ: ${new Date(sale.date).toLocaleDateString('ar-IQ')}`, { align: 'right' });
  
  if (customer) {
    doc.moveDown();
    doc.text(`العميل: ${customer.name}`, { align: 'right' });
    if (customer.phone) doc.text(`الهاتف: ${customer.phone}`, { align: 'right' });
  }

  // Add table
  const table = {
    headers: ['السعر الإجمالي', 'السعر', 'الكمية', 'المنتج'],
    rows: [[
      `${Number(sale.finalPriceIqd).toLocaleString()} د.ع`,
      `${Number(sale.priceIqd).toLocaleString()} د.ع`,
      sale.quantity.toString(),
      product?.name || sale.productId.toString()
    ]]
  };

  await doc.table(table, { 
    width: 500,
    align: 'right'
  });

  doc.end();
  return fileName;
}
