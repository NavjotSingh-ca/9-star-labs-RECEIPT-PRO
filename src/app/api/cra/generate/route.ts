import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getCRAFormData } from '@/lib/services/receipts';
import { logError } from '@/lib/logger';
import { env } from '@/lib/env';
import { z } from 'zod';

const yearSchema = z.coerce.number().int().min(2000).max(2099);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawYear = searchParams.get('year');
  const taxYear = rawYear ? yearSchema.safeParse(rawYear) : { data: new Date().getFullYear() - 1, success: true };
  if (!taxYear.success) {
    return NextResponse.json({ error: 'Invalid tax year' }, { status: 400 });
  }

  const rawFrom = searchParams.get('fromDate');
  const rawTo = searchParams.get('toDate');
  const fromDate = rawFrom ? dateSchema.safeParse(rawFrom) : null;
  const toDate = rawTo ? dateSchema.safeParse(rawTo) : null;
  if ((rawFrom && !fromDate?.success) || (rawTo && !toDate?.success)) {
    return NextResponse.json({ error: 'Invalid date format (use YYYY-MM-DD)' }, { status: 400 });
  }
  const dateRange = fromDate?.success && toDate?.success ? { from: fromDate.data, to: toDate.data } : undefined;

  // Auth check
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch org name
  const { data: orgId } = await supabase.rpc('get_user_org');
  if (!orgId) return NextResponse.json({ error: 'Organization not found', status: 404 }, { status: 404 });
  const { data: orgRow } = await supabase.from('organizations').select('name').eq('id', orgId).single();
  if (!orgRow?.name) return NextResponse.json({ error: 'Organization name not configured', status: 404 }, { status: 404 });
  const orgName = orgRow.name;

  try {
    const cra = await getCRAFormData(taxYear.data, dateRange);

    const jsPDFMod = await import('jspdf');
    const doc = new jsPDFMod.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageW = 215.9;
    const margin = 18;
    const contentW = pageW - margin * 2;
    let y = 0;

    // ─── Helper Functions ───
    const fmt = (n: number) => `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    const addPage = () => { doc.addPage(); y = margin; };
    const checkPage = () => { if (y > 260) addPage(); };

    // ─── Cover Page ───
    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, pageW, 279.4, 'F');
    doc.setTextColor(190, 169, 142); // champagne
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('CRA Audit Package', margin, 55);
    doc.setFontSize(16);
    doc.setTextColor(220, 220, 220);
    doc.text(orgName, margin, 68);
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.text(`Tax Year: ${taxYear}`, margin, 80);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-CA')}`, margin, 88);
    doc.text(`Receipts: ${cra.receiptCount}  |  Period: ${cra.dateRange.from} to ${cra.dateRange.to}`, margin, 96);

    // Summary boxes
    const boxes = [
      { label: 'Total Business Expenses', value: fmt(cra.totalBusinessExpenses) },
      { label: 'Total GST Paid', value: fmt(cra.totalGSTPaid) },
      { label: 'Mileage Deduction', value: fmt(cra.mileageTotalDeduction) },
      { label: 'Net Taxable (Est.)', value: fmt(cra.totalBusinessExpenses - cra.totalGSTPaid) },
    ];
    boxes.forEach((box, i) => {
      const bx = margin + (i % 2) * (contentW / 2 + 3);
      const by = 120 + Math.floor(i / 2) * 28;
      doc.setFillColor(35, 35, 35);
      doc.roundedRect(bx, by, contentW / 2 - 3, 22, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(box.label.toUpperCase(), bx + 4, by + 8);
      doc.setFontSize(14);
      doc.setTextColor(190, 169, 142);
      doc.setFont('helvetica', 'bold');
      doc.text(box.value, bx + 4, by + 17);
    });

    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text('Prepared by Leduc Receipt Pro — for accountant review only, not an official CRA filing.', margin, 275);

    // ─── T2125 Pre-Fill Page ───
    addPage();
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, pageW, 279.4, 'F');
    y = margin;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(`T2125 — Business & Professional Income (${taxYear})`, margin, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Statement of Business Activities — Pre-Fill Data (Review with your accountant)', margin, y);
    y += 10;

    // Part 2: Business expenses by category
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Part 2 — Business Expenses', margin, y);
    y += 7;

    // Table header
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('Category', margin + 2, y + 5);
    doc.text('Receipts', margin + contentW * 0.55, y + 5);
    doc.text('GST Paid', margin + contentW * 0.70, y + 5);
    doc.text('Total (CAD)', margin + contentW * 0.85, y + 5);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let rowAlt = false;
    for (const cat of cra.expensesByCategory) {
      checkPage();
      if (rowAlt) {
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, y, contentW, 7, 'F');
      }
      rowAlt = !rowAlt;
      doc.setTextColor(40, 40, 40);
      doc.text(cat.category.slice(0, 30), margin + 2, y + 5);
      doc.text(String(cat.receiptCount), margin + contentW * 0.55, y + 5);
      doc.text(fmt(cat.gst), margin + contentW * 0.70, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(fmt(cat.total), margin + contentW * 0.85, y + 5);
      doc.setFont('helvetica', 'normal');
      y += 7;
    }

    // Total row
    checkPage();
    doc.setFillColor(190, 169, 142);
    doc.rect(margin, y, contentW, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text('TOTAL', margin + 2, y + 5.5);
    doc.text(fmt(cra.totalGSTPaid), margin + contentW * 0.70, y + 5.5);
    doc.text(fmt(cra.totalBusinessExpenses), margin + contentW * 0.85, y + 5.5);
    y += 14;

    // ─── T777 Pre-Fill Page ───
    checkPage();
    if (y > 180) addPage();
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(`T777 — Employment Expenses (${taxYear})`, margin, y);
    y += 7;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Statement of Employment Expenses — Mileage & Vehicle Expenses', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Vehicle & Mileage (Line 9281)', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Total km driven for business: ${cra.mileageTotalKm.toLocaleString()} km`, margin + 2, y);
    y += 5.5;
    doc.text(`CRA mileage deduction: ${fmt(cra.mileageTotalDeduction)}`, margin + 2, y);
    y += 5.5;

    if (cra.mileageByVehicle.length > 0) {
      y += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('By Vehicle:', margin + 2, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      for (const v of cra.mileageByVehicle) {
        checkPage();
        doc.text(`  ${v.vehicleNickname}: ${v.km} km → ${fmt(v.amount)}`, margin + 2, y);
        y += 5.5;
      }
    }

    // ─── Top Vendors Page ───
    addPage();
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, pageW, 279.4, 'F');
    y = margin;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Top Vendors by Spend', margin, y);
    y += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Business numbers (GST/BN) required for ITC claims — verify with CRA before filing.', margin, y);
    y += 8;

    // Vendor table
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('Vendor', margin + 2, y + 5);
    doc.text('BN/GST#', margin + contentW * 0.45, y + 5);
    doc.text('Receipts', margin + contentW * 0.72, y + 5);
    doc.text('Total', margin + contentW * 0.87, y + 5);
    y += 7;

    doc.setFont('helvetica', 'normal');
    rowAlt = false;
    for (const v of cra.topVendors) {
      checkPage();
      if (rowAlt) {
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, y, contentW, 7, 'F');
      }
      rowAlt = !rowAlt;
      const hasBN = v.business_number && v.business_number.trim();
      doc.setTextColor(40, 40, 40);
      doc.text(v.vendor_name.slice(0, 28), margin + 2, y + 5);
      if (hasBN) {
        doc.setTextColor(16, 185, 129); // emerald
        doc.text(v.business_number!.slice(0, 20), margin + contentW * 0.45, y + 5);
      } else {
        doc.setTextColor(239, 68, 68); // red
        doc.text('MISSING', margin + contentW * 0.45, y + 5);
      }
      doc.setTextColor(40, 40, 40);
      doc.text(String(v.receiptCount), margin + contentW * 0.72, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(fmt(v.total), margin + contentW * 0.87, y + 5);
      doc.setFont('helvetica', 'normal');
      y += 7;
    }

    // Footer on each page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Prepared by Leduc Receipt Pro — for accountant review only, not an official CRA filing. Page ${i} of ${pageCount}`,
        margin,
        272
      );
      doc.text(`${orgName} | Tax Year ${taxYear}`, pageW - margin - 60, 272);
    }

    const pdfBytes = doc.output('arraybuffer');
    
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CRA-Package-${taxYear}-${orgName.replace(/\s/g, '-')}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    logError(err, { action: 'generate_cra_pdf', taxYear });
    return NextResponse.json({ error: 'Failed to generate CRA package.' }, { status: 500 });
  }
}
