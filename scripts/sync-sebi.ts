// scripts/sync-sebi.ts
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import Database from 'better-sqlite3';

const DB_PATH = path.resolve(__dirname, '../data/registry.sqlite');
const XLSX_PATH = path.resolve(process.cwd(), 'sebi_registry.xlsx'); // download manually or via script

function ensureDb() {
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS registry (
      regno TEXT PRIMARY KEY,
      name TEXT,
      entityType TEXT,
      status TEXT,
      raw JSON,
      updated_at TEXT
    );
  `);
  return db;
}

function normalizeRegNo(s: string) {
  return s.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

function loadXlsxToDb() {
  if (!fs.existsSync(XLSX_PATH)) throw new Error('XLSX missing: ' + XLSX_PATH);
  const wb = XLSX.readFile(XLSX_PATH);
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]) as any[];
  const db = ensureDb();
  const insert = db.prepare(
    `INSERT OR REPLACE INTO registry(regno,name,entityType,status,raw,updated_at) VALUES(@regno,@name,@entityType,@status,@raw,@updated_at)`
  );
  const now = new Date().toISOString();
  const tx = db.transaction((rows: any[]) => {
    for (const r of rows) {
      const regno = normalizeRegNo(
        String(r['Registration No'] || r['RegNo'] || r.regno || '')
      );
      insert.run({
        regno,
        name: r['Name'] || r.name || '',
        entityType: r['Category'] || r.entityType || '',
        status: r['Status'] || 'Active',
        raw: JSON.stringify(r),
        updated_at: now,
      });
    }
  });
  tx(rows);
  db.close();
  console.log('sync complete:', rows.length);
}

loadXlsxToDb();
