// Export utilities - convert HubForge outputs to Word, Excel, PDF
// All functions run client-side (no server needed).

import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import type { ToCData, LogframeData } from './types'

// ============================================================
// MARKDOWN → WORD (.docx)
// ============================================================
export async function exportStrategyToWord(markdown: string, filename = 'hubforge-strategy.docx') {
  const doc = new Document({
    sections: [{
      properties: {},
      children: parseMarkdownToDocx(markdown),
    }],
  })
  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, filename)
}

function parseMarkdownToDocx(md: string): Paragraph[] {
  const lines = md.split('\n')
  const paragraphs: Paragraph[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^(#{1,6})/)![1].length
      const content = line.replace(/^#{1,6}\s/, '')
      const headingLevel = level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : level === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4
      paragraphs.push(new Paragraph({ heading: headingLevel, children: parseInlineDocx(content) }))
    } else if (/^\s*[-*]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s/, '')); i++ }
      i--
      for (const item of items) paragraphs.push(new Paragraph({ bullet: { level: 0 }, children: parseInlineDocx(item) }))
    } else if (/^\s*\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s/, '')); i++ }
      i--
      for (let j = 0; j < items.length; j++) paragraphs.push(new Paragraph({ numbering: { reference: 'default-numbering', level: 0 }, children: parseInlineDocx(items[j]) }))
    } else if (line.trim() === '') {
      // skip
    } else {
      paragraphs.push(new Paragraph({ children: parseInlineDocx(line) }))
    }
    i++
  }
  return paragraphs
}

function parseInlineDocx(text: string): TextRun[] {
  const runs: TextRun[] = []
  let rest = text
  while (rest.length > 0) {
    const bold = rest.match(/\*\*(.+?)\*\*/)
    const code = rest.match(/`(.+?)`/)
    const cands = [bold, code].filter(Boolean) as RegExpMatchArray[]
    if (cands.length === 0) { runs.push(new TextRun({ text: rest })); break }
    cands.sort((a, b) => a.index! - b.index!)
    const next = cands[0]
    if (next.index! > 0) runs.push(new TextRun({ text: rest.slice(0, next.index!) }))
    if (next === bold) runs.push(new TextRun({ text: bold![1], bold: true }))
    else runs.push(new TextRun({ text: code![1], font: 'Courier New', size: 20 }))
    rest = rest.slice(next.index! + next[0].length)
  }
  return runs
}

// ============================================================
// LOGFRAME → EXCEL (.xlsx)
// ============================================================
export function exportLogframeToExcel(logframe: LogframeData, filename = 'hubforge-logframe.xlsx') {
  const rows: any[][] = [
    ['Level', 'Description', 'Indicators (OVI)', 'Means of Verification', 'Assumptions'],
    [logframe.goal.level, logframe.goal.description, logframe.goal.ovi, logframe.goal.mov, logframe.goal.assumptions],
    [logframe.purpose.level, logframe.purpose.description, logframe.purpose.ovi, logframe.purpose.mov, logframe.purpose.assumptions],
  ]
  for (const o of logframe.outputs) rows.push([o.level, o.description, o.ovi, o.mov, o.assumptions])
  for (const a of logframe.activities) rows.push([a.level, a.description, a.ovi, a.mov, a.assumptions])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 15 }, { wch: 40 }, { wch: 30 }, { wch: 25 }, { wch: 25 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Logframe')
  XLSX.writeFile(wb, filename)
}

