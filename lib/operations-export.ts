import type { CanvasNode } from "./operations-tree";

type OutlineItem = { node: CanvasNode; depth: number };

export function operationsOutline(nodes: CanvasNode[]): OutlineItem[] {
  const children = new Map<string | null, CanvasNode[]>();
  const ids = new Set(nodes.map((node) => node.id));
  for (const node of nodes) {
    const parent = node.parentId && ids.has(node.parentId) ? node.parentId : null;
    children.set(parent, [...(children.get(parent) ?? []), node]);
  }
  const visited = new Set<string>();
  const outline: OutlineItem[] = [];
  function visit(node: CanvasNode, depth: number) {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    outline.push({ node, depth });
    for (const child of children.get(node.id) ?? []) visit(child, depth + 1);
  }
  for (const root of children.get(null) ?? []) visit(root, 0);
  for (const node of nodes) visit(node, 0);
  return outline;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char] ?? char);
}

export function printOperations(nodes: CanvasNode[]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.alert("Please allow pop-ups to print the Operations guide.");
    return;
  }
  const outline = operationsOutline(nodes);
  const pages: { root: CanvasNode; branch: CanvasNode; steps: CanvasNode[]; part: number; total: number }[] = [];
  let root: CanvasNode | null = null;
  let branch: CanvasNode | null = null;
  let steps: CanvasNode[] = [];
  const flush = () => {
    if (!root || !branch) return;
    const total = Math.max(1, Math.ceil(steps.length / 6));
    for (let part = 0; part < total; part++) {
      pages.push({ root, branch, steps: steps.slice(part * 6, (part + 1) * 6), part: part + 1, total });
    }
    steps = [];
  };
  for (const item of outline) {
    if (item.depth === 0) {
      flush();
      root = item.node;
      branch = null;
    } else if (item.depth === 1) {
      flush();
      branch = item.node;
    } else if (branch) {
      steps.push(item.node);
    }
  }
  flush();
  if (!pages.length && root) pages.push({ root, branch: root, steps: [], part: 1, total: 1 });

  const card = (node: CanvasNode, className: string) =>
    `<div class="node ${className}"><h2>${escapeHtml(node.title)}</h2><p>${escapeHtml(node.description)}</p></div>`;
  const content = pages.map(({ root: pageRoot, branch: pageBranch, steps: pageSteps, part, total }) => {
    const stepsHtml = pageSteps.map((step, index) => {
      const row = Math.floor(index / 3);
      const position = index % 3;
      const column = row % 2 === 0 ? 3 - position : position + 1;
      const direction = index === pageSteps.length - 1 ? "" : position === 2 ? "down" : row % 2 === 0 ? "left" : "right";
      return `<div class="step" style="grid-row:${row + 1};grid-column:${column}">${card(step, "step-node")}<span class="connector ${direction}" aria-hidden="true"></span></div>`;
    }).join("");
    return `<section class="print-page">
      <div class="page-label">OPERATIONS NODE TREE <span>${escapeHtml(pageBranch.title)}${total > 1 ? ` · ${part}/${total}` : ""}</span></div>
      <div class="parent-row">${card(pageRoot, "root-node")}<span class="root-arrow" aria-hidden="true">→</span>${card(pageBranch, "branch-node")}<span class="branch-arrow" aria-hidden="true">↓</span></div>
      <div class="steps-grid">${stepsHtml}</div>
    </section>`;
  }).join("\n");
  printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Operations Department - Node Tree</title><style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #202531; font: 12px/1.35 Arial, Helvetica, sans-serif; background: white; }
    .print-page { width: 100%; break-after: page; page-break-after: always; break-inside: avoid; }
    .print-page:last-child { break-after: auto; page-break-after: auto; }
    .page-label { display: flex; justify-content: space-between; align-items: center; height: 22px; margin-bottom: 12px; color: #52627f; font-size: 10px; font-weight: bold; letter-spacing: .08em; text-transform: uppercase; }
    .page-label span { max-width: 65%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; text-align: right; }
    .parent-row { position: relative; display: grid; grid-template-columns: 1fr 74px 1fr; align-items: center; gap: 14px; height: 115px; margin-bottom: 33px; }
    .root-arrow { color: #6481b2; font-size: 32px; font-weight: bold; text-align: center; }
    .branch-arrow { position: absolute; right: 24%; bottom: -32px; color: #6481b2; font-size: 25px; font-weight: bold; }
    .node { height: 100%; overflow: hidden; border: 1.5px solid #bfcee5; border-radius: 12px; background: #fff; box-shadow: 0 2px 6px #dce3ee; padding: 13px 15px; }
    .root-node { border-color: #829ccb; background: #f1f5fc; }
    .branch-node { border-color: #607eb1; background: #eaf1fb; }
    .node h2 { margin: 0 0 7px; color: #17294b; font-size: 15px; line-height: 1.2; }
    .node p { margin: 0; color: #394357; font-size: 11.5px; line-height: 1.35; }
    .steps-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: repeat(2, 210px); column-gap: 30px; row-gap: 27px; }
    .step { position: relative; min-width: 0; }
    .step-node { border-color: #b8c9e4; }
    .connector { position: absolute; display: block; z-index: 2; color: #6481b2; font-size: 24px; font-weight: bold; line-height: 1; }
    .connector.left { left: -26px; top: calc(50% - 12px); }
    .connector.left::after { content: '←'; }
    .connector.right { right: -26px; top: calc(50% - 12px); }
    .connector.right::after { content: '→'; }
    .connector.down { bottom: -28px; left: calc(50% - 9px); }
    .connector.down::after { content: '↓'; }
    @media screen { body { padding: 28px; background: #e7ebf2; } .print-page { max-width: 1047px; min-height: 680px; margin: 0 auto 24px; padding: 16px; background: #fff; box-shadow: 0 4px 18px #b5bfd0; } }
  </style></head><body>${content}<script>window.addEventListener('load', () => { window.focus(); window.print(); });<\/script></body></html>`);
  printWindow.document.close();
}

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const SCALE = 2;
const LEFT = 48;
const RIGHT = 547;
const BOTTOM = 786;

function makePage(pageNumber: number) {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_WIDTH * SCALE;
  canvas.height = PAGE_HEIGHT * SCALE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  context.scale(SCALE, SCALE);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  context.fillStyle = "#17294b";
  context.font = "bold 12px Arial, sans-serif";
  context.fillText("OPERATIONS DEPARTMENT", LEFT, 42);
  context.strokeStyle = "#dce3ee";
  context.beginPath();
  context.moveTo(LEFT, 54);
  context.lineTo(RIGHT, 54);
  context.stroke();
  context.fillStyle = "#667085";
  context.font = "10px Arial, sans-serif";
  context.fillText(`Workflow guide  •  Page ${pageNumber}`, LEFT, 810);
  return { canvas, context };
}

function wrapText(context: CanvasRenderingContext2D, value: string, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of value.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width <= width) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

function pdfFromJpegs(images: Uint8Array[]): Blob {
  const encoder = new TextEncoder();
  const chunks: BlobPart[] = [];
  const offsets: number[] = [0];
  let length = 0;
  const append = (value: string | Uint8Array) => {
    const bytes = typeof value === "string" ? encoder.encode(value) : value;
    chunks.push(bytes as BlobPart);
    length += bytes.byteLength;
  };
  append("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const writeObject = (id: number, parts: (string | Uint8Array)[]) => {
    offsets[id] = length;
    append(`${id} 0 obj\n`);
    for (const part of parts) append(part);
    append("\nendobj\n");
  };
  writeObject(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  const pageIds = images.map((_, index) => 3 + index * 3);
  writeObject(2, [`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${images.length} >>`]);
  images.forEach((image, index) => {
    const pageId = pageIds[index];
    const stream = `q ${PAGE_WIDTH} 0 0 ${PAGE_HEIGHT} 0 0 cm /Im0 Do Q\n`;
    writeObject(pageId, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /XObject << /Im0 ${pageId + 2} 0 R >> >> /Contents ${pageId + 1} 0 R >>`]);
    writeObject(pageId + 1, [`<< /Length ${encoder.encode(stream).byteLength} >>\nstream\n`, stream, "endstream"]);
    writeObject(pageId + 2, [`<< /Type /XObject /Subtype /Image /Width ${PAGE_WIDTH * SCALE} /Height ${PAGE_HEIGHT * SCALE} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.byteLength} >>\nstream\n`, image, "\nendstream"]);
  });
  const xref = length;
  append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  for (let id = 1; id < offsets.length; id++) append(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  append(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks, { type: "application/pdf" });
}

export function downloadOperationsPdf(nodes: CanvasNode[]) {
  const pages: HTMLCanvasElement[] = [];
  let pageNumber = 1;
  let { canvas, context } = makePage(pageNumber);
  let y = 82;

  for (const { node, depth } of operationsOutline(nodes)) {
    const headingSize = depth === 0 ? 21 : depth === 1 ? 16 : 11;
    const bodySize = depth <= 1 ? 11 : 10;
    const headingHeight = depth === 0 ? 29 : depth === 1 ? 24 : 18;
    const lineHeight = depth === 0 ? 17 : 15;
    const bottomGap = depth === 0 ? 28 : depth === 1 ? 20 : 16;
    const left = depth >= 2 ? LEFT + 16 : LEFT;
    context.font = `${bodySize}px Arial, sans-serif`;
    const lines = wrapText(context, node.description, RIGHT - left);
    const blockHeight = headingHeight + lines.length * lineHeight + bottomGap;
    if (y + blockHeight > BOTTOM) {
      pages.push(canvas);
      pageNumber++;
      ({ canvas, context } = makePage(pageNumber));
      y = 82;
    }
    if (depth === 1) {
      context.strokeStyle = "#dce3ee";
      context.beginPath();
      context.moveTo(LEFT, y - 10);
      context.lineTo(RIGHT, y - 10);
      context.stroke();
    }
    context.fillStyle = "#17294b";
    context.font = `bold ${headingSize}px Arial, sans-serif`;
    context.fillText(node.title, left, y);
    y += headingHeight;
    context.fillStyle = depth === 1 ? "#53617a" : "#394357";
    context.font = `${bodySize}px Arial, sans-serif`;
    for (const line of lines) {
      context.fillText(line, left, y);
      y += lineHeight;
    }
    y += bottomGap;
  }
  pages.push(canvas);
  const images = pages.map((page) => {
    const base64 = page.toDataURL("image/jpeg", 0.92).split(",")[1];
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  });
  const url = URL.createObjectURL(pdfFromJpegs(images));
  const link = document.createElement("a");
  link.href = url;
  link.download = "operations-department-workflows.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
