/* ==========================================================================
   Data Clean - 数据清洗模块
   Step 1: 检测内部重复词和品牌流量词
   ========================================================================== */

import type { BrandData, CleanableItem, CleanResult, KeywordEntry } from '../types';

// --------------------------------------------------------------------------
// 生成唯一ID
// --------------------------------------------------------------------------

let idCounter = 0;
function generateId(): string {
  return `clean_${++idCounter}_${Date.now()}`;
}

// --------------------------------------------------------------------------
// 检测单个品牌数据中的可清洗项
// --------------------------------------------------------------------------

export function detectCleanableItems(brandData: BrandData): CleanResult {
  const { brandName, keywords } = brandData;

  // 统计词频，检测内部重复
  const keywordCount = new Map<string, number>();
  keywords.forEach(entry => {
    const lowerKeyword = entry.keyword.toLowerCase();
    keywordCount.set(lowerKeyword, (keywordCount.get(lowerKeyword) || 0) + 1);
  });

  const duplicates: CleanableItem[] = [];
  const brandKeywords: CleanableItem[] = [];
  const seenDuplicates = new Set<string>();
  const seenBrandKeywords = new Set<string>();

  // 品牌名转小写，用于匹配
  const brandLower = brandName.toLowerCase();
  // 分词处理：支持空格、连字符分隔的品牌名
  const brandParts = brandLower.split(/[\s\-_]+/).filter(p => p.length > 2);

  keywords.forEach(entry => {
    const lowerKeyword = entry.keyword.toLowerCase();

    // 检测内部重复（同一文件内出现多次的词）
    const count = keywordCount.get(lowerKeyword) || 0;
    if (count > 1 && !seenDuplicates.has(lowerKeyword)) {
      seenDuplicates.add(lowerKeyword);
      duplicates.push({
        id: generateId(),
        keyword: entry.keyword,
        source: brandName,
        reason: 'duplicate',
        selected: true,  // 默认选中
        count: count,    // 记录出现次数
      });
    }

    // 检测品牌流量词（去重，同一个词只记录一次）
    const isBrandKeyword = brandParts.some(part => lowerKeyword.includes(part));
    if (isBrandKeyword && !seenBrandKeywords.has(lowerKeyword)) {
      seenBrandKeywords.add(lowerKeyword);
      brandKeywords.push({
        id: generateId(),
        keyword: entry.keyword,
        source: brandName,
        reason: 'brand',
        selected: true,  // 默认选中
      });
    }
  });

  return {
    brandName,
    duplicates,
    brandKeywords,
    cleanedKeywords: [],  // 后续执行清洗后填充
  };
}

// --------------------------------------------------------------------------
// 执行清洗：
// - 重复词：保留1个，删除多余的（去重）
// - 品牌词：全部删除
// --------------------------------------------------------------------------

export function executeClean(
  brandData: BrandData,
  cleanResult: CleanResult
): KeywordEntry[] {
  // 收集要完全删除的品牌词
  const brandWordsToRemove = new Set(
    cleanResult.brandKeywords
      .filter(item => item.selected)
      .map(item => item.keyword.toLowerCase())
  );

  // 收集要去重的重复词（保留1个）
  const duplicatesToDedupe = new Set(
    cleanResult.duplicates
      .filter(item => item.selected)
      .map(item => item.keyword.toLowerCase())
  );

  const seen = new Set<string>();
  const cleaned: KeywordEntry[] = [];

  brandData.keywords.forEach(entry => {
    const lowerKeyword = entry.keyword.toLowerCase();

    // 品牌词：全部删除
    if (brandWordsToRemove.has(lowerKeyword)) {
      return;
    }

    // 重复词：保留第一个，删除多余的
    if (duplicatesToDedupe.has(lowerKeyword)) {
      if (seen.has(lowerKeyword)) {
        return;  // 已经保留过一个了，跳过
      }
      seen.add(lowerKeyword);
      cleaned.push(entry);
      return;
    }

    // 非重复非品牌词：也要去重（以防万一有漏掉的重复）
    if (seen.has(lowerKeyword)) {
      return;
    }
    seen.add(lowerKeyword);
    cleaned.push(entry);
  });

  return cleaned;
}

// --------------------------------------------------------------------------
// 批量检测所有品牌数据
// --------------------------------------------------------------------------

export function detectAllCleanableItems(brandDataList: BrandData[]): CleanResult[] {
  return brandDataList.map(detectCleanableItems);
}

// --------------------------------------------------------------------------
// 批量执行清洗
// --------------------------------------------------------------------------

export function executeAllClean(
  brandDataList: BrandData[],
  cleanResults: CleanResult[]
): CleanResult[] {
  return cleanResults.map((result, index) => {
    const cleanedKeywords = executeClean(brandDataList[index], result);
    return {
      ...result,
      cleanedKeywords,
    };
  });
}
