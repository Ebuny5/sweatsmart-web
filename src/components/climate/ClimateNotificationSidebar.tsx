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

            <div className="space-y-4 overflow-y-auto h-[calc(100%-4rem)] pr-2">
                {/*
                    As per user's request, the previous climate notification content has been removed.
                    This section is now a placeholder for the "repository" content.
                    It is styled to integrate with the existing sidebar design.
                */}
                <div className="bg-gray-800/50 border border-cyan-700/50 text-white p-4 rounded-xl flex flex-col space-y-4 shadow-lg">
                    <h3 className="text-xl font-bold text-cyan-300">Sweat Smart Data Repository</h3>
                    <p className="text-sm text-gray-400">
                        This area is designated for integrating and displaying your application's
                        data repository content. Below are placeholder elements.
                    </p>
                    <div className="bg-gray-900 p-3 rounded-lg flex items-center justify-between">
                        <span className="font-semibold text-gray-300">Data Source:</span>
                        <span className="text-sm text-white">External API</span>
                    </div>
                    <div className="bg-gray-900 p-3 rounded-lg flex items-center justify-between">
                        <span className="font-semibold text-gray-300">Status:</span>
                        <span className="text-sm text-green-400">Connected</span>
                    </div>
                    <button className="bg-cyan-600 text-white text-sm font-bold px-4 py-2 rounded-md hover:bg-cyan-500 transition">
                        Synchronize Data
                    </button>
                    <p className="text-xs text-gray-500 italic">
                        Your specific repository component will be placed here to maintain design consistency and functionality.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ClimateNotificationSidebar;