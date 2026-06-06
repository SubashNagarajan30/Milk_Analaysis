import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import type { User, Hub, DailyRecord, Collection, TankerRetest } from '../types';

interface DataContextType {
  users: User[];
  hubs: Hub[];
  dailyRecords: DailyRecord[];
  tankers: TankerRetest[];
  loading: boolean;
  isOffline: boolean;
  error: string | null;
  getHubById: (id: string) => Hub | undefined;
  getSubHubs: (parentId: string) => Hub[];
  getRecordsForHub: (hubId: string, startDate: string, endDate: string) => DailyRecord[];
  addDailyRecord: (recordData: Omit<DailyRecord, 'id'>) => void;
  addHub: (name: string, parentId?: string | null) => void;
  updateUserCredentials: (userId: string, credentials: { username?: string; password?: string }) => void;
  addRetestRecord: (recordId: string, session: 'morning' | 'evening', retestData: Collection) => void;
  addTankerRetest: (tankerData: Omit<TankerRetest, 'id'>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [tankers, setTankers] = useState<TankerRetest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFromLocalStorage = () => {
    let localUsers = localStorage.getItem('milkhub_users');
    let localHubs = localStorage.getItem('milkhub_hubs');
    let localRecords = localStorage.getItem('milkhub_records');
    let localTankers = localStorage.getItem('milkhub_tankers');

    if (!localUsers || !localHubs || !localRecords) {
      const defaultUsers = [
        { id: 'user-1', name: 'Admin User', username: 'admin', password: 'password', role: 'Admin', hubId: 'hub-0' },
        { id: 'user-2', name: 'Central Dairy Incharge', username: 'central.incharge', password: 'password', role: 'Hub Incharge', hubId: 'hub-1' },
        { id: 'user-3', name: 'North Village Incharge', username: 'north.incharge', password: 'password', role: 'Hub Incharge', hubId: 'hub-2' },
        { id: 'user-4', name: 'South Village Incharge', username: 'south.incharge', password: 'password', role: 'Hub Incharge', hubId: 'hub-3' },
        { id: 'user-5', name: 'Metro Dairy Incharge', username: 'metro.incharge', password: 'password', role: 'Hub Incharge', hubId: 'hub-4' },
        { id: 'user-6', name: 'East Town Incharge', username: 'east.incharge', password: 'password', role: 'Hub Incharge', hubId: 'hub-5' },
      ];
      const defaultHubs = [
        { id: 'hub-0', name: 'Corporate HQ', parentId: null },
        { id: 'hub-1', name: 'Central Dairy', parentId: null },
        { id: 'hub-2', name: 'North Village Collection', parentId: 'hub-1' },
        { id: 'hub-3', name: 'South Village Collection', parentId: 'hub-1' },
        { id: 'hub-4', name: 'Metro Dairy', parentId: null },
        { id: 'hub-5', name: 'East Town Collection', parentId: 'hub-4' },
      ];

      const generatedRecords: any[] = [];
      const hubsToGenerateFor = ['hub-1', 'hub-2', 'hub-3', 'hub-4', 'hub-5'];
      const today = new Date();
      
      for (let i = 0; i < 15; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        for (const hubId of hubsToGenerateFor) {
          generatedRecords.push({
            id: `record-${hubId}-${dateString}`,
            hubId,
            date: dateString,
            morning: {
              quantity: Math.round((500 + Math.random() * 200) * 10) / 10,
              fat: Math.round((3.5 + Math.random() * 0.5) * 10) / 10,
              snf: Math.round((8.5 + Math.random() * 0.3) * 10) / 10,
            },
            evening: {
              quantity: Math.round((450 + Math.random() * 150) * 10) / 10,
              fat: Math.round((3.8 + Math.random() * 0.4) * 10) / 10,
              snf: Math.round((8.6 + Math.random() * 0.2) * 10) / 10,
            },
          });
        }
      }

      localStorage.setItem('milkhub_users', JSON.stringify(defaultUsers));
      localStorage.setItem('milkhub_hubs', JSON.stringify(defaultHubs));
      localStorage.setItem('milkhub_records', JSON.stringify(generatedRecords));
      localStorage.setItem('milkhub_tankers', JSON.stringify([]));

      setUsers(defaultUsers as any);
      setHubs(defaultHubs);
      setDailyRecords(generatedRecords);
      setTankers([]);
    } else {
      setUsers(JSON.parse(localUsers));
      setHubs(JSON.parse(localHubs));
      setDailyRecords(JSON.parse(localRecords));
      setTankers(localTankers ? JSON.parse(localTankers) : []);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, hubsRes, recordsRes, tankersRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/hubs'),
        fetch('/api/records'),
        fetch('/api/tankers')
      ]);

      if (!usersRes.ok || !hubsRes.ok || !recordsRes.ok || !tankersRes.ok) {
        throw new Error('Failed to load data from server');
      }

      const [usersData, hubsData, recordsData, tankersData] = await Promise.all([
        usersRes.json(),
        hubsRes.json(),
        recordsRes.json(),
        tankersRes.json()
      ]);

      setUsers(usersData);
      setHubs(hubsData);
      setDailyRecords(recordsData);
      setTankers(tankersData);
      setIsOffline(false);
      setError(null);
    } catch (err: any) {
      console.warn('Backend server unreachable. Falling back to browser LocalStorage.', err);
      setIsOffline(true);
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getHubById = useCallback((id: string) => hubs.find(h => h.id === id), [hubs]);
  const getSubHubs = useCallback((parentId: string) => hubs.filter(h => h.parentId === parentId), [hubs]);
  
  const getRecordsForHub = useCallback((hubId: string, startDate: string, endDate: string) => {
    return dailyRecords
      .filter(r => r.hubId === hubId && r.date >= startDate && r.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyRecords]);
  
  const addDailyRecord = async (recordData: Omit<DailyRecord, 'id'>) => {
    const id = `record-${recordData.hubId}-${recordData.date}`;
    const newRecord: DailyRecord = { ...recordData, id };

    if (isOffline) {
      const updatedRecords = dailyRecords.filter(r => !(r.hubId === recordData.hubId && r.date === recordData.date));
      const result = [...updatedRecords, newRecord];
      setDailyRecords(result);
      localStorage.setItem('milkhub_records', JSON.stringify(result));
      return;
    }

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      });
      if (!res.ok) throw new Error('Failed to add daily record');
      const savedRecord: DailyRecord = await res.json();

      setDailyRecords(prev => {
        const otherRecords = prev.filter(r => !(r.hubId === savedRecord.hubId && r.date === savedRecord.date));
        return [...otherRecords, savedRecord];
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to add daily record');
    }
  };
  
  const addHub = async (name: string, parentId: string | null = null) => {
    if (isOffline) {
      const hubId = `hub-${Date.now()}`;
      const newHub = { id: hubId, name, parentId: parentId || null };
      const userId = `user-${Date.now()}`;
      const newUser = {
        id: userId,
        name: `${name} Incharge`,
        username: `${name.toLowerCase().replace(/\s+/g, ".")}.incharge`,
        password: "password",
        role: "Hub Incharge" as any,
        hubId: hubId
      };
      const updatedHubs = [...hubs, newHub];
      const updatedUsers = [...users, newUser];
      setHubs(updatedHubs);
      setUsers(updatedUsers);
      localStorage.setItem('milkhub_hubs', JSON.stringify(updatedHubs));
      localStorage.setItem('milkhub_users', JSON.stringify(updatedUsers));
      return;
    }

    try {
      const res = await fetch('/api/hubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId })
      });
      if (!res.ok) throw new Error('Failed to add hub');
      const data = await res.json(); // contains { hub, user }

      setHubs(prev => [...prev, data.hub]);
      setUsers(prev => [...prev, data.user]);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to add hub');
    }
  };

