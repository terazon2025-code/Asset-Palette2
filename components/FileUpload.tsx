import React, { useState, useCallback, useRef } from 'react';
import { Holding, NamedPortfolioData } from '../types';
import { UploadIcon, TrashIcon } from './icons';
import { calculatePortfolioData } from '../utils';

interface FileUploadProps {
  onDataLoaded: (data: NamedPortfolioData[]) => void;
}

interface FileWithData {
  id: number;
  file: File;
  name: string;
}

const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let field = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
        const char = line[i];

        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    field += '"';
                    i++; 
                } else {
                    inQuotes = false;
                }
            } else {
                field += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                result.push(field);
                field = '';
            } else {
                field += char;
            }
        }
        i++;
    }

    result.push(field);
    return result;
};

const findHeaderIndex = (headers: string[], possibleNames: string[]): number => {
    for (const name of possibleNames) {
        const index = headers.indexOf(name);
        if (index !== -1) {
            return index;
        }
    }
    return -1;
};

const parseSingleFile = (file: File): Promise<Holding[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        if (!buffer) {
          throw new Error("ファイルの読み込みに失敗しました。");
        }
        
        let text: string | null = null;
        const decoders = [
            { encoding: 'utf-8', name: 'UTF-8' },
            { encoding: 'shift_jis', name: 'Shift_JIS' },
            { encoding: 'euc-jp', name: 'EUC-JP' }
        ];

        for (const decoderInfo of decoders) {
            try {
                const decoder = new TextDecoder(decoderInfo.encoding);
                const decodedText = decoder.decode(buffer);
                if (decodedText.includes('保有商品詳細')) {
                    text = decodedText;
                    break;
                }
            } catch (e) { /* ignore */ }
        }
        
        if (!text) {
          throw new Error('「保有商品詳細」セクションが見つかりません。楽天証券からダウンロードした資産残高（CSV）ファイルであることを確認してください。');
        }
        
        if (text.charCodeAt(0) === 0xFEFF) {
          text = text.substring(1);
        }

        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        const startIndex = lines.findIndex(line => line.includes('保有商品詳細'));
        if (startIndex === -1) {
          throw new Error('CSV解析中に「保有商品詳細」セクションが見失われました。ファイルの形式が変更された可能性があります。');
        }

        const headerLine = lines[startIndex + 1];
        if (!headerLine) throw new Error("ヘッダー行が見つかりません。");
        const headers = parseCsvLine(headerLine).map(h => h.trim());
        
        const typeIndex = findHeaderIndex(headers, ['種別']);
        const nameIndex = findHeaderIndex(headers, ['銘柄名', '銘柄']);
        const accountIndex = findHeaderIndex(headers, ['口座']);
        const valueIndex = findHeaderIndex(headers, ['評価額', '時価評価額[円]']);
        const gainLossIndex = findHeaderIndex(headers, ['評価損益[円]']);

        const requiredHeaders = [
            { names: ['種別'], index: typeIndex }, { names: ['銘柄名', '銘柄'], index: nameIndex },
            { names: ['口座'], index: accountIndex }, { names: ['評価額', '時価評価額[円]'], index: valueIndex },
            { names: ['評価損益[円]'], index: gainLossIndex },
        ];
        const missing = requiredHeaders.filter(h => h.index === -1).map(h => h.names.join('/'));
        if (missing.length > 0) {
            throw new Error(`必須の列が見つかりません: ${missing.join(', ')}。`);
        }

        const holdings: Holding[] = [];
        for (let i = startIndex + 2; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('■')) break;
            const columns = parseCsvLine(line).map(c => c.trim());
            if (columns.length < Math.max(typeIndex, nameIndex, accountIndex, valueIndex, gainLossIndex) + 1) continue;

            const value = parseInt((columns[valueIndex] || '0').replace(/,/g, ''), 10);
            const gainLoss = parseInt((columns[gainLossIndex] || '0').replace(/,/g, ''), 10);

            if (!isNaN(value) && !isNaN(gainLoss) && columns[typeIndex] && columns[nameIndex] && columns[accountIndex]) {
                holdings.push({
                    id: `csv_${file.name}_${i}`,
                    type: columns[typeIndex], name: columns[nameIndex], account: columns[accountIndex], value, gainLoss,
                });
            }
        }
        resolve(holdings);

      } catch (e: any) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'));
    reader.readAsArrayBuffer(file);
  });
};


