import React from 'react';

export const SettingsPanel: React.FC = () => {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
            <div>
                <h3 className="text-lg font-bold text-zinc-100">Clinical Alert Logic</h3>
                <p className="text-xs text-zinc-400 mt-1">
                    SweatSmart uses fixed clinical thresholds based on hyperhidrosis research to ensure consistent and reliable alerting.
                </p>
            </div>
            <div className="space-y-4 text-sm text-zinc-300">
                <p>
                    Alerts are triggered based on a weighted score of temperature, humidity, and UV exposure.
                    For example, temperatures above 28°C or high humidity (70%+) with heat will trigger a notification.
                </p>
            </div>
        </div>
    );
}