  const updateUserCredentials = async (userId: string, credentials: { username?: string; password?: string }) => {
    if (isOffline) {
      const updatedUsers = users.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            username: credentials.username || user.username,
            password: credentials.password || user.password
          };
        }
        return user;
      });
      setUsers(updatedUsers);
      localStorage.setItem('milkhub_users', JSON.stringify(updatedUsers));
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}/credentials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      if (!res.ok) throw new Error('Failed to update credentials');
      const updatedUser: User = await res.json();

      setUsers(prev => prev.map(user => (user.id === userId ? updatedUser : user)));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update credentials');
    }
  };

  const addRetestRecord = async (recordId: string, session: 'morning' | 'evening', retestData: Collection) => {
    if (isOffline) {
      const updatedRecords = dailyRecords.map(record => {
        if (record.id === recordId) {
          const update: any = {};
          if (session === 'morning') {
            update.morningReTest = retestData;
          } else {
            update.eveningReTest = retestData;
          }
          return { ...record, ...update };
        }
        return record;
      });
      setDailyRecords(updatedRecords);
      localStorage.setItem('milkhub_records', JSON.stringify(updatedRecords));
      return;
    }

    try {
      const res = await fetch(`/api/records/${recordId}/retest`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, retestData })
      });
      if (!res.ok) throw new Error('Failed to save retest data');
      const updatedRecord: DailyRecord = await res.json();

      setDailyRecords(prev => prev.map(record => (record.id === recordId ? updatedRecord : record)));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to save retest data');
    }
  };

  const addTankerRetest = async (tankerData: Omit<TankerRetest, 'id'>) => {
    const id = `tanker-${tankerData.hubId}-${tankerData.date}`;

    if (isOffline) {
      const newTanker: TankerRetest = { ...tankerData, id };
      const updatedTankers = tankers.filter(t => t.id !== id);
      const result = [...updatedTankers, newTanker];
      setTankers(result);
      localStorage.setItem('milkhub_tankers', JSON.stringify(result));
      return;
    }

    try {
      const res = await fetch('/api/tankers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tankerData)
      });
      if (!res.ok) throw new Error('Failed to save tanker retest');
      const savedTanker: TankerRetest = await res.json();

      setTankers(prev => {
        const otherTankers = prev.filter(t => t.id !== savedTanker.id);
        return [...otherTankers, savedTanker];
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to save tanker retest');
    }
  };

  return (
    <DataContext.Provider value={{ 
      users, 
      hubs, 
      dailyRecords, 
      tankers,
      loading, 
      isOffline,
      error, 
      getHubById, 
      getSubHubs, 
      getRecordsForHub, 
      addDailyRecord, 
      addHub, 
      updateUserCredentials, 
      addRetestRecord,
      addTankerRetest
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};