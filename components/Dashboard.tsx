
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import AdminDashboard from './dashboards/AdminDashboard';
import MainHubDashboard from './dashboards/MainHubDashboard';
import SubHubDashboard from './dashboards/SubHubDashboard';
import { Role } from '../types';

interface ProfileScreenProps {
  user: any;
  hub: any;
  isOffline: boolean;
  onLogout: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, hub, isOffline, onLogout }) => {
  return (
    <div className="space-y-6 animate-fade-in p-1">
      {/* Profile Avatar Card */}
      <div className="flex flex-col items-center text-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-3xl font-extrabold shadow-md mb-4 uppercase tracking-wider">
          {user.name.split(' ').map((n: string) => n[0]).join('')}
        </div>
        <h3 className="text-lg font-bold text-slate-800">{user.name}</h3>
        <p className="text-xs text-slate-400 font-medium">@{user.username}</p>
        <span className="mt-3 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
          {user.role}
        </span>
      </div>

      {/* Info Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Workspace Details</h4>
        
        <div className="flex justify-between items-center py-2 border-b border-slate-50 text-xs">
          <span className="text-slate-500 font-medium">Assigned Hub</span>
          <span className="font-semibold text-slate-800">{hub?.name || 'Corporate HQ'}</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-slate-50 text-xs">
          <span className="text-slate-500 font-medium">Connection Mode</span>
          {isOffline ? (
            <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 text-[10px] font-bold rounded-full border border-amber-500/20">
              Offline Storage
            </span>
          ) : (
            <span className="px-2.5 py-0.5 bg-green-500/10 text-green-600 text-[10px] font-bold rounded-full border border-green-500/20">
              Live Cloud DB
            </span>
          )}
        </div>

        <div className="flex justify-between items-center py-2 text-xs">
          <span className="text-slate-500 font-medium">App Version</span>
          <span className="font-semibold text-slate-400 font-mono">v1.2.0-mobile</span>
        </div>
      </div>

      {/* Logout Action */}
      <button
        onClick={onLogout}
        className="w-full bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-600 py-3.5 px-4 rounded-2xl font-bold transition duration-200 text-xs shadow-2xs flex items-center justify-center gap-2"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sign Out of Account
      </button>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { getHubById, loading, isOffline } = useData();
  const [activeTab, setActiveTab] = React.useState<'analytics' | 'action' | 'profile'>('analytics');
  const [dashboardView, setDashboardView] = React.useState<'view_report' | 'add_report'>('view_report');

  // Automatically sync sub-dashboard views with bottom nav tab toggles
  React.useEffect(() => {
    if (activeTab === 'analytics') {
      setDashboardView('view_report');
    } else if (activeTab === 'action') {
      setDashboardView('add_report');
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (dashboardView === 'view_report' && activeTab === 'action') {
      setActiveTab('analytics');
    }
  }, [dashboardView]);

  if (!currentUser) return null;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-transparent font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-3 text-xs text-gray-500 font-semibold">Loading data...</p>
        </div>
      </div>
    );
  }

  const userHub = getHubById(currentUser.hubId);

  const renderDashboard = () => {
    switch (currentUser.role) {
      case Role.ADMIN:
        return <AdminDashboard activeSection={activeTab === 'action' ? 'management' : 'reports'} />;
      case Role.HUB_INCHARGE:
        // A hub is a "main hub" if it does not have a parent.
        if (userHub && !userHub.parentId) {
          return <MainHubDashboard user={currentUser} view={dashboardView} setView={setDashboardView} />;
        }
        // Otherwise, it's a sub-hub.
        return <SubHubDashboard user={currentUser} view={dashboardView} setView={setDashboardView} />;
      default:
        return <div className="text-xs text-center text-red-500 p-4">Invalid user role.</div>;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-transparent font-sans">
      
      {/* Mobile Top Navbar */}
      <header className="flex items-center justify-between px-6 pt-4 pb-3 bg-white border-b border-slate-100 shadow-xs select-none shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{userHub?.name || 'Corporate HQ'}</span>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mt-1">
            {activeTab === 'analytics' && 'Analytics'}
            {activeTab === 'action' && (currentUser.role === Role.ADMIN ? 'Hub Management' : 'Log Record')}
            {activeTab === 'profile' && 'My Profile'}
          </h1>
        </div>
        {isOffline && (
          <span className="bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full text-[9px] font-bold border border-amber-500/20">
            Offline
          </span>
        )}
      </header>

      {/* Main Content Pane */}
      <main className="flex-1 p-4 overflow-y-auto bg-transparent pb-8">
        {activeTab === 'profile' ? (
          <ProfileScreen user={currentUser} hub={userHub} isOffline={isOffline} onLogout={logout} />
        ) : (
          renderDashboard()
        )}
      </main>

      {/* Bottom Navigation Tab Bar */}
      <nav className="bottom-nav-bar shrink-0">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`bottom-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
          Home
        </button>

        <button
          onClick={() => setActiveTab('action')}
          className={`bottom-nav-btn bottom-nav-btn-action ${activeTab === 'action' ? 'active' : ''}`}
        >
          <div className="bottom-nav-btn-action-inner">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              {currentUser.role === Role.ADMIN ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              )}
            </svg>
          </div>
          <span className="mt-5">{currentUser.role === Role.ADMIN ? 'Manage' : 'Log'}</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`bottom-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile
        </button>
      </nav>
    </div>
  );
};

export default Dashboard;