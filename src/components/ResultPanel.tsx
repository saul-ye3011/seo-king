/* ==========================================================================
   ResultPanel - 结果展示面板
   展示分析结果：市场关键词、通用关键词、各品牌领域词
   ========================================================================== */

import { useState, useMemo } from 'react';
import type { MarketKeywordResult, UniqueKeywordResult, KeywordFrequency, KeywordEntry } from '../types';
import { keywordsToCSV } from '../utils/keywordAnalyzer';

// --------------------------------------------------------------------------
// 可视化配置常量
// --------------------------------------------------------------------------

const CHART_CONFIG = {
  SV_BASELINE: 150,    // 搜索量基准线
  CPC_BASELINE: 2.5,   // CPC基准线
  WIDTH: 800,
  HEIGHT: 500,
  PADDING: { top: 40, right: 40, bottom: 60, left: 70 },
};

interface Props {
  marketResult: MarketKeywordResult;
  uniqueResults: UniqueKeywordResult[];
  onReset: () => void;
  onGoBack: () => void;
}

type TabType = 'market' | 'common' | 'unique';
type MarketViewType = 'table' | 'chart';

export function ResultPanel({ marketResult, uniqueResults, onReset, onGoBack }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('market');
  const [marketView, setMarketView] = useState<MarketViewType>('chart');
  const [activeBrand, setActiveBrand] = useState<string>(
    uniqueResults[0]?.brandName || ''
  );

  // 下载CSV
  const downloadCSV = (data: KeywordEntry[] | KeywordFrequency[], filename: string) => {
    const csv = keywordsToCSV(data);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    {
      id: 'market' as const,
      label: '市场关键词',
      count: marketResult.marketKeywords.length,
      color: 'text-red-600',
    },
    {
      id: 'common' as const,
      label: '通用关键词',
      count: marketResult.commonKeywords.length,
      color: 'text-orange-600',
    },
    {
      id: 'unique' as const,
      label: '各品牌领域词',
      count: uniqueResults.reduce((sum, r) => sum + r.uniqueKeywords.length, 0),
      color: 'text-green-600',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 顶部摘要 */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 mb-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">分析完成</h2>
            <p className="text-primary-100 text-sm">
              使用阈值: freq {'>'}= {marketResult.threshold} 定义市场关键词
              {marketResult.totalCommonCount > 700 && ' (大数据模式)'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onGoBack}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回上一步
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
            >
              重新分析
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {tabs.map(tab => (
            <div key={tab.id} className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-3xl font-bold">{tab.count}</p>
              <p className="text-sm text-primary-100">{tab.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab切换 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${activeTab === tab.id
                  ? 'bg-white shadow-md text-gray-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {tab.label}
              <span className={`ml-2 ${tab.color}`}>({tab.count})</span>
            </button>
          ))}
        </div>

        {/* 市场关键词视图切换 */}
        {activeTab === 'market' && (
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMarketView('chart')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                marketView === 'chart' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
              }`}
            >
              气泡图
            </button>
            <button
              onClick={() => setMarketView('table')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                marketView === 'table' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
              }`}
            >
              表格
            </button>
          </div>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {activeTab === 'market' && marketView === 'table' && (
          <KeywordTable
            title="市场关键词"
            description={`重复次数 >= ${marketResult.threshold} 的关键词，代表该象限的核心市场`}
            keywords={marketResult.marketKeywords}
            onDownload={() => downloadCSV(marketResult.marketKeywords, '市场关键词')}
          />
        )}

        {activeTab === 'market' && marketView === 'chart' && (
          <BubbleChart
            keywords={marketResult.marketKeywords}
            onDownload={() => downloadCSV(marketResult.marketKeywords, '市场关键词')}
          />
        )}

        {activeTab === 'common' && (
          <KeywordTable
            title="通用关键词"
            description="重复次数 >= 2 的关键词，在多个品牌间共享"
            keywords={marketResult.commonKeywords}
            onDownload={() => downloadCSV(marketResult.commonKeywords, '通用关键词')}
          />
        )}

        {activeTab === 'unique' && (
          <div className="flex flex-1 min-h-0">
            {/* 品牌选择 */}
            <div className="w-56 border-r border-gray-200 overflow-y-auto">
              {uniqueResults.map(result => (
                <button
                  key={result.brandName}
                  onClick={() => setActiveBrand(result.brandName)}
                  className={`
                    w-full px-4 py-3 text-left border-b border-gray-100
                    flex items-center justify-between
                    ${activeBrand === result.brandName
                      ? 'bg-green-50 border-l-4 border-l-green-500'
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="font-medium text-gray-700 truncate">
                    {result.brandName}
                  </span>
                  <span className="text-sm text-green-600">
                    {result.uniqueKeywords.length}
                  </span>
                </button>
              ))}
            </div>

            {/* 领域词列表 */}
            <div className="flex-1 flex flex-col">
              {(() => {
                const activeUniqueResult = uniqueResults.find(r => r.brandName === activeBrand);
                if (!activeUniqueResult) return null;

                return (
                  <>
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {activeUniqueResult.brandName} 的独有领域词
                        </h3>
                        <p className="text-sm text-gray-500">
                          去除所有通用词后的独有关键词
                        </p>
                      </div>
                      <button
                        onClick={() => downloadCSV(
                          activeUniqueResult.uniqueKeywords,
                          `${activeUniqueResult.brandName}_领域词`
                        )}
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                      >
                        下载CSV
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {activeUniqueResult.uniqueKeywords.map((kw, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-2 bg-green-50 border border-green-200 rounded text-sm text-gray-700 truncate"
                            title={kw.keyword}
                          >
                            {kw.keyword}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 气泡图组件
// --------------------------------------------------------------------------

interface BubbleChartProps {
  keywords: KeywordFrequency[];
  onDownload: () => void;
}

function BubbleChart({ keywords, onDownload }: BubbleChartProps) {
  const [hoveredKeyword, setHoveredKeyword] = useState<KeywordFrequency | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // 计算图表数据
  const chartData = useMemo(() => {
    // 过滤有搜索量和CPC数据的关键词
    const validKeywords = keywords.filter(kw =>
      kw.searchVolume !== undefined && kw.searchVolume > 0
    );

    if (validKeywords.length === 0) return null;

    // 计算范围
    const svValues = validKeywords.map(kw => kw.searchVolume!);
    const cpcValues = validKeywords.map(kw => kw.cpc ?? 0);
    const kdValues = validKeywords.map(kw => kw.kd ?? 0);

    const svMin = Math.max(1, Math.min(...svValues));
    const svMax = Math.max(...svValues);
    const cpcMin = 0;
    const cpcMax = Math.max(5, Math.max(...cpcValues) * 1.1);
    const kdMax = Math.max(100, Math.max(...kdValues));

    return {
      keywords: validKeywords,
      svMin,
      svMax,
      cpcMin,
      cpcMax,
      kdMax,
    };
  }, [keywords]);

  if (!chartData || chartData.keywords.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="mb-2">暂无可视化数据</p>
          <p className="text-sm">需要关键词包含搜索量(Search Volume)数据</p>
        </div>
      </div>
    );
  }

  const { WIDTH, HEIGHT, PADDING } = CHART_CONFIG;
  const chartWidth = WIDTH - PADDING.left - PADDING.right;
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;

  // 对数坐标转换（X轴：搜索量）
  const logScale = (value: number, min: number, max: number) => {
    const logMin = Math.log10(Math.max(1, min));
    const logMax = Math.log10(Math.max(1, max));
    const logValue = Math.log10(Math.max(1, value));
    return (logValue - logMin) / (logMax - logMin);
  };

  // 线性坐标转换（Y轴：CPC）
  const linearScale = (value: number, min: number, max: number) => {
    return (value - min) / (max - min);
  };

  // KD转颜色（绿→黄→红）
  const kdToColor = (kd: number) => {
    const ratio = Math.min(1, (kd ?? 0) / 100);
    if (ratio < 0.5) {
      // 绿到黄
      const r = Math.round(255 * (ratio * 2));
      return `rgb(${r}, 200, 100)`;
    } else {
      // 黄到红
      const g = Math.round(200 * (1 - (ratio - 0.5) * 2));
      return `rgb(255, ${g}, 100)`;
    }
  };

  // KD转气泡大小
  const kdToSize = (kd: number) => {
    const baseSize = 8;
    const maxExtra = 20;
    return baseSize + (kd ?? 0) / 100 * maxExtra;
  };

  // 计算基准线位置
  const svBaselineX = PADDING.left + logScale(CHART_CONFIG.SV_BASELINE, chartData.svMin, chartData.svMax) * chartWidth;
  const cpcBaselineY = PADDING.top + (1 - linearScale(CHART_CONFIG.CPC_BASELINE, chartData.cpcMin, chartData.cpcMax)) * chartHeight;

  // 生成X轴刻度（对数）
  const xTicks = useMemo(() => {
    const ticks = [];
    const logMin = Math.floor(Math.log10(chartData.svMin));
    const logMax = Math.ceil(Math.log10(chartData.svMax));
    for (let i = logMin; i <= logMax; i++) {
      const value = Math.pow(10, i);
      if (value >= chartData.svMin && value <= chartData.svMax) {
        ticks.push(value);
      }
    }
    return ticks;
  }, [chartData]);

  // 生成Y轴刻度
  const yTicks = useMemo(() => {
    const step = chartData.cpcMax > 10 ? 2 : 1;
    const ticks = [];
    for (let i = 0; i <= chartData.cpcMax; i += step) {
      ticks.push(i);
    }
    return ticks;
  }, [chartData]);

  const handleMouseMove = (e: React.MouseEvent, kw: KeywordFrequency) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left + 10, y: e.clientY - rect.top - 10 });
    setHoveredKeyword(kw);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* 标题栏 */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-800">市场关键词机会矩阵</h3>
          <p className="text-sm text-gray-500">
            X轴: 搜索量 (基准线 {CHART_CONFIG.SV_BASELINE}) | Y轴: CPC (基准线 ${CHART_CONFIG.CPC_BASELINE}) | 气泡: KD难度
          </p>
        </div>
        <button
          onClick={onDownload}
          className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          下载CSV
        </button>
      </div>

      {/* 图表区 */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
        <div className="relative">
          <svg width={WIDTH} height={HEIGHT} className="bg-gray-50 rounded-lg">
            {/* 网格线 */}
            <g className="grid-lines" stroke="#e5e7eb" strokeWidth="1">
              {xTicks.map(tick => {
                const x = PADDING.left + logScale(tick, chartData.svMin, chartData.svMax) * chartWidth;
                return (
                  <line key={`x-${tick}`} x1={x} y1={PADDING.top} x2={x} y2={HEIGHT - PADDING.bottom} strokeDasharray="4,4" />
                );
              })}
              {yTicks.map(tick => {
                const y = PADDING.top + (1 - linearScale(tick, chartData.cpcMin, chartData.cpcMax)) * chartHeight;
                return (
                  <line key={`y-${tick}`} x1={PADDING.left} y1={y} x2={WIDTH - PADDING.right} y2={y} strokeDasharray="4,4" />
                );
              })}
            </g>

            {/* 基准线 */}
            <line
              x1={svBaselineX} y1={PADDING.top} x2={svBaselineX} y2={HEIGHT - PADDING.bottom}
              stroke="#3b82f6" strokeWidth="2" strokeDasharray="6,3"
            />
            <line
              x1={PADDING.left} y1={cpcBaselineY} x2={WIDTH - PADDING.right} y2={cpcBaselineY}
              stroke="#3b82f6" strokeWidth="2" strokeDasharray="6,3"
            />

            {/* 象限标签 */}
            <text x={PADDING.left + 10} y={PADDING.top + 20} className="text-xs fill-gray-400">低流量高成本</text>
            <text x={WIDTH - PADDING.right - 80} y={PADDING.top + 20} className="text-xs fill-gray-400">高流量高成本</text>
            <text x={PADDING.left + 10} y={HEIGHT - PADDING.bottom - 10} className="text-xs fill-green-600 font-medium">低流量低成本</text>
            <text x={WIDTH - PADDING.right - 80} y={HEIGHT - PADDING.bottom - 10} className="text-xs fill-green-600 font-medium">高流量低成本</text>

            {/* X轴 */}
            <g className="x-axis">
              <line
                x1={PADDING.left} y1={HEIGHT - PADDING.bottom}
                x2={WIDTH - PADDING.right} y2={HEIGHT - PADDING.bottom}
                stroke="#9ca3af" strokeWidth="1"
              />
              {xTicks.map(tick => {
                const x = PADDING.left + logScale(tick, chartData.svMin, chartData.svMax) * chartWidth;
                return (
                  <g key={`x-tick-${tick}`}>
                    <line x1={x} y1={HEIGHT - PADDING.bottom} x2={x} y2={HEIGHT - PADDING.bottom + 5} stroke="#9ca3af" />
                    <text x={x} y={HEIGHT - PADDING.bottom + 20} textAnchor="middle" className="text-xs fill-gray-500">
                      {tick >= 1000 ? `${tick / 1000}K` : tick}
                    </text>
                  </g>
                );
              })}
              <text x={WIDTH / 2} y={HEIGHT - 10} textAnchor="middle" className="text-sm fill-gray-600 font-medium">
                Search Volume (搜索量)
              </text>
            </g>

            {/* Y轴 */}
            <g className="y-axis">
              <line
                x1={PADDING.left} y1={PADDING.top}
                x2={PADDING.left} y2={HEIGHT - PADDING.bottom}
                stroke="#9ca3af" strokeWidth="1"
              />
              {yTicks.map(tick => {
                const y = PADDING.top + (1 - linearScale(tick, chartData.cpcMin, chartData.cpcMax)) * chartHeight;
                return (
                  <g key={`y-tick-${tick}`}>
                    <line x1={PADDING.left - 5} y1={y} x2={PADDING.left} y2={y} stroke="#9ca3af" />
                    <text x={PADDING.left - 10} y={y + 4} textAnchor="end" className="text-xs fill-gray-500">
                      ${tick}
                    </text>
                  </g>
                );
              })}
              <text
                x={15} y={HEIGHT / 2}
                textAnchor="middle" className="text-sm fill-gray-600 font-medium"
                transform={`rotate(-90, 15, ${HEIGHT / 2})`}
              >
                CPC (点击成本)
              </text>
            </g>

            {/* 气泡 */}
            <g className="bubbles">
              {chartData.keywords.map((kw, idx) => {
                const x = PADDING.left + logScale(kw.searchVolume!, chartData.svMin, chartData.svMax) * chartWidth;
                const y = PADDING.top + (1 - linearScale(kw.cpc ?? 0, chartData.cpcMin, chartData.cpcMax)) * chartHeight;
                const r = kdToSize(kw.kd ?? 0);
                const color = kdToColor(kw.kd ?? 0);

                return (
                  <circle
                    key={idx}
                    cx={x} cy={y} r={r}
                    fill={color}
                    fillOpacity={0.7}
                    stroke={color}
                    strokeWidth={1}
                    className="cursor-pointer transition-all hover:fill-opacity-100"
                    onMouseMove={(e) => handleMouseMove(e, kw)}
                    onMouseLeave={() => setHoveredKeyword(null)}
                  />
                );
              })}
            </g>
          </svg>

          {/* Tooltip */}
          {hoveredKeyword && (
            <div
              className="absolute bg-gray-900 text-white text-xs rounded-lg px-3 py-2 pointer-events-none z-10 shadow-lg"
              style={{ left: tooltipPos.x, top: tooltipPos.y }}
            >
              <p className="font-medium mb-1">{hoveredKeyword.keyword}</p>
              <p>搜索量: {hoveredKeyword.searchVolume?.toLocaleString() ?? '-'}</p>
              <p>CPC: ${hoveredKeyword.cpc?.toFixed(2) ?? '-'}</p>
              <p>KD: {hoveredKeyword.kd ?? '-'}</p>
              <p>频次: {hoveredKeyword.frequency}</p>
            </div>
          )}

          {/* 图例 */}
          <div className="absolute bottom-4 right-4 bg-white/90 rounded-lg p-3 text-xs border border-gray-200">
            <p className="font-medium text-gray-700 mb-2">KD难度图例</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: kdToColor(0) }} />
                <span>低</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full" style={{ background: kdToColor(50) }} />
                <span>中</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full" style={{ background: kdToColor(100) }} />
                <span>高</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 关键词表格子组件
// --------------------------------------------------------------------------

interface KeywordTableProps {
  title: string;
  description: string;
  keywords: KeywordFrequency[];
  onDownload: () => void;
}

function KeywordTable({ title, description, keywords, onDownload }: KeywordTableProps) {
  return (
    <>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <button
          onClick={onDownload}
          className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          下载CSV
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">关键词</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-24">频次</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-28">搜索量</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-20">CPC</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-20">KD</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">来源</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {keywords.map((kw, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-800">{kw.keyword}</td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                    {kw.frequency}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-600">
                  {kw.searchVolume ?? '-'}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-600">
                  {kw.cpc?.toFixed(2) ?? '-'}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-600">
                  {kw.kd ?? '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                  {kw.sources.join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
