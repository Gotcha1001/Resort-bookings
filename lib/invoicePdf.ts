// lib/invoicePdf.ts
//
// Builds a one-page A4 invoice PDF entirely in the browser with jsPDF.
// `jspdf` is loaded with a dynamic import so it only downloads when a
// customer actually clicks "Download invoice" (it's ~300 KB).
//
// Install:  npm install jspdf

import type { jsPDF } from "jspdf";

export interface InvoiceData {
  invoiceNumber: string;
  /** Timestamp (ms) the invoice is dated -- normally the payment time. */
  issuedAt: number;
  /** Timestamp (ms) of payment; omit for an unpaid booking. */
  paidAt?: number;
  /** PayFast payment id, shown as the payment reference. */
  paymentReference?: string;
  resort: {
    name: string;
    tagline?: string;
    phone?: string;
    email?: string;
    address?: string;
    logoUrl?: string;
  };
  guest: {
    name: string;
    phone: string;
    email?: string;
  };
  stay: {
    roomName: string;
    roomType: "room" | "cottage";
    startDate: number; // check-in
    endDate: number; // check-out
    nights: number;
    ratePerNight: number;
  };
  total: number;
  isPaid: boolean;
}

type RGB = readonly [number, number, number];

const A4_WIDTH = 210;
const A4_HEIGHT = 297;
const MARGIN = 20;
const RIGHT = A4_WIDTH - MARGIN;

const TEAL: RGB = [13, 148, 136]; // teal-600
const INK: RGB = [28, 25, 23]; // stone-900
const MUTED: RGB = [120, 113, 108]; // stone-500
const RULE: RGB = [231, 229, 228]; // stone-200
const WHITE: RGB = [255, 255, 255];

// ---------------------------------------------------------------------------
// Text / number helpers
// ---------------------------------------------------------------------------

// jsPDF's built-in fonts only cover Latin-1. Intl output can contain
// no-break / narrow spaces, and guest names can contain characters outside
// Latin-1, which would render as garbage. Normalise to something safe.
function safe(text: string): string {
  return text
    .replace(/[\u00A0\u2007\u2009\u202F]/g, " ")
    .replace(/[^\x20-\x7E\u00A1-\u00FF]/g, (ch) => {
      const base = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return /^[\x20-\x7E]$/.test(base) ? base : "?";
    });
}

function formatMoney(amount: number): string {
  const [whole, cents] = amount.toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `R ${grouped}.${cents}`;
}

function formatInvoiceDate(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  return safe(
    new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(date),
  );
}

function setText(doc: jsPDF, color: RGB): void {
  doc.setTextColor(color[0], color[1], color[2]);
}

function wrap(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(safe(text), maxWidth) as string[];
}

// ---------------------------------------------------------------------------
// Logo loading (optional -- any failure just means a text-only header)
// ---------------------------------------------------------------------------

interface LoadedLogo {
  dataUrl: string;
  format: "PNG" | "JPEG";
  width: number;
  height: number;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Unexpected reader result"));
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(blob);
  });
}

function measureImage(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}

