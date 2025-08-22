import React, { useState, useCallback } from 'react';
import { PortfolioData, Holding, NamedPortfolioData } from './types';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { calculatePortfolioData } from './utils';

interface AppState {
  individual: NamedPortfolioData[];
  combined: PortfolioData;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState | null>(null);

  const handleDataLoaded = useCallback((portfolios: NamedPortfolioData[]) => {
    const allHoldings = portfolios.flatMap(p => p.data.holdings);
    const combinedData = calculatePortfolioData(allHoldings);
    setAppState({ individual: portfolios, combined: combinedData });
  }, []);

  const handleReset = useCallback(() => {
    setAppState(null);
  }, []);

  const handleManualAdd = useCallback((portfolioIndex: number, newAssetData: Omit<Holding, 'id' | 'account'>) => {
    setAppState(prevState => {
      if (!prevState) return null;
      const newAsset: Holding = {
        ...newAssetData,
        id: `manual_${Date.now()}`,
        account: '手入力',
      };
      
      const updatedIndividual = [...prevState.individual];
      const targetPortfolio = updatedIndividual[portfolioIndex];
      const updatedHoldings = [...targetPortfolio.data.holdings, newAsset];
      updatedIndividual[portfolioIndex] = {
        ...targetPortfolio,
        data: calculatePortfolioData(updatedHoldings),
      };
      
      const allHoldings = updatedIndividual.flatMap(p => p.data.holdings);
      const combinedData = calculatePortfolioData(allHoldings);
      return { individual: updatedIndividual, combined: combinedData };
    });
  }, []);

  const handleUpdateAsset = useCallback((portfolioIndex: number, updatedAsset: Holding) => {
    setAppState(prevState => {
      if (!prevState) return null;
      const updatedIndividual = [...prevState.individual];
      const targetPortfolio = updatedIndividual[portfolioIndex];
      const updatedHoldings = targetPortfolio.data.holdings.map(h => h.id === updatedAsset.id ? updatedAsset : h);
      updatedIndividual[portfolioIndex] = {
        ...targetPortfolio,
        data: calculatePortfolioData(updatedHoldings),
      };
      
      const allHoldings = updatedIndividual.flatMap(p => p.data.holdings);
      const combinedData = calculatePortfolioData(allHoldings);
      return { individual: updatedIndividual, combined: combinedData };
    });
  }, []);

  const handleDeleteAsset = useCallback((portfolioIndex: number, assetId: string) => {
    setAppState(prevState => {
      if (!prevState) return null;
      const updatedIndividual = [...prevState.individual];
      const targetPortfolio = updatedIndividual[portfolioIndex];
      const updatedHoldings = targetPortfolio.data.holdings.filter(h => h.id !== assetId);
      updatedIndividual[portfolioIndex] = {
        ...targetPortfolio,
        data: calculatePortfolioData(updatedHoldings),
      };
      
      const allHoldings = updatedIndividual.flatMap(p => p.data.holdings);
      const combinedData = calculatePortfolioData(allHoldings);
      return { individual: updatedIndividual, combined: combinedData };
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {!appState ? (
        <FileUpload onDataLoaded={handleDataLoaded} />
      ) : (
        <Dashboard 
          individualPortfolios={appState.individual}
          combinedPortfolio={appState.combined}
          onReset={handleReset} 
          onManualAdd={handleManualAdd}
          onUpdateAsset={handleUpdateAsset}
          onDeleteAsset={handleDeleteAsset}
        />
      )}
    </div>
  );
};

export default App;