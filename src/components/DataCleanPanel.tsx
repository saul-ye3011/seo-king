/* ==========================================================================
   DataCleanPanel - 数据清洗面板
   Step 1: 展示并选择待清洗的重复词和品牌词
   ========================================================================== */

import { useState, useMemo } from 'react';
import type { BrandData, CleanResult, CleanableItem } from '../types';

interface Props {
  brandDataList: BrandData[];
  cleanResults: CleanResult[];
  onCleanResultsChange: (results: CleanResult[]) => void;
  onExecuteClean: () => void;
}

export function DataCleanPanel({
  brandDataList,
  cleanResults,
  onCleanResultsChange,
  onExecuteClean,
}: Props) {
  const [activeBrand, setActiveBrand] = useState<string>(
    cleanResults[0]?.brandName || ''
  );

  const activeResult = cleanResults.find(r => r.brandName === activeBrand);

  // 切换单个项的选中状态
  const toggleItem = (itemId: string, type: 'duplicate' | 'brand') => {
    const newResults = cleanResults.map(result => {
      if (result.brandName !== activeBrand) return result;

      const targetList = type === 'duplicate' ? 'duplicates' : 'brandKeywords';
      return {
        ...result,
        [targetList]: result[targetList].map(item =>
          item.id === itemId ? { ...item, selected: !item.selected } : item
        ),
      };
    });

    onCleanResultsChange(newResults);
  };

  // 全选/取消全选
  const toggleAll = (type: 'duplicate' | 'brand', selected: boolean) => {
    const newResults = cleanResults.map(result => {
      if (result.brandName !== activeBrand) return result;

      const targetList = type === 'duplicate' ? 'duplicates' : 'brandKeywords';
      return {
        ...result,
        [targetList]: result[targetList].map(item => ({ ...item, selected })),
      };
    });

    onCleanResultsChange(newResults);
  };

  // 批量选择/取消筛选后的项
  const toggleFiltered = (
    type: 'duplicate' | 'brand',
    filteredItems: CleanableItem[],
    selected: boolean
  ) => {
    const filteredIds = new Set(filteredItems.map(i => i.id));
    const newResults = cleanResults.map(result => {
      if (result.brandName !== activeBrand) return result;

      const targetList = type === 'duplicate' ? 'duplicates' : 'brandKeywords';
      return {
        ...result,
        [targetList]: result[targetList].map(item =>
          filteredIds.has(item.id) ? { ...item, selected } : item
        ),
      };
    });

    onCleanResultsChange(newResults);
  };

  // 计算统计数据
  const getTotalStats = () => {
    let totalDuplicates = 0;
    let totalBrandWords = 0;
    let selectedDuplicates = 0;
    let selectedBrandWords = 0;

    cleanResults.forEach(result => {
      totalDuplicates += result.duplicates.length;
      totalBrandWords += result.brandKeywords.length;
      selectedDuplicates += result.duplicates.filter(i => i.selected).length;
      selectedBrandWords += result.brandKeywords.filter(i => i.selected).length;
    });

    return { totalDuplicates, totalBrandWords, selectedDuplicates, selectedBrandWords };
  };

  const stats = getTotalStats();

  return (
    <div className="flex flex-col h-full">
      {/* 顶部统计栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.selectedDuplicates}</p>
              <p className="text-xs text-gray-500">待去重词（保留1个）</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.selectedBrandWords}</p>
              <p className="text-xs text-gray-500">待删除品牌词</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {stats.selectedDuplicates + stats.selectedBrandWords}
              </p>
              <p className="text-xs text-gray-500">总计待处理</p>
            </div>
          </div>
          <button
            onClick={onExecuteClean}
            className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            执行清洗
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* 左侧品牌列表 */}
        <div className="w-64 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-700">品牌列表</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {brandDataList.map((brand, index) => {
              const result = cleanResults[index];
              const count = (result?.duplicates.length || 0) + (result?.brandKeywords.length || 0);

              return (
                <button
                  key={brand.brandName}
                  onClick={() => setActiveBrand(brand.brandName)}
                  className={`
                    w-full px-4 py-3 text-left border-b border-gray-100
                    flex items-center justify-between
                    transition-colors
                    ${activeBrand === brand.brandName
                      ? 'bg-primary-50 border-l-4 border-l-primary-500'
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  <div>
                    <p className="font-medium text-gray-800 truncate max-w-[140px]">
                      {brand.brandName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {brand.originalCount} 个关键词
                    </p>
                  </div>
                  {count > 0 && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 右侧清洗详情 */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {activeResult ? (
            <>
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-medium text-gray-800">
                  {activeResult.brandName} - 待清洗项
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* 重复词区块 */}
                <CleanSection
                  title="内部重复词"
                  subtitle="选中的词将去重，保留1个"
                  items={activeResult.duplicates}
                  color="orange"
                  showCount={true}
                  onToggle={(id) => toggleItem(id, 'duplicate')}
                  onToggleAll={(selected) => toggleAll('duplicate', selected)}
                  onToggleFiltered={(items, selected) => toggleFiltered('duplicate', items, selected)}
                />

                {/* 品牌词区块 */}
                <CleanSection
                  title="品牌流量词"
                  subtitle="选中的词将被完全删除"
                  items={activeResult.brandKeywords}
                  color="purple"
                  showCount={false}
                  onToggle={(id) => toggleItem(id, 'brand')}
                  onToggleAll={(selected) => toggleAll('brand', selected)}
                  onToggleFiltered={(items, selected) => toggleFiltered('brand', items, selected)}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              请选择一个品牌查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 清洗区块子组件（含筛选功能）
// --------------------------------------------------------------------------

interface CleanSectionProps {
  title: string;
  subtitle: string;
  items: CleanableItem[];
  color: 'orange' | 'purple';
  showCount: boolean;
  onToggle: (id: string) => void;
  onToggleAll: (selected: boolean) => void;
  onToggleFiltered: (items: CleanableItem[], selected: boolean) => void;
}

function CleanSection({
  title,
  subtitle,
  items,
  color,
  showCount,
  onToggle,
  onToggleAll,
  onToggleFiltered,
}: CleanSectionProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [filterText, setFilterText] = useState('');

  // 筛选后的列表
  const filteredItems = useMemo(() => {
    if (!filterText.trim()) return items;
    const lower = filterText.toLowerCase();
    return items.filter(item => item.keyword.toLowerCase().includes(lower));
  }, [items, filterText]);

  const selectedCount = items.filter(i => i.selected).length;
  const allSelected = items.length > 0 && selectedCount === items.length;
  const filteredSelectedCount = filteredItems.filter(i => i.selected).length;
  const allFilteredSelected = filteredItems.length > 0 && filteredSelectedCount === filteredItems.length;

  const colorClasses = {
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-700',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-700',
    },
  };

  const c = colorClasses[color];

  if (items.length === 0) {
    return (
      <div className={`${c.bg} ${c.border} border rounded-lg p-4`}>
        <h4 className={`font-medium ${c.text} mb-1`}>{title}</h4>
        <p className="text-sm text-gray-500">无检测到的项目</p>
      </div>
    );
  }

  return (
    <div className={`${c.bg} ${c.border} border rounded-lg p-4`}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h4 className={`font-medium ${c.text}`}>
            {title} ({selectedCount}/{items.length})
          </h4>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* 筛选按钮 */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`
              px-2 py-1 text-xs rounded border transition-colors flex items-center gap-1
              ${showFilter
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            筛选
          </button>
          <button
            onClick={() => onToggleAll(!allSelected)}
            className={`text-xs ${c.text} hover:underline`}
          >
            {allSelected ? '取消全选' : '全选'}
          </button>
        </div>
      </div>

      {/* 筛选输入框 */}
      {showFilter && (
        <div className="mt-3 mb-3 p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500 whitespace-nowrap">文本包含:</span>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="输入关键词进行筛选..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              autoFocus
            />
            {filterText && (
              <button
                onClick={() => setFilterText('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {filterText && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">
                找到 <span className="font-medium text-gray-700">{filteredItems.length}</span> 个匹配项
                {filteredItems.length > 0 && `（已选 ${filteredSelectedCount} 个）`}
              </span>
              {filteredItems.length > 0 && (
                <button
                  onClick={() => onToggleFiltered(filteredItems, !allFilteredSelected)}
                  className={`${c.text} hover:underline`}
                >
                  {allFilteredSelected ? '取消选中筛选项' : '选中所有筛选项'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 关键词列表 */}
      <div className="space-y-2 max-h-64 overflow-y-auto mt-3">
        {filteredItems.map(item => (
          <label
            key={item.id}
            className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200 cursor-pointer hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={item.selected}
              onChange={() => onToggle(item.id)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-700 flex-1 truncate">
              {item.keyword}
            </span>
            {showCount && item.count && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${c.badge}`}>
                x{item.count}
              </span>
            )}
          </label>
        ))}
        {filterText && filteredItems.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            没有匹配的关键词
          </p>
        )}
      </div>
    </div>
  );
}
