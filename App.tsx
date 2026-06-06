
import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginSelector from './components/LoginSelector';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const { currentUser } = useAuth();
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    };
    updateTime();
    // Update every minute
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="phone-container select-none">
      <div className="phone-device">
        {/* Dynamic Island Notch */}
        <div className="phone-island">
          <div className="phone-island-camera"></div>
        </div>

        {/* Status Bar */}
        <div className={`phone-status-bar ${currentUser ? 'dark-text' : 'light-text'}`}>
          <div className="font-bold text-[11px]">{time || '09:41'}</div>
          <div className="phone-status-bar-icons">
            {/* Cellular Signal Icon */}
            <svg className="w-3.5 h-3.5 fill-current opacity-85" viewBox="0 0 24 24">
              <path d="M2 22h20V2L2 22z" />
            </svg>
            {/* Wifi Icon */}
            <svg className="w-3.5 h-3.5 opacity-85" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M5.282 13.57a9 9 0 0112.728 0M1.62 9.907a14 14 0 0119.76 0M12 19.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
            </svg>
            {/* Battery Icon */}
            <div className="flex items-center">
              <div className="w-[18px] h-[9px] border-[1.5px] border-current rounded-[3px] p-[1px] flex items-center relative opacity-85">
                <div className="bg-current h-full w-[80%] rounded-[0.5px]"></div>
                <div className="bg-current w-[1.5px] h-[3.5px] absolute -right-[3px] rounded-r-[0.5px]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Application Screen viewport */}
        <div className="phone-screen">
          {currentUser ? <Dashboard /> : <LoginSelector />}
        </div>

        {/* Screen Home Indicator Bar at the bottom */}
        <div className={`phone-home-indicator ${currentUser ? '' : 'light'}`}></div>
      </div>
    </div>
  );
};

export default App;
