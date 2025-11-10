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
                <h2 className="text-xl font-bold text-cyan-400">Sweat Smart Climate Alerts</h2>
                {onClose && (
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                )}
            </div>

            {/* The main content area is now completely empty as per user's request. */}
            <div className="space-y-4 overflow-y-auto h-[calc(100%-4rem)] pr-2">
            </div>
        </div>
    );
};

export default ClimateNotificationSidebar;