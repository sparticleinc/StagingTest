import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface GeneratedDoc {
  filePath: string;
  fileName: string;
  format: string;
  verificationQ: string;
  expectedA: string;
}

const VERIFICATION_CONTENT = `GBase E2E Test Company was founded in 2020.
The CEO is Tanaka Taro.
Annual revenue is 500 million yen.
The headquarters is located in Shibuya, Tokyo.`;

const VERIFICATION_Q = 'GBase E2E Test Companyの設立年は？';
const EXPECTED_A = '2020';

// Track generated files for cleanup
const generatedFiles: string[] = [];

function isolationContent(format: string): string {
  const ts = Date.now();
  return `Test ID: E2E_Learning_${ts}_${format}\nGenerated at: ${new Date().toISOString()}\nThis document is for automated E2E testing purposes only.`;
}

function fullContent(format: string): string {
  return `${VERIFICATION_CONTENT}\n\n${isolationContent(format)}`;
}

function writeTempFile(fileName: string, content: string | Buffer): string {
  const filePath = path.join(os.tmpdir(), fileName);
  fs.writeFileSync(filePath, content);
  generatedFiles.push(filePath);
  return filePath;
}

function makeResult(filePath: string, fileName: string, format: string): GeneratedDoc {
  return { filePath, fileName, format, verificationQ: VERIFICATION_Q, expectedA: EXPECTED_A };
}

// ── Text-based generators (no external deps) ──

function generateTxt(): GeneratedDoc {
  const fileName = `E2E_Learning_${Date.now()}.txt`;
  const filePath = writeTempFile(fileName, fullContent('txt'));
  return makeResult(filePath, fileName, 'txt');
}

function generateMd(): GeneratedDoc {
  const fileName = `E2E_Learning_${Date.now()}.md`;
  const content = `# E2E Test Document\n\n${VERIFICATION_CONTENT}\n\n---\n\n${isolationContent('md')}`;
  const filePath = writeTempFile(fileName, content);
  return makeResult(filePath, fileName, 'md');
}

function generateCsv(): GeneratedDoc {
  const fileName = `E2E_Learning_${Date.now()}.csv`;
  const rows = [
    'field,value',
    '"company_name","GBase E2E Test Company"',
    '"founded","2020"',
    '"ceo","Tanaka Taro"',
    '"revenue","500 million yen"',
    '"headquarters","Shibuya, Tokyo"',
    `"test_id","E2E_Learning_${Date.now()}_csv"`,
  ];
  const filePath = writeTempFile(fileName, rows.join('\n'));
  return makeResult(filePath, fileName, 'csv');
}

function generateHtml(): GeneratedDoc {
  const fileName = `E2E_Learning_${Date.now()}.html`;
  const content = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>E2E Test Document</title></head>
<body>
<h1>E2E Test Document</h1>
<p>${VERIFICATION_CONTENT.replace(/\n/g, '</p>\n<p>')}</p>
<footer>${isolationContent('html').replace(/\n/g, '<br>')}</footer>
</body>
</html>`;
  const filePath = writeTempFile(fileName, content);
  return makeResult(filePath, fileName, 'html');
}

// ── Binary generators (require npm packages) ──

async function generatePdf(): Promise<GeneratedDoc> {
  const PDFDocument = (await import('pdfkit')).default;
  const fileName = `E2E_Learning_${Date.now()}.pdf`;
  const filePath = path.join(os.tmpdir(), fileName);
  generatedFiles.push(filePath);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(14).text('E2E Test Document', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).text(VERIFICATION_CONTENT);
    doc.moveDown();
    doc.fontSize(9).text(isolationContent('pdf'));
    doc.end();
    stream.on('finish', () => resolve(makeResult(filePath, fileName, 'pdf')));
    stream.on('error', reject);
  });
}

async function generateDocx(): Promise<GeneratedDoc> {
  const { Document, Packer, Paragraph, TextRun } = await import('docx');
  const fileName = `E2E_Learning_${Date.now()}.docx`;
  const filePath = path.join(os.tmpdir(), fileName);
  generatedFiles.push(filePath);

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun({ text: 'E2E Test Document', bold: true, size: 28 })] }),
        ...VERIFICATION_CONTENT.split('\n').map(line =>
          new Paragraph({ children: [new TextRun({ text: line, size: 22 })] })
        ),
        new Paragraph({ children: [new TextRun({ text: '' })] }),
        ...isolationContent('docx').split('\n').map(line =>
          new Paragraph({ children: [new TextRun({ text: line, size: 18, italics: true })] })
        ),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
  return makeResult(filePath, fileName, 'docx');
}

async function generateXlsx(): Promise<GeneratedDoc> {
  const ExcelJSModule = await import('exceljs');
  const ExcelJS = (ExcelJSModule as any).default ?? ExcelJSModule;
  const fileName = `E2E_Learning_${Date.now()}.xlsx`;
  const filePath = path.join(os.tmpdir(), fileName);
  generatedFiles.push(filePath);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Company Info');
  sheet.columns = [
    { header: 'Field', key: 'field', width: 20 },
    { header: 'Value', key: 'value', width: 40 },
  ];
  sheet.addRow({ field: 'Company Name', value: 'GBase E2E Test Company' });
  sheet.addRow({ field: 'Founded', value: '2020' });
  sheet.addRow({ field: 'CEO', value: 'Tanaka Taro' });
  sheet.addRow({ field: 'Revenue', value: '500 million yen' });
  sheet.addRow({ field: 'Headquarters', value: 'Shibuya, Tokyo' });
  sheet.addRow({ field: 'Test ID', value: `E2E_Learning_${Date.now()}_xlsx` });

  await workbook.xlsx.writeFile(filePath);
  return makeResult(filePath, fileName, 'xlsx');
}

// ── Public API ──

const GENERATORS: Record<string, () => GeneratedDoc | Promise<GeneratedDoc>> = {
  txt: generateTxt,
  md: generateMd,
  csv: generateCsv,
  html: generateHtml,
  pdf: generatePdf,
  docx: generateDocx,
  xlsx: generateXlsx,
};

export async function generateTestDoc(format: string): Promise<GeneratedDoc> {
  const gen = GENERATORS[format];
  if (!gen) throw new Error(`Unsupported format: ${format}`);
  return gen();
}

export function cleanupTestDocs(): void {
  for (const fp of generatedFiles) {
    try { fs.unlinkSync(fp); } catch { /* already deleted */ }
  }
  generatedFiles.length = 0;
}
