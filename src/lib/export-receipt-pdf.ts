import type { ReceiptRow } from '@/lib/types';
import { APP_NAME } from '@/lib/constants';

export async function exportReceiptPdf(receipt: ReceiptRow) {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 15;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt Record', pageW / 2, y, { align: 'center' });
  y += 10;

  // Divider
  doc.setDrawColor(190, 169, 142);
  doc.setLineWidth(0.5);
  doc.line(10, y, pageW - 10, y);
  y += 6;

  // Fields
  doc.setFontSize(10);
  const fields: [string, string][] = [
    ['Vendor', receipt.vendor_name ?? '—'],
    ['Date', receipt.transaction_date ?? '—'],
    ['Category', receipt.category ?? '—'],
    ['Amount', `$${Number(receipt.total_amount).toFixed(2)}`],
    ['Tax', `$${Number(receipt.tax_amount || 0).toFixed(2)}`],
    ['GST/HST', `$${Number(receipt.tax_amount || 0).toFixed(2)}`],
    ['Vendor BN', receipt.vendor_tax_number || receipt.business_number || '—'],
    ['Status', receipt.approval_status === 'approved' ? 'Approved' : receipt.approval_status === 'submitted' ? 'Pending' : 'Draft'],
    ['Notes', receipt.notes || '—'],
  ];

  for (const [label, value] of fields) {
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', 12, y);
    const labelW = doc.getTextWidth(label + ':');
    doc.setFont('helvetica', 'normal');
    doc.text(value, 12 + labelW + 2, y);
    y += 7;
  }

  // Footer
  y = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(`Exported from ${APP_NAME} · ${new Date().toLocaleDateString('en-CA')} · ID: ${receipt.id}`, pageW / 2, y, { align: 'center' });

  doc.save(`receipt-${receipt.id.slice(0, 8)}.pdf`);
}
