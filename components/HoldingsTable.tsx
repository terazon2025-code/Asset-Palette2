
import React, { useState } from 'react';
import { AggregatedHolding, Holding, GroupedData } from '../types.ts';
import { ChevronRightIcon, PencilIcon, TrashIcon } from './icons.tsx';
import { getTypeColor, getGeneralColor } from '../constants.ts';
import { ChartView } from './Dashboard.tsx';


interface HoldingsTableProps {
  aggregatedHoldings: AggregatedHolding[];
  byAssetClass: GroupedData[];
  byAccount: GroupedData[];
  view: ChartView;
  totalValue: number;
  onEdit: (holding: Holding) => void;
  onDelete: (holdingId: string) => void;
  isReadOnly: boolean;
}

const calculateGainLossRate = (value: number, gainLoss: number): number => {
    const principal = value - gainLoss;
    if (principal === 0 || principal === -0) {
      return gainLoss > 0 ? 100.0 : 0;
    }
    return (gainLoss / principal) * 100;
};

const currencyFormat = (value: number) => new Intl.NumberFormat('ja-JP').format(value);
const signedCurrencyFormat = (value: number) => new Intl.NumberFormat('ja-JP', { signDisplay: 'always' }).format(value);
const gainLossColor = (val: number) => val >= 0 ? 'text-red-600' : 'text-blue-600';


const AggregatedHoldingCard: React.FC<{
    aggHolding: AggregatedHolding;
    totalValue: number;
    onEdit: (holding: Holding) => void;
    onDelete: (holdingId: string) => void;
    isReadOnly: boolean;
    isSubRow?: boolean;
}> = ({ aggHolding, totalValue, onEdit, onDelete, isReadOnly, isSubRow = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const toggleRow = () => setIsExpanded(prev => !prev);

    const gainLossRate = calculateGainLossRate(aggHolding.totalValue, aggHolding.totalGainLoss);
    const percentageOfTotal = (aggHolding.totalValue / totalValue) * 100;
    const hasSubHoldings = aggHolding.subHoldings.length > 1;
    const isSingleManualEntry = aggHolding.subHoldings.length === 1 && aggHolding.subHoldings[0].account === '手入力';
    const canEditSingle = !isReadOnly && isSingleManualEntry;
    const typeColor = getTypeColor(aggHolding.type) || getGeneralColor(aggHolding.type);

    const cardClass = isSubRow 
        ? "bg-gray-50 border border-gray-200 rounded-lg" 
        : "bg-white border border-gray-200 rounded-lg";

    return (
        <div key={aggHolding.name} className={cardClass}>
          <div 
            className={`p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${hasSubHoldings ? 'cursor-pointer hover:bg-gray-100' : ''}`}
            onClick={hasSubHoldings ? toggleRow : undefined}
          >
            <div className="flex-1 min-w-0">
                <div className="flex items-center">
                   <span className="w-4 h-4 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: typeColor }}></span>
                   <p className="text-xl text-gray-500 truncate">{aggHolding.type}</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-1 truncate">{aggHolding.name}</p>
            </div>

            <div className="flex-shrink-0 flex flex-col items-start sm:items-end gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                <div className="text-right">
                    <p className="text-lg text-gray-500">評価額 (構成比)</p>
                    <div className="flex items-baseline justify-end">
                      <p className="text-4xl font-bold text-gray-900">{currencyFormat(aggHolding.totalValue)}</p>
                      <span className="text-2xl font-medium text-gray-600 ml-1">円</span>
                      <span className="text-xl text-gray-500 ml-3 sm:ml-4 min-w-[80px]">({percentageOfTotal.toFixed(1)}%)</span>
                    </div>
                </div>
                <div className="text-right w-full">
                    <p className="text-lg text-gray-500">評価損益 (率)</p>
                    <div className={`${gainLossColor(aggHolding.totalGainLoss)} text-xl font-semibold flex items-center justify-end space-x-2 sm:space-x-3`}>
                      <span>{signedCurrencyFormat(aggHolding.totalGainLoss)}円</span>
                      <span>({gainLossRate.toFixed(2)}%)</span>
                    </div>
                </div>
            </div>


            <div className="flex-shrink-0 sm:ml-4 flex items-center justify-end space-x-2 self-end sm:self-center">
                {canEditSingle && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(aggHolding.subHoldings[0]); }} className="text-gray-400 hover:text-blue-600 p-1"><PencilIcon className="w-6 h-6" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(aggHolding.subHoldings[0].id); }} className="text-gray-400 hover:text-red-600 p-1"><TrashIcon className="w-6 h-6" /></button>
                  </>
                )}
                {hasSubHoldings && (
                   <ChevronRightIcon className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                )}
            </div>
          </div>

          {isExpanded && hasSubHoldings && (
            <div className="border-t border-gray-200 bg-gray-100 px-4 sm:px-6 py-6 space-y-4">
              {aggHolding.subHoldings.map((subHolding) => {
                const subGainLossRate = calculateGainLossRate(subHolding.value, subHolding.gainLoss);
                const canEditSub = !isReadOnly && subHolding.account === '手入力';
                return (
                   <div key={subHolding.id} className="flex items-center justify-between">
                     <p className="text-2xl text-gray-700 font-medium">{subHolding.account}</p>
                     <div className="flex items-center space-x-2 sm:space-x-4">
                       <div className="text-right">
                          <p className="text-base text-gray-500">評価額</p>
                          <p className="text-2xl font-bold text-gray-800">{currencyFormat(subHolding.value)}円</p>
                          <p className="text-base text-gray-500 mt-1">評価損益 (率)</p>
                          <p className={`${gainLossColor(subHolding.gainLoss)} text-xl font-semibold`}>
                            {signedCurrencyFormat(subHolding.gainLoss)} ({subGainLossRate.toFixed(2)}%)
                          </p>
                       </div>
                       {canEditSub && (
                         <div className="flex items-center space-x-1">
                           <button onClick={() => onEdit(subHolding)} className="text-gray-400 hover:text-blue-600 p-1"><PencilIcon className="w-6 h-6" /></button>
                           <button onClick={() => onDelete(subHolding.id)} className="text-gray-400 hover:text-red-600 p-1"><TrashIcon className="w-6 h-6" /></button>
                         </div>
                       )}
                     </div>
                   </div>
                );
              })}
            </div>
          )}
        </div>
    );
};

