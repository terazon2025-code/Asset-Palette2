
import { Holding, PortfolioData, AggregatedHolding, GroupedData } from './types.ts';

export const assetTypeOrder: { [key: string]: number } = {
  '国内株式': 1, '米国株式': 2, '中国株式': 3, 'アセアン株式': 4,
  '投資信託': 5, '金・プラチナ': 6, '国内債券': 7, '外国債券': 8,
  '現金': 98, '仮想通貨': 99,
};

export const aggregateHoldingsByName = (holdings: Holding[]): AggregatedHolding[] => {
  const holdingGroups = new Map<string, { totalValue: number, totalGainLoss: number, type: string, subHoldings: Holding[] }>();
  for (const holding of holdings) {
      if (!holdingGroups.has(holding.name)) {
          holdingGroups.set(holding.name, {
              totalValue: 0,
              totalGainLoss: 0,
              type: holding.type,
              subHoldings: []
          });
      }
      const group = holdingGroups.get(holding.name)!;
      group.totalValue += holding.value;
      group.totalGainLoss += holding.gainLoss;
      group.subHoldings.push(holding);
  }
  
  return Array.from(holdingGroups.entries()).map(([name, group]) => ({
      name,
      ...group
  })).sort((a, b) => {
    const typeOrderA = assetTypeOrder[a.type] || 90;
    const typeOrderB = assetTypeOrder[b.type] || 90;
    if (typeOrderA !== typeOrderB) {
      return typeOrderA - typeOrderB;
    }
    return b.totalValue - a.totalValue;
  });
};


export const calculatePortfolioData = (allHoldings: Holding[]): PortfolioData => {
  const totalValue = allHoldings.reduce((sum, h) => sum + h.value, 0);
  const totalGainLoss = allHoldings.reduce((sum, h) => sum + h.gainLoss, 0);

  const aggregatedHoldings = aggregateHoldingsByName(allHoldings);
  
  // byAssetClass
  const assetClassGroups = new Map<string, Holding[]>();
  allHoldings.forEach(h => {
    if (!assetClassGroups.has(h.type)) assetClassGroups.set(h.type, []);
    assetClassGroups.get(h.type)!.push(h);
  });
  const byAssetClass: GroupedData[] = Array.from(assetClassGroups.entries()).map(([name, holdings]) => {
    const value = holdings.reduce((sum, h) => sum + h.value, 0);
    const gainLoss = holdings.reduce((sum, h) => sum + h.gainLoss, 0);
    return {
      name,
      value,
      gainLoss,
      aggregatedHoldings: aggregateHoldingsByName(holdings)
    };
  }).sort((a,b) => b.value - a.value);

  // byAccount
  const accountGroups = new Map<string, Holding[]>();
  allHoldings.forEach(h => {
    const key = h.account === '手入力' ? h.type : h.account;
    if (!accountGroups.has(key)) accountGroups.set(key, []);
    accountGroups.get(key)!.push(h);
  });
  const byAccount: GroupedData[] = Array.from(accountGroups.entries()).map(([name, holdings]) => {
    const value = holdings.reduce((sum, h) => sum + h.value, 0);
    const gainLoss = holdings.reduce((sum, h) => sum + h.gainLoss, 0);
    return {
      name,
      value,
      gainLoss,
      aggregatedHoldings: aggregateHoldingsByName(holdings)
    };
  }).sort((a,b) => b.value - a.value);

  const byHoldingForPie = aggregatedHoldings.map(h => ({ name: h.name, value: h.totalValue, type: h.type })).sort((a, b) => b.value - a.value);

  return { totalValue, totalGainLoss, aggregatedHoldings, byAccount, byAssetClass, byHoldingForPie, holdings: allHoldings };
};