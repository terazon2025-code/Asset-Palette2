import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getTypeColor, getGeneralColor } from '../constants';
import { ChartView } from './Dashboard';

interface ChartDataEntry {
  name: string;
  value: number;
  type?: string;
}

interface PortfolioPieChartProps {
  byAccount: ChartDataEntry[];
  byAssetClass: ChartDataEntry[];
  byHolding: ChartDataEntry[];
  view: ChartView;
  onViewChange: (view: ChartView) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const formattedValue = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(data.value);
    return (
      <div className="bg-white/90 p-3 rounded-md border border-gray-200 shadow-lg backdrop-blur-sm pointer-events-none">
        <p className="font-bold text-gray-800">{`${data.name}`}</p>
        <p className="text-gray-900 font-semibold">{`${formattedValue}`}</p>
        <p className="text-xs text-gray-500">{`(${((data.value / payload[0].payload.total) * 100).toFixed(2)}%)`}</p>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, name, value, percent, payload } = props;
    const isMobile = window.innerWidth < 640;
    
    // Don't render label for small slices to avoid clutter
    if (percent < 0.03) {
        return null;
    }

    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const radius = outerRadius + (isMobile ? 15 : 25); // Shorter line on mobile
    const x = cx + radius * cos;
    const y = cy + radius * sin;
    const ex = x + (cos >= 0 ? 1 : -1) * 22;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <path d={`M${cx + (outerRadius+5) * cos},${cy + (outerRadius+5) * sin}L${x},${y}L${ex},${y}`} stroke="#9ca3af" fill="none" strokeWidth={1} />
            <text x={ex + (cos >= 0 ? 1 : -1) * 6} y={y} textAnchor={textAnchor} fill="#1f2937" dominantBaseline="central" className="text-lg font-medium">
                {name}
            </text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 6} y={y} dy={24} textAnchor={textAnchor} fill="#4b5563" className="text-base">
                {`${new Intl.NumberFormat('ja-JP').format(value)}円 (${(percent * 100).toFixed(1)}%)`}
            </text>
        </g>
    );
};


const PortfolioPieChart: React.FC<PortfolioPieChartProps> = ({ byAccount, byAssetClass, byHolding, view, onViewChange }) => {
  const data = view === 'assetClass' ? byAssetClass : view === 'account' ? byAccount : byHolding;
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  const chartData = data.map(item => ({ ...item, total }));
  
  const getColor = (entry: ChartDataEntry) => {
    if (view === 'assetClass') {
      // Use semantic color for the asset type name itself
      return getTypeColor(entry.name) || getGeneralColor(entry.name);
    }
    if (view === 'holding') {
      // Use semantic color for the holding's underlying asset type
      return getTypeColor(entry.type!) || getGeneralColor(entry.name);
    }
    // For 'account' view, use the general, non-semantic palette
    return getGeneralColor(entry.name);
  };


  return (
    <div className="bg-white border border-gray-200 p-4 sm:p-6 rounded-lg h-full flex flex-col shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-900">アセットアロケーション</h2>
        <div className="flex flex-col sm:flex-row text-sm bg-gray-200 p-1 rounded-lg self-stretch sm:self-auto">
          <button 
            onClick={() => onViewChange('assetClass')}
            className={`px-3 py-1.5 rounded-md transition-colors text-base font-bold text-center ${view === 'assetClass' ? 'bg-white text-gray-800 shadow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            資産クラス別
          </button>
          <button 
            onClick={() => onViewChange('account')}
            className={`px-3 py-1.5 rounded-md transition-colors text-base font-bold text-center ${view === 'account' ? 'bg-white text-gray-800 shadow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            口座別
          </button>
          <button 
            onClick={() => onViewChange('holding')}
            className={`px-3 py-1.5 rounded-md transition-colors text-base font-bold text-center ${view === 'holding' ? 'bg-white text-gray-800 shadow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            保有名柄別
          </button>
        </div>
      </div>
      <div className="relative flex-grow w-full h-[26rem] sm:h-[32rem]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 30, right: 40, bottom: 30, left: 40 }}>
            <Tooltip 
              content={<CustomTooltip />} 
              wrapperStyle={{ outline: 'none' }}
              offset={25}
              isAnimationActive={false}
              animationDuration={0}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={'70%'}
              outerRadius={'85%'}
              fill="#8884d8"
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              labelLine={false}
              label={renderCustomizedLabel}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PortfolioPieChart;
