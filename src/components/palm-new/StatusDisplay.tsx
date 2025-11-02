import React from 'react';
import { FusedAnalysis, PalmScanResult } from './types';
import { STATUS_DETAILS, CameraIcon } from './constants';

interface StatusDisplayProps {
    analysis: FusedAnalysis | null;
    eda: number | null;
    palmResult: PalmScanResult;
    onScan: () => void;
    isAnalyzing: boolean;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ analysis, eda, palmResult, onScan, isAnalyzing }) => {
    const status = analysis?.status;
    const details = status ? STATUS_DETAILS[status] : null;

    return (
        <div className="w-full max-w-4xl mx-auto mb-8 bg-slate-800/50 p-6 rounded-lg border border-slate-700 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-shrink-0">
                {details && status ? (
                    <div className={`relative w-24 h-24 rounded-full flex items-center justify-center ${details.color} ring-4 ${details.ringColor}`}>
                        <span className="text-white font-bold text-lg text-center leading-tight">{status}</span>
                    </div>
                ) : (
                    <div className="w-24 h-24 rounded-full flex items-center justify-center bg-slate-700 ring-4 ring-slate-600/30">
                        <span className="text-slate-400 text-sm">Awaiting</span>
                    </div>
                )}
            </div>
            <div className="flex-grow text-center sm:text-left">
                <h2 className="text-xl font-bold text-slate-200 mb-1">
                    {status ? `Status: ${status}` : 'Combined Analysis'}
                </h2>
                <p className="text-slate-400 mb-3">
                    {analysis?.explanation || 'Generate sensor data, then scan your palm for a comprehensive analysis.'}
                </p>
                <div className="flex gap-3 flex-wrap justify-center sm:justify-start text-sm">
                    {eda !== null && (
                      <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full">EDA: {eda.toFixed(2)} μS</span>
                    )}
                    {palmResult !== 'Not Scanned' && (
                      <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full">Palm: {palmResult}</span>
                    )}
                </div>
            </div>
            <button
                onClick={onScan}
                disabled={isAnalyzing || eda === null}
                className="flex-shrink-0 py-3 px-6 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <CameraIcon className="w-5 h-5"/>
                    Scan Palm
                  </>
                )}
            </button>
        </div>
    );
};

export default StatusDisplay;
