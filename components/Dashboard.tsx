
import React, { useRef, useCallback, useState } from 'react';
import { PortfolioData, Holding, NamedPortfolioData } from '../types';
import Header from './Header';
import SummaryCard from './SummaryCard';
import PortfolioPieChart from './PortfolioPieChart';
import HoldingsTable from './HoldingsTable';
import AddAssetModal from './AddAssetModal';

interface DashboardProps {
  individualPortfolios: NamedPortfolioData[];
  combinedPortfolio: PortfolioData;
  onReset: () => void;
  onManualAdd: (portfolioIndex: number, asset: Omit<Holding, 'id' | 'account'>) => void;
  onUpdateAsset: (portfolioIndex: number, asset: Holding) => void;
  onDeleteAsset: (portfolioIndex: number, assetId: string) => void;
}

export type ChartView = 'assetClass' | 'account' | 'holding';

const Dashboard: React.FC<DashboardProps> = ({ individualPortfolios, combinedPortfolio, onReset, onManualAdd, onUpdateAsset, onDeleteAsset }) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Holding | null>(null);
  const [activePortfolioTab, setActivePortfolioTab] = useState<'combined' | number>('combined');
  const [chartView, setChartView] = useState<ChartView>('assetClass');


  const handleExport = useCallback(() => {
    if (!dashboardRef.current || !(window as any).htmlToImage) return;

    (window as any).htmlToImage.toPng(dashboardRef.current, { 
      backgroundColor: '#F8F9FA', // Match new bg color
      pixelRatio: 2,
      style: {
        fontFamily: 'Inter, Noto Sans JP, sans-serif'
      }
    })
      .then((dataUrl: string) => {
        const link = document.createElement('a');
        link.download = 'asset-palette.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((err: any) => {
        console.error('oops, something went wrong!', err);
        alert('画像の書き出しに失敗しました。');
      });
  }, []);

  const isCombinedView = activePortfolioTab === 'combined';
  const currentData = isCombinedView ? combinedPortfolio : individualPortfolios[activePortfolioTab as number].data;
  const currentPortfolioIndex = isCombinedView ? -1 : activePortfolioTab as number;

  const handleOpenAddModal = () => {
    if (isCombinedView) return;
    setEditingAsset(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (asset: Holding) => {
    if (isCombinedView) return;
    setEditingAsset(asset);
    setIsModalOpen(true);
  };

  const handleDelete = (assetId: string) => {
    if (isCombinedView) return;
    if (window.confirm('この資産を削除してもよろしいですか？')) {
      onDeleteAsset(currentPortfolioIndex, assetId);
    }
  };

  const handleSaveAsset = (assetData: Holding | Omit<Holding, 'id' | 'account'>) => {
    if (isCombinedView) return;
    if ('id' in assetData) {
      onUpdateAsset(currentPortfolioIndex, assetData);
    } else {
      onManualAdd(currentPortfolioIndex, assetData);
    }
    setIsModalOpen(false);
  }

  const getTabClass = (isActive: boolean) => 
    `px-2 md:px-4 py-3 text-lg font-bold whitespace-nowrap transition-colors relative ${
      isActive
        ? 'text-gray-900'
        : 'text-gray-400 hover:text-gray-600'
    }`;


  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Header 
            onReset={onReset} 
            onExport={handleExport} 
            onAddAsset={handleOpenAddModal} 
            isAddDisabled={isCombinedView}
          />
          
          <nav className="mt-6 border-b border-gray-200">
             <div className="flex space-x-4 md:space-x-8 -mb-px overflow-x-auto">
                <button className={getTabClass(isCombinedView)} onClick={() => setActivePortfolioTab('combined')}>
                  合算
                  {isCombinedView && <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></span>}
                </button>
                {individualPortfolios.map((p, index) => (
                  <button key={p.name} className={getTabClass(activePortfolioTab === index)} onClick={() => setActivePortfolioTab(index)}>
                    {p.name}
                    {activePortfolioTab === index && <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></span>}
                  </button>
                ))}
            </div>
          </nav>

          <main ref={dashboardRef} className="pt-6 md:pt-8">
            <SummaryCard totalValue={currentData.totalValue} totalGainLoss={currentData.totalGainLoss} />
            <div className="flex flex-col gap-6 md:gap-8 mt-6 md:mt-8">
                <PortfolioPieChart 
                  byAccount={currentData.byAccount} 
                  byAssetClass={currentData.byAssetClass} 
                  byHolding={currentData.byHoldingForPie}
                  view={chartView}
                  onViewChange={setChartView}
                />
                <HoldingsTable 
                  aggregatedHoldings={currentData.aggregatedHoldings}
                  byAccount={currentData.byAccount}
                  byAssetClass={currentData.byAssetClass}
                  totalValue={currentData.totalValue}
                  view={chartView}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDelete}
                  isReadOnly={isCombinedView}
                />
            </div>
          </main>
        </div>
        <footer className="text-center py-8 text-gray-400 text-sm">
          <p>Generated by Asset Palette</p>
        </footer>
      </div>
      <AddAssetModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAsset}
        assetToEdit={editingAsset}
      />
    </>
  );
};

export default Dashboard;
