/**
 * PDF generation service.
 * Feature B: Images included in quotations/POs, excluded from invoices/bills.
 */

const INCLUDE_IMAGE_TYPES = ['quotation', 'sales_order', 'purchase_order', 'delivery_challan'];

async function generatePdf(transaction) {
  const includeImages = INCLUDE_IMAGE_TYPES.includes(transaction.type);
  const html = buildHtml(transaction, includeImages);

  try {
    // Use puppeteer if available
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
    await browser.close();
    return pdf;
  } catch {
    // Fallback: return HTML as buffer if puppeteer fails
    return Buffer.from(html);
  }
}

function buildHtml(txn, includeImages) {
  const typeLabel = {
    quotation: 'QUOTATION', sales_order: 'SALES ORDER', sales_invoice: 'SALES INVOICE',
    delivery_challan: 'DELIVERY CHALLAN', credit_note: 'CREDIT NOTE', pos: 'POS RECEIPT',
    purchase_order: 'PURCHASE ORDER', goods_receipt: 'GOODS RECEIPT NOTE',
    purchase_bill: 'PURCHASE BILL', debit_note: 'DEBIT NOTE',
  }[txn.type] || txn.type.toUpperCase();

  const rows = (txn.lines || []).map((line, i) => `
    <tr>
      <td>${i + 1}</td>
      ${includeImages && line.item?.imageUrl
        ? `<td><img src="${line.item.imageUrl}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;" /></td>`
        : includeImages ? '<td>—</td>' : ''
      }
      <td>${line.item?.name || line.description || ''}</td>
      <td>${line.item?.sku || ''}</td>
      <td style="text-align:right">${line.quantity} ${line.item?.uom || ''}</td>
      <td style="text-align:right">₹${parseFloat(line.unitPrice).toFixed(2)}</td>
      <td style="text-align:right">${line.discountPct || 0}%</td>
      <td style="text-align:right">${line.taxRate || 0}%</td>
      <td style="text-align:right"><strong>₹${parseFloat(line.lineTotal).toFixed(2)}</strong></td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 20px; }
  h1 { color: #1a56db; font-size: 22px; margin: 0; }
  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1a56db; padding-bottom: 16px; margin-bottom: 20px; }
  .badge { display: inline-block; background: #1a56db; color: white; padding: 4px 12px; border-radius: 4px; font-size: 10px; letter-spacing: 1px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #1a56db; color: white; padding: 8px; text-align: left; font-size: 11px; }
  td { padding: 7px 8px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) td { background: #f9fafb; }
  .totals { float: right; width: 260px; margin-top: 20px; }
  .totals table { width: 100%; }
  .totals td { border: none; padding: 4px 8px; }
  .grand-total td { font-size: 14px; font-weight: bold; color: #1a56db; border-top: 2px solid #1a56db; }
  .footer { margin-top: 40px; border-top: 1px solid #eee; padding-top: 12px; font-size: 10px; color: #888; }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>Your Company Name</h1>
    <div style="color:#666;margin-top:4px;">ERP Billing System</div>
    <div class="badge" style="margin-top:8px;">${typeLabel}</div>
  </div>
  <div style="text-align:right">
    <div style="font-size:18px;font-weight:bold;">${txn.number || 'DRAFT'}</div>
    <div>Date: ${txn.date}</div>
    ${txn.dueDate ? `<div>Due: ${txn.dueDate}</div>` : ''}
    <div style="margin-top:8px">
      <strong>To:</strong><br>
      ${txn.contact?.name || '—'}<br>
      ${txn.contact?.address || ''}
    </div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>#</th>
      ${includeImages ? '<th>Image</th>' : ''}
      <th>Item</th>
      <th>SKU</th>
      <th style="text-align:right">Qty</th>
      <th style="text-align:right">Unit Price</th>
      <th style="text-align:right">Disc%</th>
      <th style="text-align:right">Tax%</th>
      <th style="text-align:right">Total</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<div class="totals">
  <table>
    <tr><td>Subtotal</td><td style="text-align:right">₹${parseFloat(txn.subtotal || 0).toFixed(2)}</td></tr>
    <tr><td>Discount</td><td style="text-align:right">₹${parseFloat(txn.discountAmount || 0).toFixed(2)}</td></tr>
    <tr><td>Tax</td><td style="text-align:right">₹${parseFloat(txn.taxAmount || 0).toFixed(2)}</td></tr>
    <tr class="grand-total"><td>Grand Total</td><td style="text-align:right">₹${parseFloat(txn.grandTotal || 0).toFixed(2)}</td></tr>
  </table>
</div>

${txn.notes ? `<div style="clear:both;margin-top:24px;"><strong>Notes:</strong><br>${txn.notes}</div>` : ''}
${txn.terms ? `<div style="margin-top:12px;"><strong>Terms:</strong><br>${txn.terms}</div>` : ''}

<div class="footer" style="clear:both;">
  Generated by ERP Billing System • ${new Date().toLocaleDateString()} • ${typeLabel} — ${txn.number}
</div>
</body>
</html>`;
}

module.exports = { generatePdf };
