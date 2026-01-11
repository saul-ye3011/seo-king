/* ==========================================================================
   Excel Parser - 文件解析模块
   负责读取Excel文件并转换为内部数据结构
   ========================================================================== */

import * as XLSX from 'xlsx';
import type { BrandData, KeywordEntry } from '../types';

// --------------------------------------------------------------------------
// 从文件名提取品牌名
// --------------------------------------------------------------------------

function extractBrandName(fileName: string): string {
  return fileName.replace(/\.(xlsx|xls|csv)$/i, '').trim();
}

// --------------------------------------------------------------------------
// 解析单个Excel文件
// --------------------------------------------------------------------------

export async function parseExcelFile(file: File): Promise<BrandData> {
  const brandName = extractBrandName(file.name);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // 取第一个工作表
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // 转换为JSON数组
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: ''
        }) as unknown[][];

        const keywords = parseSheetData(jsonData, brandName);

        resolve({
          brandName,
          keywords,
          originalCount: keywords.length,
        });
      } catch (error) {
        reject(new Error(`解析文件 ${file.name} 失败: ${error}`));
      }
    };

    reader.onerror = () => reject(new Error(`读取文件 ${file.name} 失败`));
    reader.readAsArrayBuffer(file);
  });
}

// --------------------------------------------------------------------------
// 解析工作表数据
// 自动检测列头，支持多种常见格式
// --------------------------------------------------------------------------

function parseSheetData(rows: unknown[][], brandName: string): KeywordEntry[] {
  if (rows.length < 2) return [];

  // 检测列头
  const headerRow = rows[0] as string[];
  const columnMap = detectColumns(headerRow);

  if (columnMap.keyword === -1) {
    // 如果没检测到关键词列，默认第一列为关键词
    columnMap.keyword = 0;
  }

  const keywords: KeywordEntry[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const keyword = String(row[columnMap.keyword] || '').trim();

    if (!keyword) continue;

    const entry: KeywordEntry = {
      keyword,
      source: brandName,
    };

    if (columnMap.searchVolume !== -1) {
      entry.searchVolume = parseNumber(row[columnMap.searchVolume]);
    }
    if (columnMap.cpc !== -1) {
      entry.cpc = parseNumber(row[columnMap.cpc]);
    }
    if (columnMap.kd !== -1) {
      entry.kd = parseNumber(row[columnMap.kd]);
    }

    keywords.push(entry);
  }

  return keywords;
}

// --------------------------------------------------------------------------
// 检测列头映射
// --------------------------------------------------------------------------

interface ColumnMap {
  keyword: number;
  searchVolume: number;
  cpc: number;
  kd: number;
}

function detectColumns(headerRow: string[]): ColumnMap {
  const map: ColumnMap = {
    keyword: -1,
    searchVolume: -1,
    cpc: -1,
    kd: -1,
  };

  const keywordPatterns = [/keyword/i, /关键词/i, /query/i, /term/i];
  const svPatterns = [/search.*volume/i, /sv/i, /搜索量/i, /volume/i, /流量/i];
  const cpcPatterns = [/cpc/i, /cost/i, /点击成本/i];
  const kdPatterns = [/kd/i, /difficulty/i, /难度/i];

  headerRow.forEach((header, index) => {
    const h = String(header).toLowerCase();

    if (map.keyword === -1 && keywordPatterns.some(p => p.test(h))) {
      map.keyword = index;
    }
    if (map.searchVolume === -1 && svPatterns.some(p => p.test(h))) {
      map.searchVolume = index;
    }
    if (map.cpc === -1 && cpcPatterns.some(p => p.test(h))) {
      map.cpc = index;
    }
    if (map.kd === -1 && kdPatterns.some(p => p.test(h))) {
      map.kd = index;
    }
  });

  return map;
}

// --------------------------------------------------------------------------
// 数字解析辅助函数
// --------------------------------------------------------------------------

function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

// --------------------------------------------------------------------------
// 批量解析多个文件
// --------------------------------------------------------------------------

export async function parseMultipleFiles(files: FileList): Promise<BrandData[]> {
  const promises = Array.from(files).map(file => parseExcelFile(file));
  return Promise.all(promises);
}
