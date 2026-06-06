import React, { useState, useMemo } from 'react';
import { useData } from '../../hooks/useData';
import Card from '../ui/Card';
import ReportView from '../reports/ReportView';
import ReportForm from '../reports/ReportForm';
import SubHubQualityReport from '../reports/SubHubQualityReport';
import type { User } from '../../types';

interface SubHubDashboardProps {
  user: User;
  view?: 'view_report' | 'add_report';
  setView?: (view: 'view_report' | 'add_report') => void;
}

const SubHubDashboard: React.FC<SubHubDashboardProps> = ({ user, view: externalView, setView: setExternalView }) => {
  const { getRecordsForHub, addDailyRecord } = useData();
  
  const [internalView, setInternalView] = useState<'view_report' | 'add_report'>('view_report');
  const view = externalView || internalView;
  const setView = setExternalView || setInternalView;
  const [reportViewMode, setReportViewMode] = useState<'entry' | 'quality'>('entry');

  const today = new Date();
  const tenDaysAgo = new Date(today);
  tenDaysAgo.setDate(today.getDate() - 10);

  const [startDate, setStartDate] = useState(tenDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  
  const myRecords = useMemo(() => getRecordsForHub(user.hubId, startDate, endDate), [user.hubId, startDate, endDate, getRecordsForHub]);

  const handleReportAdded = () => {
    setView('view_report');
  }

  if (view === 'add_report') {
    return <ReportForm hubId={user.hubId} onReportAdded={handleReportAdded} addDailyRecord={addDailyRecord}/>;
  }
  
  return (
    <div className="space-y-8">
      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 mb-2">
            <h3 className="text-lg font-bold text-gray-800">Reports Date Range</h3>
            <div className="grid grid-cols-1 gap-3 w-full">
                <div>
                    <label htmlFor="start-date" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">From Date</label>
                    <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">To Date</label>
                    <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
            </div>
        </div>
         <div className="mt-4 flex space-x-1 rounded-lg bg-gray-100 p-1">
            <button
                onClick={() => setReportViewMode('entry')}
                className={`w-full rounded-md py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 ${reportViewMode === 'entry' ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:bg-white/50'}`}
            >
                My Daily Entry
            </button>
            <button
                onClick={() => setReportViewMode('quality')}
                className={`w-full rounded-md py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 ${reportViewMode === 'quality' ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:bg-white/50'}`}
            >
                Quality Control Report
            </button>
        </div>
      </Card>
      
      {reportViewMode === 'entry' && <ReportView records={myRecords} />}
      {reportViewMode === 'quality' && <SubHubQualityReport hubId={user.hubId} startDate={startDate} endDate={endDate} />}

    </div>
  );
};

export default SubHubDashboard;