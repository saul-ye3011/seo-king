/* ==========================================================================
   SEO King - Main Application
   关键词分析系统主界面
   ========================================================================== */

import { useState, useCallback } from 'react';
import type { AppStep, BrandData, CleanResult, MarketKeywordResult, UniqueKeywordResult } from './types';
import { CONFIG } from './types';
import { FileUploader } from './components/FileUploader';
import { DataCleanPanel } from './components/DataCleanPanel';
import { ResultPanel } from './components/ResultPanel';
import { detectAllCleanableItems, executeAllClean } from './utils/dataClean';
import { analyzeMarketKeywords, extractUniqueKeywords } from './utils/keywordAnalyzer';

// --------------------------------------------------------------------------
// 步骤配置
// --------------------------------------------------------------------------

const STEPS: { id: AppStep; label: string; description: string }[] = [
  { id: 'upload', label: '上传文件', description: '上传多个Excel文件' },
  { id: 'clean', label: '数据清洗', description: '筛选重复词与品牌词' },
  { id: 'analyze', label: '分析结果', description: '查看市场词与领域词' },
];

// --------------------------------------------------------------------------
// 主应用组件
// --------------------------------------------------------------------------

export default function App() {
  // 步骤状态
  const [currentStep, setCurrentStep] = useState<AppStep>('upload');
  const [isLoading, setIsLoading] = useState(false);

  // 数据状态
  const [brandDataList, setBrandDataList] = useState<BrandData[]>([]);
  const [cleanResults, setCleanResults] = useState<CleanResult[]>([]);
  const [marketResult, setMarketResult] = useState<MarketKeywordResult | null>(null);
  const [uniqueResults, setUniqueResults] = useState<UniqueKeywordResult[]>([]);

  // Step 1: 文件上传完成
  const handleFilesUploaded = useCallback((data: BrandData[]) => {
    setBrandDataList(data);
    const results = detectAllCleanableItems(data);
    setCleanResults(results);
    setCurrentStep('clean');
  }, []);

  // Step 2: 执行清洗并分析
  const handleExecuteClean = useCallback(() => {
    setIsLoading(true);

    // 使用setTimeout让UI有机会更新
    setTimeout(() => {
      // 执行清洗
      const cleanedResults = executeAllClean(brandDataList, cleanResults);
      setCleanResults(cleanedResults);

      // 分析市场关键词
      const market = analyzeMarketKeywords(cleanedResults, CONFIG);
      setMarketResult(market);

      // 提取领域词
      const unique = extractUniqueKeywords(cleanedResults, market);
      setUniqueResults(unique);

      setCurrentStep('analyze');
      setIsLoading(false);
    }, 100);
  }, [brandDataList, cleanResults]);

  // 重置
  const handleReset = useCallback(() => {
    setBrandDataList([]);
    setCleanResults([]);
    setMarketResult(null);
    setUniqueResults([]);
    setCurrentStep('upload');
  }, []);

  // 返回上一步
  const handleGoBack = useCallback(() => {
    if (currentStep === 'clean') {
      setCurrentStep('upload');
    } else if (currentStep === 'analyze') {
      setCurrentStep('clean');
    }
  }, [currentStep]);

  // 获取当前步骤索引
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white text-xl">
                K
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">SEO King</h1>
                <p className="text-xs text-gray-500">关键词分析系统</p>
              </div>
            </div>

            {/* 步骤指示器 */}
            <div className="flex items-center gap-4">
              {STEPS.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;

                return (
                  <div key={step.id} className="flex items-center gap-2">
                    {index > 0 && (
                      <div className={`w-12 h-0.5 ${isCompleted ? 'bg-primary-500' : 'bg-gray-200'}`} />
                    )}
                    <div className="flex items-center gap-2">
                      <div
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                          ${isActive ? 'bg-primary-500 text-white' : ''}
                          ${isCompleted ? 'bg-primary-500 text-white' : ''}
                          ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500' : ''}
                        `}
                      >
                        {isCompleted ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className={`text-sm ${isActive ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {/* 加载遮罩 */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-700 font-medium">正在分析数据...</p>
            </div>
          </div>
        )}

        {/* Step 1: 上传 */}
        {currentStep === 'upload' && (
          <div className="h-full flex flex-col items-center justify-center py-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                上传竞品关键词数据
              </h2>
              <p className="text-gray-500">
                支持同时上传多个Excel文件，每个文件代表一个品牌
              </p>
            </div>
            <FileUploader
              onFilesUploaded={handleFilesUploaded}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>
        )}

        {/* Step 2: 清洗 */}
        {currentStep === 'clean' && (
          <div className="h-[calc(100vh-200px)]">
            <DataCleanPanel
              brandDataList={brandDataList}
              cleanResults={cleanResults}
              onCleanResultsChange={setCleanResults}
              onExecuteClean={handleExecuteClean}
            />
          </div>
        )}

        {/* Step 3: 结果 */}
        {currentStep === 'analyze' && marketResult && (
          <div className="h-[calc(100vh-200px)]">
            <ResultPanel
              marketResult={marketResult}
              uniqueResults={uniqueResults}
              onReset={handleReset}
              onGoBack={handleGoBack}
            />
          </div>
        )}
      </main>

      {/* 底部 */}
      <footer className="bg-white border-t border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-400">
          SEO King v1.0 - Keyword Analysis System
        </div>
      </footer>
    </div>
  );
}