const HoldingsTable: React.FC<HoldingsTableProps> = ({ aggregatedHoldings, byAssetClass, byAccount, totalValue, view, onEdit, onDelete, isReadOnly }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };
  
  const title = view === 'assetClass' ? '資産クラス別' : view === 'account' ? '口座別' : '保有商品';
  
  return (
    <div className="bg-white border border-gray-200 p-4 sm:p-6 rounded-lg shadow-sm flex flex-col">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 flex-shrink-0">{title}</h2>
      <div className="space-y-4 pr-1 sm:pr-2">
        {view === 'holding' && aggregatedHoldings.map((aggHolding) => (
          <AggregatedHoldingCard key={aggHolding.name} aggHolding={aggHolding} totalValue={totalValue} onEdit={onEdit} onDelete={onDelete} isReadOnly={isReadOnly} />
        ))}
        
        {view !== 'holding' && (view === 'assetClass' ? byAssetClass : byAccount).map(group => {
            const isExpanded = expandedGroups.has(group.name);
            const gainLossRate = calculateGainLossRate(group.value, group.gainLoss);
            const percentageOfTotal = (group.value / totalValue) * 100;
            const hasSubHoldings = group.aggregatedHoldings.length > 0;
            const groupColor = view === 'assetClass' 
              ? getTypeColor(group.name) || getGeneralColor(group.name) 
              : getGeneralColor(group.name);

            return (
                <div key={group.name} className="bg-white border border-gray-200 rounded-lg">
                    <div 
                        className={`p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${hasSubHoldings ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                        onClick={() => hasSubHoldings && toggleGroup(group.name)}
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                                <span className="w-4 h-4 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: groupColor }}></span>
                                <p className="text-3xl font-bold text-gray-900 truncate">{group.name}</p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-start sm:items-end gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                            <div className="text-right">
                                <p className="text-lg text-gray-500">評価額 (構成比)</p>
                                <div className="flex items-baseline justify-end">
                                    <p className="text-4xl font-bold text-gray-900">{currencyFormat(group.value)}</p>
                                    <span className="text-2xl font-medium text-gray-600 ml-1">円</span>
                                    <span className="text-xl text-gray-500 ml-3 sm:ml-4 min-w-[80px]">({percentageOfTotal.toFixed(1)}%)</span>
                                </div>
                            </div>
                            <div className="text-right w-full">
                                <p className="text-lg text-gray-500">評価損益 (率)</p>
                                <div className={`${gainLossColor(group.gainLoss)} text-xl font-semibold flex items-center justify-end space-x-2 sm:space-x-3`}>
                                    <span>{signedCurrencyFormat(group.gainLoss)}円</span>
                                    <span>({gainLossRate.toFixed(2)}%)</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-shrink-0 sm:ml-4 flex items-center justify-end self-end sm:self-center">
                             {hasSubHoldings && <ChevronRightIcon className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />}
                        </div>
                    </div>
                    {isExpanded && hasSubHoldings && (
                        <div className="border-t border-gray-200 bg-gray-50/50 px-4 sm:px-6 py-4 space-y-4">
                            {group.aggregatedHoldings.map(aggHolding => (
                                <AggregatedHoldingCard key={aggHolding.name} aggHolding={aggHolding} totalValue={totalValue} onEdit={onEdit} onDelete={onDelete} isReadOnly={isReadOnly} isSubRow={true} />
                            ))}
                        </div>
                    )}
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default HoldingsTable;