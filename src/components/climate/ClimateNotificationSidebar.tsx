import React from 'react';

interface ClimateNotificationSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const ClimateNotificationSidebar: React.FC<ClimateNotificationSidebarProps> = ({ isOpen, onClose }) => {
  return (
    <div
      className={`fixed top-48 right-0 h-[calc(100vh-theme(spacing.48))] w-80 bg-gray-800 text-white shadow-lg z-40 p-4 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Climate Alerts</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        )}
      </div>

      <div className="space-y-4 overflow-y-auto h-[calc(100%-4rem)] pr-2"> {/* Added overflow and height for content, and right padding for scrollbar */}
        {/* Placeholder for climate alert items */}
        <div className="bg-gray-700 p-3 rounded-md">
          <p className="text-sm font-medium">High Temperature Warning</p>
          <p className="text-xs text-gray-300">Expected temp: 35°C in Sector Gamma</p>
          <p className="text-xs text-blue-400 mt-1 cursor-pointer hover:underline">View Details</p>
        </div>

        <div className="bg-gray-700 p-3 rounded-md">
          <p className="text-sm font-medium">Humidity Anomaly Detected</p>
          <p className="text-xs text-gray-300">Unusual humidity levels in hydroponics.</p>
          <p className="text-xs text-blue-400 mt-1 cursor-pointer hover:underline">View Details</p>
        </div>

        <div className="bg-gray-700 p-3 rounded-md opacity-70">
          <p className="text-sm font-medium">Storm Alert (Inactive)</p>
          <p className="text-xs text-gray-300">Previous storm warning for Sector Delta.</p>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-md">
          <p className="text-sm font-medium">Air Quality Degradation</p>
          <p className="text-xs text-gray-300">VOC levels rising in Living Quarters 3.</p>
          <p className="text-xs text-blue-400 mt-1 cursor-pointer hover:underline">Investigate</p>
        </div>

        <div className="bg-gray-700 p-3 rounded-md">
          <p className="text-sm font-medium">Solar Flare Activity</p>
          <p className="text-xs text-gray-300">Increased solar radiation detected.</p>
          <p className="text-xs text-blue-400 mt-1 cursor-pointer hover:underline">Shield Status</p>
        </div>

        <p className="text-sm text-gray-400 mt-6 text-center">No new alerts.</p>
      </div>
    </div>
  );
};

export default ClimateNotificationSidebar;