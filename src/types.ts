export interface Holding {
  id: string; // Unique identifier for each holding
  type: string;
  name: string;
  account: string;
  value: number;
  gainLoss: number;
}

//同一銘柄を合算して管理するための新しいデータ型
export interface AggregatedHolding {
  name: string;
  type: string;
  totalValue: number;
  totalGainLoss: number;
  subHoldings: Holding[]; // 口座ごとの内訳
}

//資産クラス別、口座別でグループ化するための新しいデータ型
export interface GroupedData {
  name: string;
  value: number;
  gainLoss: number;
  aggregatedHoldings: AggregatedHolding[];
}

export interface PortfolioData {
  totalValue: number;
  totalGainLoss: number;
  aggregatedHoldings: AggregatedHolding[]; // for 'byHolding' view in table
  byAccount: GroupedData[];
  byAssetClass: GroupedData[];
  byHoldingForPie: { name: string; value: number; type: string; }[]; // for 'byHolding' view in pie chart
  holdings: Holding[]; // Keep the raw holdings list for easier updates
}

export interface NamedPortfolioData {
  name: string;
  data: PortfolioData;
}