// ============================================================
// TOC → EXCEL (.xlsx)
// ============================================================
export function exportToCToExcel(toc: ToCData, filename = 'hubforge-theory-of-change.xlsx') {
  const wb = XLSX.utils.book_new()

  // Main ToC sheet
  const tocRows: any[][] = [
    ['Theory of Change'],
    ['Target Population', toc.targetPopulation],
    [],
    ['Inputs'],
    ...toc.inputs.map((i: string) => [i]),
    [],
    ['Activities'],
    ...toc.activities.map((a: string) => [a]),
    [],
    ['Outputs'],
    ...toc.outputs.map((o: string) => [o]),
    [],
    ['Outcomes'],
    ...toc.outcomes.map((o: string) => [o]),
    [],
    ['Impact', toc.impact],
    [],
    ['Assumptions'],
    ...toc.assumptions.map((a: string) => [a]),
    [],
    ['External Factors'],
    ...toc.externalFactors.map((f: string) => [f]),
  ]
  const ws = XLSX.utils.aoa_to_sheet(tocRows)
  ws['!cols'] = [{ wch: 25 }, { wch: 60 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Theory of Change')

  XLSX.writeFile(wb, filename)
}

// ============================================================
// STRATEGY → PDF
// ============================================================
export function exportStrategyToPDF(markdown: string, filename = 'hubforge-strategy.pdf') {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 40
  const maxWidth = pageWidth - margin * 2
  let y = margin

  const lines = markdown.split('\n')
  for (const line of lines) {
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^(#{1,6})/)![1].length
      const content = line.replace(/^#{1,6}\s/, '')
      const fontSize = level <= 2 ? 16 : level === 3 ? 13 : 11
      if (y > pageHeight - margin - fontSize) { pdf.addPage(); y = margin }
      y += fontSize * 0.5
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(fontSize)
      const wrapped = pdf.splitTextToSize(content, maxWidth)
      for (const w of wrapped) { if (y > pageHeight - margin) { pdf.addPage(); y = margin } pdf.text(w, margin, y); y += fontSize * 1.3 }
      y += 4
    } else if (/^\s*[-*]\s/.test(line)) {
      const content = line.replace(/^\s*[-*]\s/, '')
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      const wrapped = pdf.splitTextToSize('• ' + content, maxWidth - 10)
      for (const w of wrapped) { if (y > pageHeight - margin) { pdf.addPage(); y = margin } pdf.text(w, margin + 10, y); y += 13 }
    } else if (line.trim() === '') {
      y += 6
    } else {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      const wrapped = pdf.splitTextToSize(line, maxWidth)
      for (const w of wrapped) { if (y > pageHeight - margin) { pdf.addPage(); y = margin } pdf.text(w, margin, y); y += 13 }
    }
  }
  pdf.save(filename)
}

// ============================================================
// FULL REPORT → PDF (strategy + ToC + Logframe combined)
// ============================================================
export function exportFullReportToPDF(markdown: string, toc: ToCData | null, logframe: LogframeData | null, filename = 'hubforge-full-report.pdf') {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 40
  const maxWidth = pageWidth - margin * 2
  let y = margin

  const addText = (text: string, font: 'helvetica' | 'courier' = 'helvetica', size = 10, bold = false, indent = 0) => {
    pdf.setFont(font, bold ? 'bold' : 'normal')
    pdf.setFontSize(size)
    const wrapped = pdf.splitTextToSize(text, maxWidth - indent)
    for (const w of wrapped) {
      if (y > pageHeight - margin) { pdf.addPage(); y = margin }
      pdf.text(w, margin + indent, y); y += size * 1.4
    }
  }

  // Title page
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(24)
  y = 200
  addText('HubForge OS', 'helvetica', 24, true)
  y += 10
  addText('Program Strategy Report', 'helvetica', 16, false)
  y += 40
  addText(`Generated: ${new Date().toLocaleDateString()}`, 'helvetica', 10, false)

  // Strategy
  pdf.addPage(); y = margin
  addText('Strategy Document', 'helvetica', 16, true)
  y += 10
  const lines = markdown.split('\n')
  for (const line of lines) {
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^(#{1,6})/)![1].length
      const content = line.replace(/^#{1,6}\s/, '')
      y += level <= 2 ? 8 : 4
      addText(content, 'helvetica', level <= 2 ? 14 : 12, true)
      y += 2
    } else if (/^\s*[-*]\s/.test(line)) {
      addText('• ' + line.replace(/^\s*[-*]\s/, ''), 'helvetica', 10, false, 10)
    } else if (line.trim() !== '') {
      addText(line, 'helvetica', 10)
    }
  }

  // Theory of Change
  if (toc) {
    pdf.addPage(); y = margin
    addText('Theory of Change', 'helvetica', 16, true); y += 10
    addText(`Target Population: ${toc.targetPopulation}`, 'helvetica', 11, true); y += 6
    const sections: [string, string[]][] = [
      ['Inputs', toc.inputs], ['Activities', toc.activities], ['Outputs', toc.outputs],
      ['Outcomes', toc.outcomes], ['Assumptions', toc.assumptions], ['External Factors', toc.externalFactors],
    ]
    for (const [title, items] of sections) {
      addText(title, 'helvetica', 12, true); y += 4
      for (const item of items) addText('• ' + item, 'helvetica', 10, false, 10)
      y += 4
    }
    addText('Impact', 'helvetica', 12, true); y += 4
    addText(toc.impact, 'helvetica', 11, true)
  }

  // Logframe
  if (logframe) {
    pdf.addPage(); y = margin
    addText('Logical Framework', 'helvetica', 16, true); y += 10
    const allRows = [logframe.goal, logframe.purpose, ...logframe.outputs, ...logframe.activities]
    for (const row of allRows) {
      addText(row.level, 'helvetica', 12, true); y += 2
      addText(`Description: ${row.description}`, 'helvetica', 10); y += 2
      addText(`Indicators: ${row.ovi}`, 'helvetica', 10); y += 2
      addText(`Verification: ${row.mov}`, 'helvetica', 10); y += 2
      addText(`Assumptions: ${row.assumptions}`, 'helvetica', 10); y += 8
    }
  }

  pdf.save(filename)
}

// ============================================================
// Helpers
// ============================================================
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