const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [files, setFiles] = useState<FileWithData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);

  const addFiles = useCallback((newFiles: FileList) => {
    setError(null);
    const csvFiles = Array.from(newFiles).filter(f => f.name.toLowerCase().endsWith('.csv'));
    if (csvFiles.length === 0) {
      setError('有効なCSVファイルがありません。');
      return;
    }
    const newFileEntries = csvFiles.map((file, index) => ({
      id: nextId.current++,
      file,
      name: `ポートフォリオ ${files.length + index + 1}`,
    }));
    setFiles(prev => [...prev, ...newFileEntries]);
  }, [files.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };

  const handleNameChange = (id: number, newName: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
  };
  
  const handleRemoveFile = (id: number) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processAllFiles = async () => {
    if (files.length === 0) {
      setError('CSVファイルを追加してください。');
      return;
    }
    setIsLoading(true);
    setError(null);

    const results: NamedPortfolioData[] = [];
    
    for (const fileWithData of files) {
      try {
        const holdings = await parseSingleFile(fileWithData.file);
        if (holdings.length === 0) {
          throw new Error(`'${fileWithData.file.name}' から保有商品データを読み込めませんでした。`);
        }
        const data = calculatePortfolioData(holdings);
        results.push({ name: fileWithData.name, data });
      } catch (e: any) {
        setError(`エラー (${fileWithData.file.name}): ${e.message}`);
        setIsLoading(false);
        return;
      }
    }
    
    onDataLoaded(results);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900">Asset Palette</h1>
        <p className="mt-4 text-xl md:text-2xl text-gray-600">CSVを放り込むだけ。あなたの資産を、一枚の絵画に。</p>
      </div>

      <div className="w-full max-w-2xl mt-12">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div 
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            className={`flex justify-center items-center w-full min-h-[12rem] px-4 transition border-2 border-dashed rounded-md cursor-pointer hover:border-blue-500 focus:outline-none ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" ref={fileInputRef} multiple />
            <span className="flex flex-col items-center space-y-2">
              <UploadIcon className="w-12 h-12 text-gray-400" />
              <span className="text-lg font-medium text-gray-700">
                <span className="text-blue-600 font-semibold">CSVファイル</span>をドラッグ＆ドロップ
              </span>
              <span className="text-base text-gray-500">またはクリックして選択 (複数可)</span>
            </span>
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              {files.map(f => (
                <div key={f.id} className="flex items-center space-x-3 bg-gray-100 p-2 rounded-md border border-gray-200">
                  <input
                    type="text"
                    value={f.name}
                    onChange={(e) => handleNameChange(f.id, e.target.value)}
                    className="flex-grow bg-transparent text-gray-900 focus:outline-none focus:ring-0 border-none p-2 text-base"
                    placeholder="ポートフォリオ名 (例: 夫, 妻)"
                  />
                  <span className="text-base text-gray-500 truncate flex-shrink-0" style={{maxWidth: '150px'}}>{f.file.name}</span>
                  <button onClick={() => handleRemoveFile(f.id)} className="text-gray-400 hover:text-red-500">
                    <TrashIcon className="w-5 h-5"/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-6 flex flex-col items-center">
            <button
              onClick={processAllFiles}
              disabled={isLoading || files.length === 0}
              className="w-full max-w-sm px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>解析中...</span>
                </>
              ) : (
                'ポートフォリオを作成'
              )}
            </button>
            {error && <p className="mt-4 text-red-700 bg-red-100 border border-red-200 px-4 py-2 rounded-md w-full text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;