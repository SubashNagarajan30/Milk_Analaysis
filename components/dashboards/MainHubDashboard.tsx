import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../hooks/useData';
import Card from '../ui/Card';
import ReportView from '../reports/ReportView';
import ReportForm from '../reports/ReportForm';
import SubHubComparison from '../reports/SubHubComparison';
import SubHubRetestView from '../reports/SubHubRetestView';
import TankerRetestView from '../reports/TankerRetestView';
import type { User, Hub } from '../../types';

interface MainHubDashboardProps {
  user: User;
  view?: 'view_report' | 'add_report';
  setView?: (view: 'view_report' | 'add_report') => void;
}

const MainHubDashboard: React.FC<MainHubDashboardProps> = ({ user, view: externalView, setView: setExternalView }) => {
  const { getSubHubs, getRecordsForHub, addDailyRecord } = useData();
  
  const [internalView, setInternalView] = useState<'view_report' | 'add_report'>('view_report');
  const view = externalView || internalView;
  const setView = setExternalView || setInternalView;
  
  const [reportViewMode, setReportViewMode] = useState<'individual' | 'comparison' | 'retest' | 'tanker'>('individual');
  
  const [selectedHubId, setSelectedHubId] = useState<string>(user.hubId);
  const [retestHubId, setRetestHubId] = useState<string>('');

  const today = new Date();
  const tenDaysAgo = new Date(today);
  tenDaysAgo.setDate(today.getDate() - 10);
  const [startDate, setStartDate] = useState(tenDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const subHubs = useMemo(() => getSubHubs(user.hubId), [user.hubId, getSubHubs]);
  
  // Set default retest hub when sub hubs load
  useEffect(() => {
    if(subHubs.length > 0 && !retestHubId) {
        setRetestHubId(subHubs[0].id);
    }
  }, [subHubs, retestHubId]);

  const allVisibleHubs: Hub[] = useMemo(() => {
    const userHub = {id: user.hubId, name: "My Hub's Report"};
    // Casting is safe here because we know userHub has what we need
    return [userHub as Hub, ...subHubs];
  }, [user.hubId, subHubs]);
  
  const selectedHubRecords = useMemo(() => {
    return getRecordsForHub(selectedHubId, startDate, endDate);
  }, [selectedHubId, startDate, endDate, getRecordsForHub]);
  
  const selectedSubHubForRetest = useMemo(() => {
    if (!retestHubId) return null;
    return subHubs.find(h => h.id === retestHubId) || null;
  }, [retestHubId, subHubs]);

  useEffect(() => {
    setSelectedHubId(user.hubId);
    setView('view_report');
  }, [user]);

  const handleReportAdded = () => {
    setView('view_report');
  }

  if (view === 'add_report') {
    return <ReportForm 
      hubId={user.hubId} 
      onReportAdded={handleReportAdded} 
      addDailyRecord={addDailyRecord}
      selectableHubs={allVisibleHubs}
    />;
  }

  return (
    <div className="space-y-8">
      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 mb-4">
            <h3 className="text-lg font-bold text-gray-800">Reports Date Range</h3>
            <div className="grid grid-cols-1 gap-3 w-full">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" aria-label="Start Date"/>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" aria-label="End Date" />
            </div>
        </div>
        
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
            <button
                onClick={() => setReportViewMode('individual')}
                className={`w-full rounded-md py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 ${reportViewMode === 'individual' ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:bg-white/50'}`}
            >
                Individual Hub Report
            </button>
            <button
                onClick={() => setReportViewMode('comparison')}
                className={`w-full rounded-md py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 ${reportViewMode === 'comparison' ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:bg-white/50'}`}
            >
                Sub Hub Comparison
            </button>
             <button
                onClick={() => setReportViewMode('retest')}
                className={`w-full rounded-md py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 ${reportViewMode === 'retest' ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:bg-white/50'}`}
            >
                Sub Hub Re-testing
            </button>
             <button
                onClick={() => setReportViewMode('tanker')}
                className={`w-full rounded-md py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 ${reportViewMode === 'tanker' ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:bg-white/50'}`}
            >
                Tanker Retesting
            </button>
        </div>
      </Card>
      
      {reportViewMode === 'individual' && (
        <div className="space-y-8">
            <Card>
                <div className="flex items-center gap-4">
                    <label htmlFor="hub-select-main" className="text-sm font-medium text-gray-700 whitespace-nowrap">Viewing Report For:</label>
                    <select
                        id="hub-select-main"
                        value={selectedHubId}
                        onChange={(e) => setSelectedHubId(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        {allVisibleHubs.map(hub => <option key={hub.id} value={hub.id}>{hub.name}</option>)}
                    </select>
                </div>
            </Card>
            <ReportView records={selectedHubRecords} />
        </div>
      )}

      {reportViewMode === 'comparison' && (
        <SubHubComparison subHubs={subHubs} startDate={startDate} endDate={endDate} />
      )}
      
      {reportViewMode === 'retest' && (
        <div className="space-y-8">
            <Card>
                <div className="flex items-center gap-4">
                    <label htmlFor="hub-select-retest" className="text-sm font-medium text-gray-700 whitespace-nowrap">Select Sub-Hub to Re-test:</label>
                    <select
                        id="hub-select-retest"
                        value={retestHubId}
                        onChange={(e) => setRetestHubId(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        disabled={subHubs.length === 0}
                    >
                        {subHubs.map(hub => <option key={hub.id} value={hub.id}>{hub.name}</option>)}
                    </select>
                </div>
                {subHubs.length === 0 && <p className="text-xs text-center text-gray-500 mt-2">This main hub has no sub-hubs to re-test.</p>}
            </Card>
            {selectedSubHubForRetest ? (
                <SubHubRetestView subHub={selectedSubHubForRetest} startDate={startDate} endDate={endDate} />
            ) : (
                subHubs.length > 0 && <Card><p className="text-center text-gray-500">Please select a sub-hub to view quality control data.</p></Card>
            )}
        </div>
      )}
      
      {reportViewMode === 'tanker' && (
        <TankerRetestView mainHubId={user.hubId} />
      )}


    </div>
  );
};

export default MainHubDashboard;