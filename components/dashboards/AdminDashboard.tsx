import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../hooks/useData';
import Card from '../ui/Card';
import ReportView from '../reports/ReportView';
import EditHubUserModal from '../modals/EditHubUserModal';
import type { Hub, User } from '../../types';

interface HubManagementProps {
    hubs: Hub[];
    users: User[];
    mainHubs: Hub[];
    addHub: (name: string, parentId?: string | null) => void;
    updateUserCredentials: (userId: string, credentials: { username?: string; password?: string }) => void;
}

const HubManagement: React.FC<HubManagementProps> = ({hubs, users, mainHubs, addHub, updateUserCredentials}) => {
    const [mainHubName, setMainHubName] = useState('');
    const [subHubName, setSubHubName] = useState('');
    const [parentHubId, setParentHubId] = useState<string>('');
    const [editingHub, setEditingHub] = useState<Hub | null>(null);

    const userForEditingHub = useMemo(() => {
        if (!editingHub) return undefined;
        return users.find(u => u.hubId === editingHub.id);
    }, [editingHub, users]);

    useEffect(() => {
        if (mainHubs.length > 0 && !mainHubs.some(h => h.id === parentHubId)) {
            setParentHubId(mainHubs[0].id);
        } else if (mainHubs.length === 0) {
            setParentHubId('');
        }
    }, [mainHubs, parentHubId]);

    const handleAddMainHub = (e: React.FormEvent) => {
        e.preventDefault();
        if (mainHubName.trim() === '') return;
        addHub(mainHubName, null);
        setMainHubName('');
    }
    
    const handleAddSubHub = (e: React.FormEvent) => {
        e.preventDefault();
        if (subHubName.trim() === '' || !parentHubId) return;
        addHub(subHubName, parentHubId);
        setSubHubName('');
    }
    
    const handleSaveCredentials = (userId: string, credentials: { username?: string, password?: string }) => {
        updateUserCredentials(userId, credentials);
        setEditingHub(null);
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Forms for adding hubs */}
            <div className="grid grid-cols-1 gap-6">
                {/* Form for Main Hub */}
                <Card className="card-premium flex flex-col justify-between">
                    <div>
                        <h4 className="font-bold text-gray-800 text-lg mb-1">Add a Main Hub</h4>
                        <p className="text-sm text-gray-500 mb-4">Create a central hub. It will have administrative oversight and its own manager.</p>
                        <form onSubmit={handleAddMainHub} className="space-y-4">
                            <div>
                                <label htmlFor="mainHubName" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">New Main Hub Name</label>
                                <input 
                                    type="text" 
                                    id="mainHubName" 
                                    value={mainHubName} 
                                    onChange={e => setMainHubName(e.target.value)} 
                                    className="w-full"
                                    placeholder="e.g., Central Processing Hub"
                                />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 shadow-sm transition">
                                Create Main Hub
                            </button>
                        </form>
                    </div>
                </Card>

                {/* Form for Sub Hub */}
                <Card className="card-premium flex flex-col justify-between">
                    <div>
                        <h4 className="font-bold text-gray-800 text-lg mb-1">Add a Sub Hub</h4>
                        <p className="text-sm text-gray-500 mb-4">Create a collection point connected to an existing Main Hub.</p>
                        <form onSubmit={handleAddSubHub} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label htmlFor="subHubName" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sub Hub Name</label>
                                    <input 
                                        type="text" 
                                        id="subHubName" 
                                        value={subHubName} 
                                        onChange={e => setSubHubName(e.target.value)} 
                                        className="w-full" 
                                        placeholder="e.g., North Village Point"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="parentHub" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Assign to Main Hub</label>
                                    <select 
                                        id="parentHub" 
                                        value={parentHubId} 
                                        onChange={e => setParentHubId(e.target.value)} 
                                        className="w-full" 
                                        disabled={mainHubs.length === 0}
                                    >
                                        {mainHubs.map(hub => <option key={hub.id} value={hub.id}>{hub.name}</option>)}
                                    </select>
                                    {mainHubs.length === 0 && <p className="text-xs text-red-500 mt-1">Add a Main Hub first.</p>}
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-700 shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition" 
                                disabled={mainHubs.length === 0 || !subHubName.trim()}
                            >
                                Create Sub Hub
                            </button>
                        </form>
                    </div>
                </Card>
            </div>
            
            {/* Display current structure */}
            <Card className="card-premium">
                <h4 className="text-lg font-bold text-gray-800 mb-2">Registered Hub Directory</h4>
                <p className="text-sm text-gray-500 mb-6">Manage login credentials and view organization structures for each branch.</p>
                <div className="grid grid-cols-1 gap-4">
                    {mainHubs.map(hub => {
                        const subHubList = hubs.filter(h => h.parentId === hub.id);
                        return (
                            <div key={hub.id} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Main Hub</span>
                                            <h5 className="font-bold text-gray-800 text-base mt-1">{hub.name}</h5>
                                        </div>
                                        <button 
                                            onClick={() => setEditingHub(hub)} 
                                            className="text-xs bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold py-1.5 px-3 rounded-lg shadow-sm hover:shadow-md transition"
                                        >
                                            Edit Login
                                        </button>
                                    </div>
                                    
                                    <div className="mt-4 pt-3 border-t border-slate-100">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assigned Sub-Hubs ({subHubList.length})</p>
                                        {subHubList.length > 0 ? (
                                            <ul className="space-y-2">
                                                {subHubList.map(sub => (
                                                    <li key={sub.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100/80 shadow-2xs">
                                                        <span className="text-sm text-gray-700 font-medium">{sub.name}</span>
                                                        <button 
                                                            onClick={() => setEditingHub(sub)} 
                                                            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1 hover:bg-slate-50 rounded"
                                                        >
                                                            Edit Login
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-xs italic text-gray-400">No sub-hubs linked.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {mainHubs.length === 0 && (
                        <div className="col-span-full text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-gray-500">No hubs have been created yet. Add a Main Hub above to get started.</p>
                        </div>
                    )}
                </div>
            </Card>
            
            {editingHub && userForEditingHub && (
                <EditHubUserModal 
                    hub={editingHub}
                    user={userForEditingHub}
                    onClose={() => setEditingHub(null)}
                    onSave={handleSaveCredentials}
                />
            )}
        </div>
    );
}

interface AdminDashboardProps {
  activeSection?: 'reports' | 'management';
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeSection = 'reports' }) => {
  const { hubs, users, addHub, getRecordsForHub, updateUserCredentials } = useData();
  const [activeTab, setActiveTab] = useState<'reports' | 'management'>('reports');

  useEffect(() => {
    if (activeSection) {
      setActiveTab(activeSection);
    }
  }, [activeSection]);
  const [selectedHubId, setSelectedHubId] = useState<string>('');

  const today = new Date();
  const tenDaysAgo = new Date(today);
  tenDaysAgo.setDate(today.getDate() - 10);
  const [startDate, setStartDate] = useState(tenDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const mainHubs = useMemo(() => hubs.filter(h => !h.parentId), [hubs]);
  
  const selectedHubRecords = useMemo(() => {
    if (!selectedHubId) return [];
    return getRecordsForHub(selectedHubId, startDate, endDate);
  }, [selectedHubId, startDate, endDate, getRecordsForHub]);
  
  useEffect(() => {
    const firstHub = hubs.find(h => h.id !== 'hub-0');
    if(firstHub) {
        setSelectedHubId(firstHub.id);
    }
  }, [hubs]);

  return (
    <div className="space-y-6">
      {/* Premium Tab Navigation */}
      <div className="flex space-x-1.5 rounded-xl bg-slate-200/50 p-1 backdrop-blur-md max-w-md border border-slate-200/20 shadow-inner">
        <button
          onClick={() => setActiveTab('reports')}
          className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'reports'
              ? 'bg-white shadow text-indigo-700'
              : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
          }`}
        >
          Reports & Analytics
        </button>
        <button
          onClick={() => setActiveTab('management')}
          className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'management'
              ? 'bg-white shadow text-indigo-700'
              : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
          }`}
        >
          Hub & User Management
        </button>
      </div>

      {activeTab === 'reports' && (
        <div className="space-y-6 animate-fade-in">
          <Card className="card-premium">
            <h3 className="text-lg font-bold text-gray-800 mb-4">View Hub Reports</h3>
            <div className="grid grid-cols-1 gap-4 items-end">
                <div>
                    <label htmlFor="hub-select" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Select Hub</label>
                    <select
                        id="hub-select"
                        value={selectedHubId || ''}
                        onChange={(e) => setSelectedHubId(e.target.value)}
                        className="w-full"
                    >
                        <option value="">-- Select a Hub --</option>
                        {hubs.filter(h => h.id !== 'hub-0').map(hub => <option key={hub.id} value={hub.id}>{hub.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="start-date" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">From Date</label>
                    <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full" />
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">To Date</label>
                    <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full" />
                </div>
            </div>
          </Card>
          
          {selectedHubId ? (
              <ReportView records={selectedHubRecords} />
          ) : (
            <Card className="card-premium"><p className="text-center text-gray-500">Please select a hub to view reports.</p></Card>
          )}
        </div>
      )}

      {activeTab === 'management' && (
        <HubManagement hubs={hubs} users={users} mainHubs={mainHubs} addHub={addHub} updateUserCredentials={updateUserCredentials} />
      )}
    </div>
  );
};

export default AdminDashboard;