/* ==========================================================================
   FileUploader - 文件上传组件
   支持多选Excel文件上传
   ========================================================================== */

import { useRef } from 'react';
import type { BrandData } from '../types';

interface Props {
  onFilesUploaded: (data: BrandData[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function FileUploader({ onFilesUploaded, isLoading, setIsLoading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);

    try {
      const { parseMultipleFiles } = await import('../utils/excelParser');
      const brandDataList = await parseMultipleFiles(files);
      onFilesUploaded(brandDataList);
    } catch (error) {
      alert(`文件解析失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);

    try {
      const { parseMultipleFiles } = await import('../utils/excelParser');
      const brandDataList = await parseMultipleFiles(files);
      onFilesUploaded(brandDataList);
    } catch (error) {
      alert(`文件解析失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          border-2 border-dashed rounded-xl p-12
          flex flex-col items-center justify-center gap-4
          transition-all duration-200 cursor-pointer
          ${isLoading
            ? 'border-gray-300 bg-gray-50'
            : 'border-primary-300 bg-primary-50 hover:border-primary-500 hover:bg-primary-100'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
        />

        {isLoading ? (
          <>
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">正在解析文件...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700">
                点击或拖拽上传 Excel 文件
              </p>
              <p className="text-sm text-gray-500 mt-1">
                支持多选 | 支持 .xlsx, .xls, .csv 格式
              </p>
              <p className="text-xs text-gray-400 mt-2">
                文件名将作为品牌名使用
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
