import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import * as pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs";
import { createWorker } from "tesseract.js";

// #region agent log
fetch('http://127.0.0.1:7938/ingest/763aa543-e515-44e9-974e-e2ad48dcfc74',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ad41e4'},body:JSON.stringify({sessionId:'ad41e4',runId:'pre-fix',hypothesisId:'H1',location:'src/lib/incomeScan.ts:6',message:'incomeScan module loaded',data:{hasWindow:typeof window!=='undefined',workerImportType:typeof (pdfjsWorker as unknown),workerImportKeys:Object.keys(pdfjsWorker as unknown as Record<string, unknown>).slice(0,10)},timestamp:Date.now()})}).catch(()=>{});
// #endregion agent log

// Turbopack/Next client bundles do not provide a constructible Worker export here.
// Use a URL worker source instead of constructing a worker at import-time.
if (typeof window !== "undefined") {
  // #region agent log
  fetch('http://127.0.0.1:7938/ingest/763aa543-e515-44e9-974e-e2ad48dcfc74',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ad41e4'},body:JSON.stringify({sessionId:'ad41e4',runId:'pre-fix',hypothesisId:'H3',location:'src/lib/incomeScan.ts:14',message:'setting pdfjs workerSrc',data:{beforeWorkerSrc:(GlobalWorkerOptions as unknown as { workerSrc?: unknown }).workerSrc ?? null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion agent log
  (GlobalWorkerOptions as unknown as { workerSrc: string }).workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
}

function normalizeMoneyToken(token: string): number | null {
  const cleaned = token
    .replace(/₱/g, "")
    .replace(/PHP/gi, "")
    .replace(/\s/g, "")
    .replace(/,/g, "");

  // Accept 1234 or 1234.56
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return value;
}

export function extractAmountFromText(text: string): number | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Prefer "Net Pay" / "NET" / "Take Home" lines
  const preferred = lines.filter((l) =>
    /(net\s*pay|take\s*home|net\s*amount|net\s*salary|net\b)/i.test(l)
  );

  const candidates: number[] = [];

  function pushFromLine(line: string) {
    const tokens = line.match(/(₱\s*)?[\d]{1,3}(?:,[\d]{3})*(?:\.[\d]{1,2})?|\d+(?:\.[\d]{1,2})?/g);
    if (!tokens) return;
    for (const t of tokens) {
      const v = normalizeMoneyToken(t);
      if (v !== null) candidates.push(v);
    }
  }

  for (const l of preferred) pushFromLine(l);
  if (candidates.length === 0) {
    for (const l of lines) pushFromLine(l);
  }

  if (candidates.length === 0) return null;

  // Heuristic: net pay is often the largest meaningful figure on the stub
  return Math.max(...candidates);
}

export async function extractTextFromPdf(file: File): Promise<string> {
  // #region agent log
  fetch('http://127.0.0.1:7938/ingest/763aa543-e515-44e9-974e-e2ad48dcfc74',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ad41e4'},body:JSON.stringify({sessionId:'ad41e4',runId:'pre-fix',hypothesisId:'H2',location:'src/lib/incomeScan.ts:62',message:'extractTextFromPdf start',data:{fileType:file.type,fileName:file.name,fileSize:file.size},timestamp:Date.now()})}).catch(()=>{});
  // #endregion agent log
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data: bytes }).promise;

  const parts: string[] = [];
  const pageCount = Math.min(pdf.numPages, 2); // keep it quick

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = (content.items as unknown as Array<{ str?: unknown }>)
      .map((it) => (typeof it.str === "string" ? it.str : ""))
      .filter(Boolean);
    parts.push(strings.join(" "));
  }

  return parts.join("\n");
}

export async function ocrImageToText(file: File): Promise<string> {
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(file);
    return data.text ?? "";
  } finally {
    await worker.terminate();
  }
}

export async function scanIncomeAmountFromFile(
  file: File
): Promise<{ amount: number | null; textPreview: string }> {
  // #region agent log
  fetch('http://127.0.0.1:7938/ingest/763aa543-e515-44e9-974e-e2ad48dcfc74',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ad41e4'},body:JSON.stringify({sessionId:'ad41e4',runId:'pre-fix',hypothesisId:'H2',location:'src/lib/incomeScan.ts:93',message:'scanIncomeAmountFromFile called',data:{fileType:file.type,fileName:file.name,fileSize:file.size},timestamp:Date.now()})}).catch(()=>{});
  // #endregion agent log
  if (file.type === "application/pdf") {
    const text = await extractTextFromPdf(file);
    return { amount: extractAmountFromText(text), textPreview: text.slice(0, 600) };
  }

  if (file.type.startsWith("image/")) {
    const text = await ocrImageToText(file);
    return { amount: extractAmountFromText(text), textPreview: text.slice(0, 600) };
  }

  return { amount: null, textPreview: "" };
}