async function loadLogo(url: string): Promise<LoadedLogo | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    // jsPDF can embed PNG and JPEG; skip WebP/SVG/etc.
    const format =
      blob.type === "image/png"
        ? "PNG"
        : blob.type === "image/jpeg"
          ? "JPEG"
          : null;
    if (!format) return null;
    const dataUrl = await blobToDataUrl(blob);
    const { width, height } = await measureImage(dataUrl);
    if (width === 0 || height === 0) return null;
    return { dataUrl, format, width, height };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Builder (pure: returns the document, doesn't save it)
// ---------------------------------------------------------------------------

export async function buildInvoicePdf(data: InvoiceData): Promise<jsPDF> {
  const { jsPDF: JsPdf } = await import("jspdf");
  const doc = new JsPdf({ unit: "mm", format: "a4" });
  doc.setProperties({
    title: `Invoice ${data.invoiceNumber}`,
    subject: `Booking invoice - ${safe(data.resort.name)}`,
  });

  // ── Header: logo / resort details (left), invoice meta (right) ──────────
  let leftY = 20;

  const logo = data.resort.logoUrl ? await loadLogo(data.resort.logoUrl) : null;
  if (logo) {
    const scale = Math.min(45 / logo.width, 18 / logo.height);
    const w = logo.width * scale;
    const h = logo.height * scale;
    doc.addImage(logo.dataUrl, logo.format, MARGIN, leftY, w, h);
    leftY += h + 4;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setText(doc, INK);
  const nameLines = wrap(doc, data.resort.name, 95);
  leftY += 5;
  for (const line of nameLines) {
    doc.text(line, MARGIN, leftY);
    leftY += 6.5;
  }
  leftY -= 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setText(doc, MUTED);
  const detailLines: string[] = [];
  if (data.resort.tagline)
    detailLines.push(...wrap(doc, data.resort.tagline, 95));
  if (data.resort.address)
    detailLines.push(...wrap(doc, data.resort.address, 95));
  if (data.resort.phone) detailLines.push(safe(data.resort.phone));
  if (data.resort.email) detailLines.push(safe(data.resort.email));
  for (const line of detailLines) {
    leftY += 4.5;
    doc.text(line, MARGIN, leftY);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  setText(doc, TEAL);
  doc.text("INVOICE", RIGHT, 27, { align: "right" });

  const metaRow = (label: string, value: string, y: number): void => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    setText(doc, MUTED);
    doc.text(label, 128, y);
    doc.setFont("helvetica", "bold");
    setText(doc, INK);
    doc.text(safe(value), RIGHT, y, { align: "right" });
  };
  metaRow("Invoice no.", data.invoiceNumber, 36);
  metaRow("Date", formatInvoiceDate(data.issuedAt), 42);

  let y = Math.max(leftY, 46) + 8;
  doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, RIGHT, y);
  y += 9;

  // ── Billed to (left) / Payment (right) ──────────────────────────────────
  const sectionLabel = (text: string, x: number, atY: number): void => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, MUTED);
    doc.text(text, x, atY);
  };

  const COL2_X = 118;
  sectionLabel("BILLED TO", MARGIN, y);
  sectionLabel("PAYMENT", COL2_X, y);

  let billY = y + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, INK);
  for (const line of wrap(doc, data.guest.name, 85)) {
    doc.text(line, MARGIN, billY);
    billY += 5.5;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setText(doc, MUTED);
  doc.text(safe(data.guest.phone), MARGIN, billY);
  billY += 5;
  if (data.guest.email) {
    doc.text(safe(data.guest.email), MARGIN, billY);
    billY += 5;
  }

  let payY = y + 6;
  // Status badge
  const badgeText = data.isPaid ? "PAID" : "UNPAID";
  const badgeColor: RGB = data.isPaid ? TEAL : MUTED;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const badgeW = doc.getTextWidth(badgeText) + 6;
  doc.setDrawColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(COL2_X, payY - 4.6, badgeW, 6.6, 1.2, 1.2, "S");
  setText(doc, badgeColor);
  doc.text(badgeText, COL2_X + 3, payY);
  if (data.isPaid && data.paidAt !== undefined) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    setText(doc, MUTED);
    doc.text(formatInvoiceDate(data.paidAt), COL2_X + badgeW + 4, payY);
  }
  payY += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setText(doc, MUTED);
  if (data.isPaid) {
    doc.text("Method: PayFast", COL2_X, payY);
    payY += 5;
  }
  if (data.paymentReference) {
    doc.text(`Reference: ${safe(data.paymentReference)}`, COL2_X, payY);
    payY += 5;
  }

  y = Math.max(billY, payY) + 8;

  // ── Line-item table ─────────────────────────────────────────────────────
  const COL_DESC = MARGIN + 3;
  const COL_NIGHTS = 128;
  const COL_RATE = 158;
  const COL_AMOUNT = RIGHT - 3;

  doc.setFillColor(TEAL[0], TEAL[1], TEAL[2]);
  doc.rect(MARGIN, y, RIGHT - MARGIN, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setText(doc, WHITE);
  doc.text("Description", COL_DESC, y + 6);
  doc.text("Nights", COL_NIGHTS, y + 6, { align: "right" });
  doc.text("Rate / night", COL_RATE, y + 6, { align: "right" });
  doc.text("Amount", COL_AMOUNT, y + 6, { align: "right" });
  y += 9 + 7;

  const typeLabel = data.stay.roomType === "cottage" ? "Cottage" : "Room";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  setText(doc, INK);
  const roomLines = wrap(doc, data.stay.roomName, 78);
  const rowTop = y;
  for (const line of roomLines) {
    doc.text(line, COL_DESC, y);
    y += 5.5;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setText(doc, MUTED);
  doc.text(typeLabel, COL_DESC, y);
  y += 4.6;
  doc.text(`Check-in: ${formatInvoiceDate(data.stay.startDate)}`, COL_DESC, y);
  y += 4.6;
  doc.text(`Check-out: ${formatInvoiceDate(data.stay.endDate)}`, COL_DESC, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setText(doc, INK);
  doc.text(String(data.stay.nights), COL_NIGHTS, rowTop, { align: "right" });
  doc.text(formatMoney(data.stay.ratePerNight), COL_RATE, rowTop, {
    align: "right",
  });
  doc.setFont("helvetica", "bold");
  doc.text(formatMoney(data.total), COL_AMOUNT, rowTop, { align: "right" });

  y += 6;
  doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, RIGHT, y);
  y += 9;

  // ── Totals ──────────────────────────────────────────────────────────────
  const totalRow = (
    label: string,
    value: string,
    atY: number,
    emphasis: boolean,
  ): void => {
    doc.setFont("helvetica", emphasis ? "bold" : "normal");
    doc.setFontSize(emphasis ? 12 : 10);
    setText(doc, emphasis ? INK : MUTED);
    doc.text(label, 128, atY);
    setText(doc, INK);
    doc.text(value, COL_AMOUNT, atY, { align: "right" });
  };

  totalRow("Total", formatMoney(data.total), y, true);
  y += 7;
  const amountPaid = data.isPaid ? data.total : 0;
  totalRow("Amount paid", formatMoney(amountPaid), y, false);
  y += 6;
  totalRow("Balance due", formatMoney(data.total - amountPaid), y, false);

  // ── Footer ──────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const thanks = wrap(
    doc,
    `Thank you for choosing ${data.resort.name}.`,
    RIGHT - MARGIN,
  );
  const footerY = A4_HEIGHT - 22 - (thanks.length - 1) * 5;
  doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
  doc.line(MARGIN, footerY - 7, RIGHT, footerY - 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setText(doc, TEAL);
  thanks.forEach((line, i) => {
    doc.text(line, A4_WIDTH / 2, footerY + i * 5, { align: "center" });
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(doc, MUTED);
  doc.text(
    "This invoice was generated automatically and is valid without a signature.",
    A4_WIDTH / 2,
    footerY + (thanks.length - 1) * 5 + 5.5,
    { align: "center" },
  );

  return doc;
}

// ---------------------------------------------------------------------------
// Browser entry point: build + trigger the download
// ---------------------------------------------------------------------------

export async function downloadInvoicePdf(data: InvoiceData): Promise<void> {
  const doc = await buildInvoicePdf(data);
  doc.save(`Invoice-${data.invoiceNumber}.pdf`);
}
