
import React from 'react';
import Card from '../ui/Card';

// FIX: Define MilkReport and related types locally as they are not in the global types.ts
// This component appears to be unused, so defining the types here isolates the fix.
interface MilkRecord {
  day: number;
  quantity: number;
  fat: number;
  snf: number;
}
interface MilkReport {
  startDate: string;
  records: MilkRecord[];
}

interface DifferenceReportProps {
  report: MilkReport;
}

interface DifferenceRecord {
  day: number;
  quantity: number;
  fat: number;
  snf: number;
}

const DifferenceReport: React.FC<DifferenceReportProps> = ({ report }) => {
  const differences: DifferenceRecord[] = report.records.map((current, i, arr) => {
    if (i === 0) {
      return { day: current.day, quantity: 0, fat: 0, snf: 0 };
    }
    const previous = arr[i - 1];
    return {
      day: current.day,
      quantity: current.quantity - previous.quantity,
      fat: current.fat - previous.fat,
      snf: current.snf - previous.snf,
    };
  });

  const renderChange = (value: number, unit: string = '') => {
    const isPositive = value > 0;
    const isNegative = value < 0;
    const color = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500';
    const symbol = isPositive ? '▲' : isNegative ? '▼' : '-';
    return (
      <span className={`font-mono ${color}`}>
        {symbol} {Math.abs(value).toFixed(2)}{unit}
      </span>
    );
  };

  return (
    <Card className="col-span-1">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Day-over-Day Differences</h3>
       <p className="text-sm text-gray-500 mb-6">Report from: {report.startDate}</p>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Change</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fat Change</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SNF Change</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {differences.map(diff => (
              <tr key={diff.day}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{diff.day}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{renderChange(diff.quantity, ' L')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{renderChange(diff.fat, '')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{renderChange(diff.snf, '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default DifferenceReport;