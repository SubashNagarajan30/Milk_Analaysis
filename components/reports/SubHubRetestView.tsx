import React, { useMemo, useState } from 'react';
import Card from '../ui/Card';
import { useData } from '../../hooks/useData';
import RetestModal from '../modals/RetestModal';
import type { Hub, DailyRecord, Collection } from '../../types';

interface SubHubRetestViewProps {
  subHub: Hub;
  startDate: string;
  endDate: string;
}

interface FlattenedRecord {
  recordId: string;
  hubId: string;
  hubName: string;
  date: string;
  session: 'Morning' | 'Evening';
  original: Collection;
  retest?: Collection;
}

type RetestingState = {
    record: FlattenedRecord;
} | null;

const SubHubRetestView: React.FC<SubHubRetestViewProps> = ({ subHub, startDate, endDate }) => {
  const { getRecordsForHub, addRetestRecord } = useData();
  const [retesting, setRetesting] = useState<RetestingState>(null);

  const flattenedRecords: FlattenedRecord[] = useMemo(() => {
    const allRecords: FlattenedRecord[] = [];
    const records = getRecordsForHub(subHub.id, startDate, endDate);
    for (const record of records) {
        allRecords.push({
          recordId: record.id,
          hubId: subHub.id,
          hubName: subHub.name,
          date: record.date,
          session: 'Morning',
          original: record.morning,
          retest: record.morningReTest,
        });
        allRecords.push({
          recordId: record.id,
          hubId: subHub.id,
          hubName: subHub.name,
          date: record.date,
          session: 'Evening',
          original: record.evening,
          retest: record.eveningReTest,
        });
    }
    return allRecords.sort((a,b) => b.date.localeCompare(a.date) || a.session.localeCompare(b.session));
  }, [subHub, startDate, endDate, getRecordsForHub]);

  const retestAverages = useMemo(() => {
    const recordsWithRetest = flattenedRecords.filter(r => r.retest !== undefined);
    if (recordsWithRetest.length === 0) return null;
    
    let totalQtyDiff = 0;
    let totalFatDiff = 0;
    let totalSNFDiff = 0;
    
    recordsWithRetest.forEach(r => {
      if (r.retest) {
        totalQtyDiff += r.retest.quantity - r.original.quantity;
        totalFatDiff += r.retest.fat - r.original.fat;
        totalSNFDiff += r.retest.snf - r.original.snf;
      }
    });
    
    const count = recordsWithRetest.length;
    
    return {
      overallQtyDiff: totalQtyDiff,
      overallFatDiff: totalFatDiff,
      overallSNFDiff: totalSNFDiff,
    };
  }, [flattenedRecords]);

  const handleSaveRetest = (retestData: Collection) => {
    if (retesting) {
        addRetestRecord(retesting.record.recordId, retesting.record.session.toLowerCase() as 'morning' | 'evening', retestData);
        setRetesting(null);
    }
  }

  const renderDifference = (original: number, retest: number | undefined, unit: string = '') => {
    if (retest === undefined) {
      return <span className="text-gray-400 italic">N/A</span>;
    }
    const value = retest - original;
    const isPositive = value > 0;
    const isNegative = value < 0;
    const color = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500';
    const symbol = isPositive ? '▲' : isNegative ? '▼' : '';
    return (
      <span className={`font-mono ${color}`}>
        {symbol} {Math.abs(value).toFixed(2)}{unit}
      </span>
    );
  };

  const renderRetestSummaryCard = (title: string, diffVal: number, unit: string = '') => {
    const isPositive = diffVal > 0;
    const isNegative = diffVal < 0;
    const badgeColor = isPositive 
      ? 'bg-green-50 text-green-700 border-green-200' 
      : isNegative 
        ? 'bg-rose-50 text-rose-700 border-rose-200' 
        : 'bg-slate-50 text-slate-700 border-slate-200';
    const symbol = isPositive ? '▲' : isNegative ? '▼' : ' ';
    const description = isPositive 
      ? 'Main Hub recorded higher values overall' 
      : isNegative 
        ? 'Sub Hub recorded higher values overall' 
        : 'Perfect alignment overall';
        
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Quality Control Metric</span>
          <h4 className="font-extrabold text-slate-800 text-base mt-1 mb-2">{title} Discrepancy</h4>
          <p className="text-xs text-slate-500 mb-4">{description}</p>
        </div>
        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-400 font-semibold mb-1">Overall Difference</p>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
            {symbol} {Math.abs(diffVal).toFixed(2)}{unit}
          </span>
        </div>
      </div>
    );
  };
  
  if (flattenedRecords.length === 0) {
       return <Card><p className="text-center text-gray-500">No reports found from {subHub.name} for the selected period.</p></Card>
  }

  return (
    <>
    {retestAverages && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 animate-fade-in">
        {renderRetestSummaryCard('Milk Quantity', retestAverages.overallQtyDiff, ' L')}
        {renderRetestSummaryCard('Fat Content', retestAverages.overallFatDiff, '')}
        {renderRetestSummaryCard('SNF Content', retestAverages.overallSNFDiff, '')}
      </div>
    )}
    <Card>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Quality Control for {subHub.name}</h3>
      <p className="text-sm text-gray-500 mb-6">Comparing sub-hub entries with main hub re-tests from <span className="font-semibold">{startDate}</span> to <span className="font-semibold">{endDate}</span></p>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-blue-600">Sub Hub Qty</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-indigo-600">Main Hub Qty</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty Diff</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-blue-600">Sub Hub Fat</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-indigo-600">Main Hub Fat</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fat Diff</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-blue-600">Sub Hub SNF</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-indigo-600">Main Hub SNF</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SNF Diff</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {flattenedRecords.map((item, index) => (
              <tr key={index}>
                <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">{item.date}</td>
                <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-600">{item.session}</td>
                <td className="px-2 py-4 whitespace-nowrap text-sm text-blue-700">{item.original.quantity.toFixed(2)}</td>
                <td className="px-2 py-4 whitespace-nowrap text-sm text-indigo-700">{item.retest ? item.retest.quantity.toFixed(2) : '-'}</td>
                <td className="px-2 py-4 whitespace-nowrap text-sm">{renderDifference(item.original.quantity, item.retest?.quantity)}</td>
                <td className="px-2 py-4 whitespace-nowrap text-sm text-blue-700">{item.original.fat.toFixed(2)}</td>
                <td className="px-2 py-4 whitespace-nowrap text-sm text-indigo-700">{item.retest ? item.retest.fat.toFixed(2) : '-'}</td>
                <td className="px-2 py-4 whitespace-nowrap text-sm">{renderDifference(item.original.fat, item.retest?.fat)}</td>
                <td className="px-2 py-4 whitespace-nowrap text-sm text-blue-700">{item.original.snf.toFixed(2)}</td>
                <td className="px-2 py-4 whitespace-nowrap text-sm text-indigo-700">{item.retest ? item.retest.snf.toFixed(2) : '-'}</td>
                <td className="px-2 py-4 whitespace-nowrap text-sm">{renderDifference(item.original.snf, item.retest?.snf)}</td>
                <td className="px-2 py-4 whitespace-nowrap text-sm">
                    <button 
                        onClick={() => setRetesting({ record: item })}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                       {item.retest ? 'Edit Re-test' : 'Re-test'}
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
    {retesting && (
        <RetestModal 
            record={retesting.record}
            onClose={() => setRetesting(null)}
            onSave={handleSaveRetest}
        />
    )}
    </>
  );
};

export default SubHubRetestView;