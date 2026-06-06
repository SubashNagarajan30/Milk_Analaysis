import React, { useState } from 'react';
import Card from '../ui/Card';
import type { DailyRecord, Collection, Hub } from '../../types';

interface ReportFormProps {
  hubId: string;
  onReportAdded: () => void;
  addDailyRecord: (recordData: Omit<DailyRecord, 'id'>) => void;
  selectableHubs?: Hub[];
}

const ReportForm: React.FC<ReportFormProps> = ({ hubId, onReportAdded, addDailyRecord, selectableHubs }) => {
  const [selectedHubId, setSelectedHubId] = useState(hubId);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [morning, setMorning] = useState<Collection>({ quantity: 0, fat: 0, snf: 0 });
  const [evening, setEvening] = useState<Collection>({ quantity: 0, fat: 0, snf: 0 });

  const handleInputChange = (session: 'morning' | 'evening', field: keyof Collection, value: string) => {
    const numericValue = parseFloat(value) || 0;
    const setter = session === 'morning' ? setMorning : setEvening;
    setter(prev => ({ ...prev, [field]: numericValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDailyRecord({ hubId: selectedHubId, date, morning, evening });
    onReportAdded();
  };

  const renderCollectionInputs = (session: 'morning' | 'evening') => (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <h4 className="font-semibold text-gray-700 mb-3 text-lg capitalize">{session} Collection</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity (Liters)</label>
          <input 
            type="number" 
            step="0.01" 
            value={session === 'morning' ? morning.quantity : evening.quantity} 
            onChange={(e) => handleInputChange(session, 'quantity', e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fat</label>
          <input 
            type="number" 
            step="0.01" 
            value={session === 'morning' ? morning.fat : evening.fat} 
            onChange={(e) => handleInputChange(session, 'fat', e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">SNF</label>
          <input 
            type="number" 
            step="0.01" 
            value={session === 'morning' ? morning.snf : evening.snf} 
            onChange={(e) => handleInputChange(session, 'snf', e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
          />
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Enter Daily Milk Report</h3>
      <form onSubmit={handleSubmit}>
        {selectableHubs && selectableHubs.length > 1 && (
          <div className="mb-6">
            <label htmlFor="hub-select" className="block text-sm font-medium text-gray-700 mb-1">Select Hub for Report</label>
            <select
              id="hub-select"
              value={selectedHubId}
              onChange={(e) => setSelectedHubId(e.target.value)}
              className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {selectableHubs.map(hub => (
                <option key={hub.id} value={hub.id}>
                  {hub.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-6">
            <label htmlFor="report-date" className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
            <input 
                type="date" 
                id="report-date"
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
        </div>

        <div className="grid grid-cols-1 gap-6">
            {renderCollectionInputs('morning')}
            {renderCollectionInputs('evening')}
        </div>
        
        <div className="mt-8 flex justify-end">
          <button type="button" onClick={onReportAdded} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Cancel
          </button>
          <button type="submit" className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Save Report
          </button>
        </div>
      </form>
    </Card>
  );
};

export default ReportForm;