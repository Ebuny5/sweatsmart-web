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
                Sweat Smart needs your permission for location and notifications to provide personalized, real-time alerts.
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
                    {locationStatus === 'denied' && <span className="text-sm font-bold text-red-400">Blocked</span>}
                </div>
            </div>

            {isBlocked && (
                <div className="w-full text-center bg-red-900/50 border border-red-700 p-3 rounded-lg mt-2">
                    <p className="text-sm text-red-200">
                        One or more permissions are blocked. Please update them in your browser's site settings for this page.
                    </p>
                    <button onClick={onCheckPermissions} className="mt-3 flex items-center justify-center mx-auto gap-2 bg-gray-200 text-black font-bold px-4 py-2 rounded-md hover:bg-white transition text-sm">
                       <RefreshIcon className="w-4 h-4" /> Check Permissions
                    </button>
                </div>
            )}
        </div>
    );
};

export default PermissionsWizard;