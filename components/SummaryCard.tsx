
import React from 'react';
import { EyeIcon } from './icons';

interface SummaryCardProps {
  totalValue: number;
  totalGainLoss: number;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ totalValue, totalGainLoss }) => {
  const principal = totalValue - totalGainLoss;
  const gainLossRate = principal === 0 ? 0 : (totalGainLoss / principal) * 100;

  // '¥'記号を分離してスタイリング
  const formattedValueParts = new Intl.NumberFormat('ja-JP', { style: 'decimal' }).format(totalValue).split('.');
  const formattedValueInteger = formattedValueParts[0];

  const formattedGainLoss = new Intl.NumberFormat('ja-JP', {
    style: 'decimal',
    signDisplay: 'always'
  }).format(totalGainLoss);

  const formattedGainLossRate = `(${gainLossRate.toFixed(2)}%)`;

  const gainLossColor = totalGainLoss >= 0 ? 'text-red-600' : 'text-blue-600';

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
      <div className="flex items-center space-x-2">
        <p className="text-lg font-bold text-gray-800">資産合計</p>
        <EyeIcon className="w-5 h-5 text-gray-400" />
      </div>

      <div className="mt-2 flex items-baseline justify-start">
        <p className="text-5xl font-bold text-gray-900 tracking-tight">
            {formattedValueInteger}
        </p>
        <span className="ml-1 text-2xl font-medium text-gray-600">円</span>
      </div>

      <div className={`mt-2 text-2xl font-semibold ${gainLossColor} flex items-center space-x-2`}>
        <p>評価損益(率)</p>
        <span>{formattedGainLoss}円</span>
        <span>{formattedGainLossRate}</span>
      </div>
    </div>
  );
};

export default SummaryCard;
