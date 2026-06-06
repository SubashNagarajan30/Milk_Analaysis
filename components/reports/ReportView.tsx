import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';
import type { DailyRecord } from '../../types';

interface ReportViewProps {
  records: DailyRecord[];
}

const ReportView: React.FC<ReportViewProps> = ({ records }) => {
  
  if (records.length === 0) {
      return <Card><p className="text-center text-gray-500">No reports found for the selected period.</p></Card>
  }

  const averages = useMemo(() => {
    if (records.length === 0) return null;
    
    let totalMorningQty = 0;
    let totalEveningQty = 0;
    let totalMorningFat = 0;
    let totalEveningFat = 0;
    let totalMorningSNF = 0;
    let totalEveningSNF = 0;
    
    records.forEach(r => {
      totalMorningQty += r.morning.quantity;
      totalEveningQty += r.evening.quantity;
      totalMorningFat += r.morning.fat;
      totalEveningFat += r.evening.fat;
      totalMorningSNF += r.morning.snf;
      totalEveningSNF += r.evening.snf;
    });
    
    const count = records.length;
    const avgMorningQty = totalMorningQty / count;
    const avgEveningQty = totalEveningQty / count;
    const avgMorningFat = totalMorningFat / count;
    const avgEveningFat = totalEveningFat / count;
    const avgMorningSNF = totalMorningSNF / count;
    const avgEveningSNF = totalEveningSNF / count;
    
    return {
      avgMorningQty,
      avgEveningQty,
      overallQtyDiff: totalEveningQty - totalMorningQty,
      avgTotalQty: avgMorningQty + avgEveningQty,
      
      avgMorningFat,
      avgEveningFat,
      overallFatDiff: totalEveningFat - totalMorningFat,
      avgTotalFat: (avgMorningFat + avgEveningFat) / 2,
      
      avgMorningSNF,
      avgEveningSNF,
      overallSNFDiff: totalEveningSNF - totalMorningSNF,
      avgTotalSNF: (avgMorningSNF + avgEveningSNF) / 2,
    };
  }, [records]);

  const quantityChartData = records.map(r => ({
    date: r.date,
    Morning: r.morning.quantity,
    Evening: r.evening.quantity,
    Total: r.morning.quantity + r.evening.quantity,
  }));
  
  const fatChartData = records.map(r => ({
    date: r.date,
    'Morning Fat': r.morning.fat,
    'Evening Fat': r.evening.fat,
  }));

  const snfChartData = records.map(r => ({
    date: r.date,
    'Morning SNF': r.morning.snf,
    'Evening SNF': r.evening.snf,
  }));

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

  const renderSummaryCard = (
    title: string, 
    mainVal: number,
    morningVal: number, 
    eveningVal: number, 
    diffVal: number, 
    unit: string = ''
  ) => {
    const isPositive = diffVal > 0;
    const isNegative = diffVal < 0;
    const badgeColor = isPositive ? 'bg-green-50 text-green-700 border-green-200' : isNegative ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-700 border-gray-200';
    const symbol = isPositive ? '▲' : isNegative ? '▼' : ' ';
    
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-200">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">10-Day Average</span>
          <h4 className="font-extrabold text-slate-800 text-sm mt-0.5">{title}</h4>
          
          {/* Headline Metric */}
          <div className="my-4">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{mainVal.toFixed(2)}{unit}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3.5 mb-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Morning Session</p>
              <p className="font-bold text-slate-700 mt-0.5">{morningVal.toFixed(2)}{unit}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Evening Session</p>
              <p className="font-bold text-slate-700 mt-0.5">{eveningVal.toFixed(2)}{unit}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
          <p className="text-[11px] text-slate-400 font-medium">Overall Difference</p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${badgeColor}`}>
            {symbol} {Math.abs(diffVal).toFixed(2)}{unit}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {averages && (
        <div className="grid grid-cols-1 gap-4">
          {renderSummaryCard('Milk Quantity', averages.avgTotalQty, averages.avgMorningQty, averages.avgEveningQty, averages.overallQtyDiff, ' L')}
          {renderSummaryCard('Fat Content', averages.avgTotalFat, averages.avgMorningFat, averages.avgEveningFat, averages.overallFatDiff, '')}
          {renderSummaryCard('SNF Content', averages.avgTotalSNF, averages.avgMorningSNF, averages.avgEveningSNF, averages.overallSNFDiff, '')}
        </div>
      )}
      <Card>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Quantity Trend (Liters)</h3>
             <ResponsiveContainer width="100%" height={300}>
                <LineChart data={quantityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Morning" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Evening" stroke="#82ca9d" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Total" stroke="#ffc658" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </Card>
        <Card>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Fat Trend</h3>
             <ResponsiveContainer width="100%" height={300}>
                <LineChart data={fatChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis width={80} tickFormatter={(tick) => `${tick.toFixed(1)}`}/>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="Morning Fat" stroke="#ff7300" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Evening Fat" stroke="#387908" activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </Card>
        <Card>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">SNF Trend</h3>
             <ResponsiveContainer width="100%" height={300}>
                <LineChart data={snfChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis width={80} tickFormatter={(tick) => `${tick.toFixed(1)}`}/>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="Morning SNF" stroke="#0088FE" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Evening SNF" stroke="#00C49F" activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </Card>
        <Card>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Daily Report Details</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">M Qty</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E Qty</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty Diff</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">M Fat</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E Fat</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fat Diff</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">M SNF</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E SNF</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SNF Diff</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {records.map(record => (
                        <tr key={record.id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.date}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{record.morning.quantity.toFixed(2)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{record.evening.quantity.toFixed(2)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">{renderDifference(record.evening.quantity - record.morning.quantity)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{record.morning.fat.toFixed(2)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{record.evening.fat.toFixed(2)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">{renderDifference(record.evening.fat - record.morning.fat)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{record.morning.snf.toFixed(2)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{record.evening.snf.toFixed(2)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">{renderDifference(record.evening.snf - record.morning.snf)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </Card>
    </div>
  );
};

export default ReportView;