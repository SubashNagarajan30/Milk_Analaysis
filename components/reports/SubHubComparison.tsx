import React, { useMemo } from 'react';
import Card from '../ui/Card';
import { useData } from '../../hooks/useData';
import type { Hub } from '../../types';

interface SubHubComparisonProps {
  subHubs: Hub[];
  startDate: string;
  endDate: string;
}

interface HubStats {
  hubId: string;
  hubName: string;
  totalQuantity: number;
  avgFat: number;
  avgSnf: number;
  recordCount: number;
}

const SubHubComparison: React.FC<SubHubComparisonProps> = ({ subHubs, startDate, endDate }) => {
  const { getRecordsForHub } = useData();

  const statsByHub: HubStats[] = useMemo(() => {
    return subHubs.map(hub => {
      const records = getRecordsForHub(hub.id, startDate, endDate);
      const totals = records.reduce((acc, record) => {
        const totalDailyQuantity = record.morning.quantity + record.evening.quantity;
        acc.quantity += totalDailyQuantity;
        if(totalDailyQuantity > 0) {
            acc.fat += (record.morning.fat * record.morning.quantity + record.evening.fat * record.evening.quantity);
            acc.snf += (record.morning.snf * record.morning.quantity + record.evening.snf * record.evening.quantity);
        }
        return acc;
      }, { quantity: 0, fat: 0, snf: 0 });

      const recordCount = records.length;
      if (recordCount === 0 || totals.quantity === 0) {
        return { hubId: hub.id, hubName: hub.name, totalQuantity: 0, avgFat: 0, avgSnf: 0, recordCount: 0 };
      }
      
      return {
        hubId: hub.id,
        hubName: hub.name,
        totalQuantity: totals.quantity,
        avgFat: totals.fat / totals.quantity,
        avgSnf: totals.snf / totals.quantity,
        recordCount: recordCount
      };
    });
  }, [subHubs, startDate, endDate, getRecordsForHub]);

  const overallStats = useMemo(() => {
    const totalQuantity = statsByHub.reduce((sum, hub) => sum + hub.totalQuantity, 0);
    
    if (subHubs.length === 0 || totalQuantity === 0) {
        return { avgQuantityPerHub: 0, overallAvgFat: 0, overallAvgSnf: 0 };
    }

    const totalFatProduct = statsByHub.reduce((sum, hub) => sum + (hub.avgFat * hub.totalQuantity), 0);
    const totalSnfProduct = statsByHub.reduce((sum, hub) => sum + (hub.avgSnf * hub.totalQuantity), 0);
    
    return {
        avgQuantityPerHub: totalQuantity / subHubs.length,
        overallAvgFat: totalFatProduct / totalQuantity,
        overallAvgSnf: totalSnfProduct / totalQuantity,
    };
  }, [statsByHub, subHubs.length]);

  const renderDifference = (value: number, unit: string = '') => {
    const isPositive = value > 0;
    const isNegative = value < 0;
    const color = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500';
    const symbol = isPositive ? '▲' : isNegative ? '▼' : ' ';
    return (
      <span className={`font-mono ${color}`}>
        {symbol} {Math.abs(value).toFixed(2)}{unit}
      </span>
    );
  };
  
  if (subHubs.length === 0) {
      return <Card><p className="text-center text-gray-500">This main hub has no sub-hubs to compare.</p></Card>
  }

  return (
    <Card>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Sub Hub Performance Comparison</h3>
      <p className="text-sm text-gray-500 mb-6">Comparing data from <span className="font-semibold">{startDate}</span> to <span className="font-semibold">{endDate}</span></p>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Hub</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Qty (L)</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty vs Avg.</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Fat</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fat vs Avg.</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. SNF</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SNF vs Avg.</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {statsByHub.map(stat => (
              <tr key={stat.hubId}>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stat.hubName}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{stat.totalQuantity.toFixed(2)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">{renderDifference(stat.totalQuantity - overallStats.avgQuantityPerHub)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{stat.avgFat.toFixed(2)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">{renderDifference(stat.avgFat - overallStats.overallAvgFat)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{stat.avgSnf.toFixed(2)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">{renderDifference(stat.avgSnf - overallStats.overallAvgSnf)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default SubHubComparison;