/* ==========================================================================
   SEO King - Type Definitions
   核心数据结构定义
   ========================================================================== */

// --------------------------------------------------------------------------
// Excel数据相关类型
// --------------------------------------------------------------------------

export interface KeywordEntry {
  keyword: string;
  searchVolume?: number;
  cpc?: number;
  kd?: number;
  source: string;  // 来源品牌（Excel文件名）
}

export interface BrandData {
  brandName: string;       // 品牌名（文件名去掉后缀）
  keywords: KeywordEntry[];
  originalCount: number;   // 原始关键词数量
}

// --------------------------------------------------------------------------
// 清洗相关类型
// --------------------------------------------------------------------------

export interface CleanableItem {
  id: string;
  keyword: string;
  source: string;
  reason: 'duplicate' | 'brand';  // 清洗原因：重复或品牌词
  selected: boolean;
  count?: number;  // 重复词的出现次数
}

export interface CleanResult {
  brandName: string;
  duplicates: CleanableItem[];      // 内部重复词
  brandKeywords: CleanableItem[];   // 品牌流量词
  cleanedKeywords: KeywordEntry[];  // 清洗后的关键词
}

// --------------------------------------------------------------------------
// 分析相关类型
// --------------------------------------------------------------------------

export interface KeywordFrequency {
  keyword: string;
  frequency: number;          // 出现次数
  sources: string[];          // 来源品牌列表
  searchVolume?: number;
  cpc?: number;
  kd?: number;
}

export interface MarketKeywordResult {
  commonKeywords: KeywordFrequency[];     // 通用关键词（freq >= 2）
  marketKeywords: KeywordFrequency[];     // 市场关键词（根据阈值）
  threshold: number;                       // 使用的阈值
  totalCommonCount: number;
}

export interface UniqueKeywordResult {
  brandName: string;
  uniqueKeywords: KeywordEntry[];  // 完全去除通用词后的独有词
}

// --------------------------------------------------------------------------
// 应用状态类型
// --------------------------------------------------------------------------

export type AppStep = 'upload' | 'clean' | 'analyze' | 'result';

export interface AppState {
  step: AppStep;
  brandDataList: BrandData[];
  cleanResults: CleanResult[];
  marketResult: MarketKeywordResult | null;
  uniqueResults: UniqueKeywordResult[];
}

// --------------------------------------------------------------------------
// 配置常量
// --------------------------------------------------------------------------

export const CONFIG = {
  // 市场词阈值判断
  COMMON_THRESHOLD_HIGH: 4,    // 大数据量时使用
  COMMON_THRESHOLD_LOW: 2,     // 小数据量时使用
  BIG_DATA_LIMIT: 700,         // 判断大/小数据量的边界

  // 可视化基准（预留）
  CHART_SV_TARGET: 150,
  CHART_CPC_TARGET: 2.5,
} as const;
