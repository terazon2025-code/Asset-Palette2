
import React from 'react';
import { ArrowLeftIcon, DownloadIcon, PlusIcon } from './icons.tsx';

interface HeaderProps {
    onReset: () => void;
    onExport: () => void;
    onAddAsset: () => void;
    isAddDisabled: boolean;
}

const Header: React.FC<HeaderProps> = ({ onReset, onExport, onAddAsset, isAddDisabled }) => {
    return (
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-4xl font-bold text-gray-900">Asset Palette</h1>
            <div className="flex items-center space-x-2 sm:space-x-3 self-end sm:self-center">
                <button 
                    onClick={onReset}
                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>戻る</span>
                </button>
                 <button 
                    onClick={onAddAsset}
                    disabled={isAddDisabled}
                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>資産を追加</span>
                </button>
                <button 
                    onClick={onExport}
                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <DownloadIcon className="w-5 h-5" />
                    <span>PNGで保存</span>
                </button>
            </div>
        </header>
    );
}

export default Header;