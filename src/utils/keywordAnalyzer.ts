/* ==========================================================================
   Keyword Analyzer - 关键词分析模块
   Step 2 & 3: 交集分析、市场关键词分类、领域词提取
   ========================================================================== */

import type {
  CleanResult,
  KeywordFrequency,
  MarketKeywordResult,
  UniqueKeywordResult,
  KeywordEntry,
  CONFIG
} from '../types';

// --------------------------------------------------------------------------
// Step 2: 统计词频并分类市场关键词
// --------------------------------------------------------------------------

export function analyzeMarketKeywords(
  cleanResults: CleanResult[],
  config: typeof CONFIG
): MarketKeywordResult {
  // 合并所有清洗后的关键词
  const allKeywords: KeywordEntry[] = [];
  cleanResults.forEach(result => {
    allKeywords.push(...result.cleanedKeywords);
  });

  // 统计每个关键词的出现频次和来源
  const frequencyMap = new Map<string, KeywordFrequency>();

  allKeywords.forEach(entry => {
    const lowerKeyword = entry.keyword.toLowerCase();
    const existing = frequencyMap.get(lowerKeyword);

    if (existing) {
      existing.frequency++;
      if (!existing.sources.includes(entry.source)) {
        existing.sources.push(entry.source);
      }
      // 保留有数据的版本
      if (entry.searchVolume !== undefined && existing.searchVolume === undefined) {
        existing.searchVolume = entry.searchVolume;
      }
      if (entry.cpc !== undefined && existing.cpc === undefined) {
        existing.cpc = entry.cpc;
      }
      if (entry.kd !== undefined && existing.kd === undefined) {
        existing.kd = entry.kd;
      }
    } else {
      frequencyMap.set(lowerKeyword, {
        keyword: entry.keyword,
        frequency: 1,
        sources: [entry.source],
        searchVolume: entry.searchVolume,
        cpc: entry.cpc,
        kd: entry.kd,
      });
    }
  });

  // 筛选通用关键词（freq >= 2）
  const commonKeywords: KeywordFrequency[] = [];
  frequencyMap.forEach(kf => {
    if (kf.frequency >= 2) {
      commonKeywords.push(kf);
    }
  });

  // 根据通用关键词数量决定阈值
  const totalCommonCount = commonKeywords.length;
  const threshold = totalCommonCount > config.BIG_DATA_LIMIT
    ? config.COMMON_THRESHOLD_HIGH
    : config.COMMON_THRESHOLD_LOW;

  // 筛选市场关键词
  const marketKeywords = commonKeywords.filter(kf => kf.frequency >= threshold);

  // 按频次降序排列
  commonKeywords.sort((a, b) => b.frequency - a.frequency);
  marketKeywords.sort((a, b) => b.frequency - a.frequency);

  return {
    commonKeywords,
    marketKeywords,
    threshold,
    totalCommonCount,
  };
}

// --------------------------------------------------------------------------
// Step 3: 提取各品牌的独有领域词
// 规则：完全删除所有 freq >= 2 的词，不保留任何一个
// --------------------------------------------------------------------------

export function extractUniqueKeywords(
  cleanResults: CleanResult[],
  marketResult: MarketKeywordResult
): UniqueKeywordResult[] {
  // 收集所有需要删除的词（freq >= 2）
  const toRemoveSet = new Set<string>();
  marketResult.commonKeywords.forEach(kf => {
    toRemoveSet.add(kf.keyword.toLowerCase());
  });

  // 为每个品牌提取独有词
  return cleanResults.map(result => {
    const uniqueKeywords = result.cleanedKeywords.filter(entry => {
      const lowerKeyword = entry.keyword.toLowerCase();
      return !toRemoveSet.has(lowerKeyword);
    });

    return {
      brandName: result.brandName,
      uniqueKeywords,
    };
  });
}

// --------------------------------------------------------------------------
// 导出工具函数：关键词列表转CSV格式
// --------------------------------------------------------------------------

export function keywordsToCSV(keywords: KeywordEntry[] | KeywordFrequency[]): string {
  const headers = ['Keyword', 'Search Volume', 'CPC', 'KD', 'Source/Frequency'];
  const rows = [headers.join(',')];

  keywords.forEach(kw => {
    const isFreq = 'frequency' in kw;
    const row = [
      `"${kw.keyword.replace(/"/g, '""')}"`,
      kw.searchVolume ?? '',
      kw.cpc ?? '',
      kw.kd ?? '',
      isFreq ? (kw as KeywordFrequency).frequency : (kw as KeywordEntry).source,
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

// --------------------------------------------------------------------------
// 统计摘要
// --------------------------------------------------------------------------

export interface AnalysisSummary {
  totalBrands: number;
  totalOriginalKeywords: number;
  totalCleanedKeywords: number;
  totalCommonKeywords: number;
  totalMarketKeywords: number;
  usedThreshold: number;
}

export function generateSummary(
  cleanResults: CleanResult[],
  marketResult: MarketKeywordResult
): AnalysisSummary {
  let totalOriginal = 0;
  let totalCleaned = 0;

  cleanResults.forEach(result => {
    totalOriginal += result.duplicates.length + result.brandKeywords.length + result.cleanedKeywords.length;
    totalCleaned += result.cleanedKeywords.length;
  });

  return {
    totalBrands: cleanResults.length,
    totalOriginalKeywords: totalOriginal,
    totalCleanedKeywords: totalCleaned,
    totalCommonKeywords: marketResult.totalCommonCount,
    totalMarketKeywords: marketResult.marketKeywords.length,
    usedThreshold: marketResult.threshold,
  };
}
