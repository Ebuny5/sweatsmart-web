import React from 'react';
import { MapPinIcon, BellIcon, RefreshIcon } from '../icons';

type PermissionStatus = 'prompt' | 'granted' | 'denied';

const PermissionsWizard: React.FC<{
  locationStatus: PermissionStatus;
  notificationStatus: PermissionStatus;
  onRequestLocation: () => void;
  onRequestNotification: () => void;
  onCheckPermissions: () => void;
}> = ({ locationStatus, notificationStatus, onRequestLocation, onRequestNotification, onCheckPermissions }) => {
    const isBlocked = locationStatus === 'denied' || notificationStatus === 'denied';
    
    return (
        <div className="bg-gray-800 border border-cyan-700/50 text-white p-4 rounded-xl flex flex-col items-center text-center space-y-4 shadow-lg">
            <h3 className="text-xl font-bold text-cyan-300">Setup Required</h3>
            <p className="text-sm text-gray-400 max-w-sm">
                <strong>Click the buttons below</strong> to enable location and notifications. This allows climate alerts based on your local weather.
            </p>
            
            <div className="w-full space-y-3 pt-2">
                {/* Location Permission */}
                <div className="flex items-center justify-between bg-gray-900/70 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <MapPinIcon className={`w-6 h-6 ${locationStatus === 'granted' ? 'text-green-400' : 'text-blue-400'}`} />
                        <span className="font-semibold">Local Weather</span>
                    </div>
                    {locationStatus === 'granted' && <span className="text-sm font-bold text-green-400">Enabled</span>}
                    {locationStatus === 'prompt' && (
                        <button onClick={onRequestLocation} className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-md hover:bg-blue-400 transition">
                            Enable Location
                        </button>
                    )}
                    {locationStatus === 'denied' && <span className="text-sm font-bold text-red-400">Blocked</span>}
                </div>

                {/* Notification Permission */}
                <div className="flex items-center justify-between bg-gray-900/70 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <BellIcon className={`w-6 h-6 ${notificationStatus === 'granted' ? 'text-green-400' : 'text-yellow-400'}`} />
                        <span className="font-semibold">Climate Alerts</span>
                    </div>
                    {notificationStatus === 'granted' && <span className="text-sm font-bold text-green-400">Enabled</span>}
                    {notificationStatus === 'prompt' && (
                        <button onClick={onRequestNotification} className="bg-yellow-500 text-black text-sm font-bold px-3 py-1 rounded-md hover:bg-yellow-400 transition disabled:bg-gray-600" disabled={locationStatus !== 'granted'}>
                            Enable Notifications
                        </button>
                    )}
                    {notificationStatus === 'denied' && <span className="text-sm font-bold text-red-400">Blocked</span>}
                </div>
            </div>

            {isBlocked && (
                <div className="w-full text-center bg-red-900/50 border border-red-700 p-3 rounded-lg mt-2">
                    <p className="text-sm text-red-200 mb-2">
                        <strong>Permissions blocked!</strong> To fix:
                    </p>
                    <ol className="text-xs text-left text-red-200 space-y-1 mb-3 max-w-md mx-auto">
                        <li>1. Click the 🔒 lock icon in your browser's address bar</li>
                        <li>2. Find "Location" and "Notifications"</li>
                        <li>3. Change both to "Allow"</li>
                        <li>4. Click the button below to refresh</li>
                    </ol>
                    <button onClick={onCheckPermissions} className="flex items-center justify-center mx-auto gap-2 bg-cyan-500 text-white font-bold px-4 py-2 rounded-md hover:bg-cyan-400 transition text-sm">
                       <RefreshIcon className="w-4 h-4" /> Refresh Permissions
                    </button>
                </div>
            )}
        </div>
    );
};

export default PermissionsWizard;