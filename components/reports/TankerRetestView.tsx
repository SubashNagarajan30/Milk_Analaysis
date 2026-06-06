import React, { useState, useMemo, useEffect } from 'react';
import Card from '../ui/Card';
import { useData } from '../../hooks/useData';
import type { Hub, Collection, TankerRetest } from '../../types';

interface TankerRetestViewProps {
  mainHubId: string;
}

const TankerRetestView: React.FC<TankerRetestViewProps> = ({ mainHubId }) => {
  const { getHubById, getSubHubs, dailyRecords, tankers, addTankerRetest } = useData();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Input states for new tanker retest
  const [tankerQty, setTankerQty] = useState('');
  const [tankerFat, setTankerFat] = useState('');
  const [tankerSNF, setTankerSNF] = useState('');

  // History date range selector
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  const [historyStart, setHistoryStart] = useState(tenDaysAgo.toISOString().split('T')[0]);
  const [historyEnd, setHistoryEnd] = useState(todayStr);

  const mainHub = getHubById(mainHubId);
  const subHubs = getSubHubs(mainHubId);
  
  const allHubs = useMemo(() => {
    return mainHub ? [mainHub, ...subHubs] : subHubs;
  }, [mainHub, subHubs]);

  // Find existing tanker record for the selected date
  const existingTanker = useMemo(() => {
    return tankers.find(
      t => t.hubId === mainHubId && t.date === selectedDate
    );
  }, [tankers, mainHubId, selectedDate]);

  // Prefill input fields if existing record is found
  useEffect(() => {
    if (existingTanker) {
      setTankerQty(existingTanker.quantity.toString());
      setTankerFat(existingTanker.fat.toString());
      setTankerSNF(existingTanker.snf.toString());
    } else {
      setTankerQty('');
      setTankerFat('');
      setTankerSNF('');
    }
  }, [selectedDate, existingTanker]);

  // Compute centers' details & sums for the selected date (combining morning and evening)
  const centersCalculation = useMemo(() => {
    let totalCentersQty = 0;
    let totalFatWeightedSum = 0;
    let totalSNFWeightedSum = 0;

    const details = allHubs.map(hub => {
      const hubRecord = dailyRecords.find(r => r.hubId === hub.id && r.date === selectedDate);
      let morningQty = 0;
      let morningFat = 0;
      let morningSNF = 0;
      let morningSource: 'Retest' | 'Original' | 'No Entry' = 'No Entry';

      let eveningQty = 0;
      let eveningFat = 0;
      let eveningSNF = 0;
      let eveningSource: 'Retest' | 'Original' | 'No Entry' = 'No Entry';

      if (hubRecord) {
        // Morning
        const mOriginal = hubRecord.morning;
        const mRetest = hubRecord.morningReTest;
        if (hub.parentId) {
          // Sub-hub: prioritize Retest
          if (mRetest) {
            morningQty = mRetest.quantity;
            morningFat = mRetest.fat;
            morningSNF = mRetest.snf;
            morningSource = 'Retest';
          } else if (mOriginal) {
            morningQty = mOriginal.quantity;
            morningFat = mOriginal.fat;
            morningSNF = mOriginal.snf;
            morningSource = 'Original';
          }
        } else {
          // Main Hub: original
          if (mOriginal) {
            morningQty = mOriginal.quantity;
            morningFat = mOriginal.fat;
            morningSNF = mOriginal.snf;
            morningSource = 'Original';
          }
        }

        // Evening
        const eOriginal = hubRecord.evening;
        const eRetest = hubRecord.eveningReTest;
        if (hub.parentId) {
          // Sub-hub: prioritize Retest
          if (eRetest) {
            eveningQty = eRetest.quantity;
            eveningFat = eRetest.fat;
            eveningSNF = eRetest.snf;
            eveningSource = 'Retest';
          } else if (eOriginal) {
            eveningQty = eOriginal.quantity;
            eveningFat = eOriginal.fat;
            eveningSNF = eOriginal.snf;
            eveningSource = 'Original';
          }
        } else {
          // Main Hub: original
          if (eOriginal) {
            eveningQty = eOriginal.quantity;
            eveningFat = eOriginal.fat;
            eveningSNF = eOriginal.snf;
            eveningSource = 'Original';
          }
        }
      }

      // Combine Morning & Evening for this hub
      const combinedQty = morningQty + eveningQty;
      const combinedFat = combinedQty > 0 ? (morningQty * morningFat + eveningQty * eveningFat) / combinedQty : 0;
      const combinedSNF = combinedQty > 0 ? (morningQty * morningSNF + eveningQty * eveningSNF) / combinedQty : 0;

      let source = 'No Entry';
      if (morningSource !== 'No Entry' || eveningSource !== 'No Entry') {
        if (hub.parentId) {
          if (morningSource === 'Retest' && eveningSource === 'Retest') {
            source = 'Retest (M+E)';
          } else if (morningSource === 'Retest') {
            source = 'Retest (M) / Orig (E)';
          } else if (eveningSource === 'Retest') {
            source = 'Orig (M) / Retest (E)';
          } else {
            source = 'Original (M+E)';
          }
        } else {
          source = 'Original (M+E)';
        }
      }

      totalCentersQty += combinedQty;
      totalFatWeightedSum += (morningQty * morningFat + eveningQty * eveningFat);
      totalSNFWeightedSum += (morningQty * morningSNF + eveningQty * eveningSNF);

      return {
        hubId: hub.id,
        hubName: hub.name,
        qty: combinedQty,
        fat: combinedFat,
        snf: combinedSNF,
        source,
        isSubHub: !!hub.parentId
      };
    });

    const overallCentersFat = totalCentersQty > 0 ? totalFatWeightedSum / totalCentersQty : 0;
    const overallCentersSNF = totalCentersQty > 0 ? totalSNFWeightedSum / totalCentersQty : 0;

    return {
      details,
      totalCentersQty,
      overallCentersFat,
      overallCentersSNF
    };
  }, [allHubs, dailyRecords, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tankerQty || !tankerFat || !tankerSNF) {
      alert('Please fill out all tanker retest fields.');
      return;
    }

    await addTankerRetest({
      hubId: mainHubId,
      date: selectedDate,
      session: 'morning', // Backend requires a session field, we can default it or let it run
      quantity: parseFloat(tankerQty),
      fat: parseFloat(tankerFat),
      snf: parseFloat(tankerSNF)
    });
  };

  // Difference calculations
  const inputQty = parseFloat(tankerQty) || 0;
  const inputFat = parseFloat(tankerFat) || 0;
  const inputSNF = parseFloat(tankerSNF) || 0;

  const diffQty = inputQty > 0 ? inputQty - centersCalculation.totalCentersQty : 0;
  const diffFat = inputFat > 0 ? inputFat - centersCalculation.overallCentersFat : 0;
  const diffSNF = inputSNF > 0 ? inputSNF - centersCalculation.overallCentersSNF : 0;

  // Compute history of daily combined tanker retests
  const historyList = useMemo(() => {
    return tankers
      .filter(t => t.hubId === mainHubId && t.date >= historyStart && t.date <= historyEnd)
      .map(t => {
        let totalQty = 0;
        let fatWeightedSum = 0;
        let snfWeightedSum = 0;

        allHubs.forEach(hub => {
          const record = dailyRecords.find(r => r.hubId === hub.id && r.date === t.date);
          let mQty = 0;
          let mFat = 0;
          let mSNF = 0;
          let eQty = 0;
          let eFat = 0;
          let eSNF = 0;

          if (record) {
            // Morning
            if (hub.parentId) {
              if (record.morningReTest) {
                mQty = record.morningReTest.quantity;
                mFat = record.morningReTest.fat;
                mSNF = record.morningReTest.snf;
              } else if (record.morning) {
                mQty = record.morning.quantity;
                mFat = record.morning.fat;
                mSNF = record.morning.snf;
              }
            } else {
              if (record.morning) {
                mQty = record.morning.quantity;
                mFat = record.morning.fat;
                mSNF = record.morning.snf;
              }
            }

            // Evening
            if (hub.parentId) {
              if (record.eveningReTest) {
                eQty = record.eveningReTest.quantity;
                eFat = record.eveningReTest.fat;
                eSNF = record.eveningReTest.snf;
              } else if (record.evening) {
                eQty = record.evening.quantity;
                eFat = record.evening.fat;
                eSNF = record.evening.snf;
              }
            } else {
              if (record.evening) {
                eQty = record.evening.quantity;
                eFat = record.evening.fat;
                eSNF = record.evening.snf;
              }
            }
          }

          totalQty += (mQty + eQty);
          fatWeightedSum += (mQty * mFat + eQty * eFat);
          snfWeightedSum += (mQty * mSNF + eQty * eSNF);
        });

        const centersFat = totalQty > 0 ? fatWeightedSum / totalQty : 0;
        const centersSNF = totalQty > 0 ? snfWeightedSum / totalQty : 0;

        return {
          ...t,
          centersQty: totalQty,
          centersFat,
          centersSNF,
          diffQty: t.quantity - totalQty,
          diffFat: t.fat - centersFat,
          diffSNF: t.snf - centersSNF
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [tankers, mainHubId, historyStart, historyEnd, allHubs, dailyRecords]);

  // Compute overall discrepancy totals for the history list
  const overallHistoryDiscrepancy = useMemo(() => {
    let totalQtyDiff = 0;
    let totalFatDiff = 0;
    let totalSNFDiff = 0;

    historyList.forEach(item => {
      totalQtyDiff += item.diffQty;
      totalFatDiff += item.diffFat;
      totalSNFDiff += item.diffSNF;
    });

    return {
      totalQtyDiff,
      totalFatDiff,
      totalSNFDiff,
      count: historyList.length
    };
  }, [historyList]);

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
      ? 'Tanker measured higher values overall' 
      : isNegative 
        ? 'Centers recorded higher values overall' 
        : 'Perfect alignment overall';
        
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-200">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tanker Quality Discrepancy</span>
          <h4 className="font-extrabold text-slate-800 text-sm mt-1 mb-2">{title}</h4>
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

  const renderDiffBadge = (val: number, isQty: boolean = false) => {
    const isPositive = val > 0;
    const isNegative = val < 0;
    const color = isPositive ? 'text-green-600' : isNegative ? 'text-rose-600' : 'text-gray-500';
    const symbol = isPositive ? '▲' : isNegative ? '▼' : '';
    const unit = isQty ? ' L' : '';
    return (
      <span className={`font-bold font-mono ${color}`}>
        {symbol} {Math.abs(val).toFixed(2)}{unit}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Section: Retest Entry Form & Real-time Comparison side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Entry Form Card */}
        <Card className="card-premium">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Daily Tanker Quality Retesting</h3>
          <p className="text-sm text-gray-500 mb-6">Enter combined daily tanker results to compare against combined center collections (Morning + Evening).</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Select Date</label>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={e => setSelectedDate(e.target.value)} 
                className="w-full"
              />
            </div>

            <div className="border-t border-slate-100 pt-4 mt-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-3">Tanker Measured Metrics (Daily Total)</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tanker Milk (L)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="e.g. 3000" 
                    value={tankerQty} 
                    onChange={e => setTankerQty(e.target.value)}
                    required 
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tanker Fat</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="e.g. 4.1" 
                    value={tankerFat} 
                    onChange={e => setTankerFat(e.target.value)}
                    required 
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tanker SNF</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="e.g. 8.6" 
                    value={tankerSNF} 
                    onChange={e => setTankerSNF(e.target.value)}
                    required 
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-sm hover:shadow transition mt-6"
            >
              {existingTanker ? 'Update Tanker Retest' : 'Save Tanker Retest'}
            </button>
          </form>
        </Card>

        {/* Real-time Comparison Card */}
        <Card className="card-premium flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Tanker vs Centers Comparison</h3>
                <p className="text-xs text-gray-500">Combined Morning + Evening values for {selectedDate}</p>
              </div>
              {existingTanker && (
                <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 font-bold uppercase rounded-full border border-green-200">
                  Record Saved
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Quantity Diff</span>
                <span className="text-sm block font-extrabold text-slate-800">
                  {inputQty > 0 ? renderDiffBadge(diffQty, true) : <span className="text-slate-400 font-medium">No input</span>}
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Fat Diff</span>
                <span className="text-sm block font-extrabold text-slate-800">
                  {inputFat > 0 ? renderDiffBadge(diffFat) : <span className="text-slate-400 font-medium">No input</span>}
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">SNF Diff</span>
                <span className="text-sm block font-extrabold text-slate-800">
                  {inputSNF > 0 ? renderDiffBadge(diffSNF) : <span className="text-slate-400 font-medium">No input</span>}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Calculated Centers Combined Metrics (M+E)</span>
              <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Centers Milk</span>
                  <span className="text-base font-bold text-slate-800 mt-0.5 block">{centersCalculation.totalCentersQty.toFixed(2)} L</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Centers Fat</span>
                  <span className="text-base font-bold text-slate-800 mt-0.5 block">{centersCalculation.overallCentersFat.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Centers SNF</span>
                  <span className="text-base font-bold text-slate-800 mt-0.5 block">{centersCalculation.overallCentersSNF.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/40 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
            <span className="text-base">ℹ️</span>
            <div>
              <strong>Note:</strong> Center values show combined Morning + Evening totals. Sub Hub collections are sourced from Main Hub **re-test** records where they exist; otherwise, original recorded values are used.
            </div>
          </div>
        </Card>
      </div>

      {/* Centers Contribution breakdown Table */}
      <Card className="card-premium">
        <h4 className="text-base font-bold text-gray-800 mb-3">Individual Center Contribution Breakdowns (M+E Combined)</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Center Name</th>
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Milk Qty (L)</th>
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Fat</th>
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">SNF</th>
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Source Used</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {centersCalculation.details.map(detail => {
                const badgeColor = detail.source.startsWith('Retest') 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                  : detail.source.startsWith('Orig')
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-50 text-slate-400 border-slate-200';
                
                return (
                  <tr key={detail.hubId}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">{detail.hubName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {detail.isSubHub ? 'Sub Center' : 'Main Center'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{detail.qty.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{detail.fat.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{detail.snf.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      <span className={`inline-flex px-2 py-0.5 rounded-full font-bold border ${badgeColor}`}>
                        {detail.source}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tanker Retesting History */}
      <Card className="card-premium">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Daily Tanker Retest History</h3>
            <p className="text-xs text-gray-500">Track and review past daily tanker retests and discrepancies (Morning + Evening).</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">From</label>
              <input 
                type="date" 
                value={historyStart} 
                onChange={e => setHistoryStart(e.target.value)} 
                className="text-xs py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">To</label>
              <input 
                type="date" 
                value={historyEnd} 
                onChange={e => setHistoryEnd(e.target.value)} 
                className="text-xs py-1"
              />
            </div>
          </div>
        </div>

        {/* Overall Discrepancies Summary Panel */}
        {historyList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {renderRetestSummaryCard('Milk Quantity', overallHistoryDiscrepancy.totalQtyDiff, ' L')}
            {renderRetestSummaryCard('Fat Content', overallHistoryDiscrepancy.totalFatDiff, '')}
            {renderRetestSummaryCard('SNF Content', overallHistoryDiscrepancy.totalSNFDiff, '')}
          </div>
        )}

        <div className="overflow-x-auto">
          {historyList.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tanker Qty</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">Centers Qty</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">Qty Diff</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tanker Fat</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">Centers Fat</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">Fat Diff</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tanker SNF</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">Centers SNF</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">SNF Diff</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {historyList.map(item => (
                  <tr key={item.id}>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{item.date}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">{item.quantity.toFixed(2)} L</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.centersQty.toFixed(2)} L</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{renderDiffBadge(item.diffQty, true)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">{item.fat.toFixed(2)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.centersFat.toFixed(2)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{renderDiffBadge(item.diffFat)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">{item.snf.toFixed(2)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.centersSNF.toFixed(2)}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">{renderDiffBadge(item.diffSNF)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center py-6 text-gray-500 italic">No tanker retests recorded in this period.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TankerRetestView;
