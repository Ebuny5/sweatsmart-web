import React, { useEffect, useState } from 'react';

export const NotificationPermissionModal = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.ready;
        }
      }
    } catch (e) {
      console.error('Notification permission error:', e);
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">

        <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔔</span>
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-2">
          Stay Protected
        </h2>

        <p className="text-gray-400 text-center text-sm mb-2 leading-relaxed">
          SweatSmart sends you two types of alerts:
        </p>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-3 bg-gray-800/60 rounded-xl p-3">
            <span className="text-xl">🌡️</span>
            <div>
              <p className="text-white text-sm font-semibold">Climate Alerts</p>
              <p className="text-gray-500 text-xs">Real-time warnings when heat or humidity is dangerous</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-800/60 rounded-xl p-3">
            <span className="text-xl">📋</span>
            <div>
              <p className="text-white text-sm font-semibold">Episode Reminders</p>
              <p className="text-gray-500 text-xs">Scheduled reminders to log your sweat episodes</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleEnable}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-bold rounded-xl transition-all duration-200 text-sm"
          >
            Enable Alerts
          </button>
          <button
            onClick={() => setShow(false)}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 font-medium rounded-xl transition text-sm"
          >
            Maybe Later
          </button>
        </div>

        <p className="text-xs text-gray-600 text-center mt-4">
          You can change this anytime in your browser settings
        </p>
      </div>
    </div>
  );
};

export default NotificationPermissionModal;
