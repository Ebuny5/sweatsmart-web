import React from 'react';
import { AnalysisResult } from './types';
import { AlertIcon, DropletIcon, PulseIcon, StethoscopeIcon, InfoIcon, SparklesIcon } from './icons';

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
  imagePreview: string | null;
}

const getSeverityClass = (assessment: string) => {
  switch (assessment.toLowerCase()) {
    case 'very severe': return 'bg-red-600 text-white';
    case 'severe': return 'bg-red-500 text-white';
    case 'moderate': return 'bg-yellow-500 text-white';
    case 'mild': return 'bg-green-500 text-white';
    default: return 'bg-gray-200 text-gray-800';
  }
};

const getActivityClass = (assessment: string) => {
  switch (assessment.toLowerCase()) {
    case 'highly active': return 'bg-blue-200 text-blue-800';
    case 'active': return 'bg-gray-200 text-gray-800';
    default: return 'bg-gray-200 text-gray-800';
  }
};

const ProgressBar: React.FC<{ value: number, max: number }> = ({ value, max }) => {
  const percentage = (value / max) * 100;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

const Tag: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${className}`}>
        {children}
    </span>
);

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result, onReset, imagePreview }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
        <div className="p-6">
            <div className="flex justify-between items-start mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI Analysis Results</h1>
                <Tag className="bg-gray-100 text-gray-800">{result.confidence}% Confidence</Tag>
            </div>

            {imagePreview && (
              <div className="mb-6 rounded-lg overflow-hidden border">
                <img src={imagePreview} alt="Analyzed" className="w-full h-auto object-cover max-h-64" />
              </div>
            )}

            {/* AI Analysis Note */}
            {result.analysisNotes && (
              <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start">
                  <InfoIcon className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">AI Analysis Note</h3>
                    <p className="text-gray-600 text-sm mb-3">{result.analysisNotes}</p>
                  </div>
                </div>
                {result.moistureSource && (
                   <div className="pt-3 border-t border-gray-200 flex items-center">
                        <SparklesIcon className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                        <h3 className="font-semibold text-gray-700 text-sm mr-2">Suspected Moisture Source:</h3>
                        <Tag className="bg-blue-100 text-blue-800">{result.moistureSource}</Tag>
                    </div>
                )}
              </div>
            )}

            {/* Severity Assessment */}
            <div className="mb-8">
                <div className="flex items-center mb-3">
                    <AlertIcon className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-lg font-semibold text-gray-700">Severity Assessment</h2>
                </div>
                <div className="flex justify-between items-center mb-2 text-gray-800">
                    <span className="font-medium">Level {result.severity.level}/10</span>
                    <Tag className={getSeverityClass(result.severity.assessment)}>{result.severity.assessment}</Tag>
                </div>
                <ProgressBar value={result.severity.level} max={10} />
            </div>

            {/* Sweat Gland Activity */}
            <div className="mb-8">
                <div className="flex items-center mb-3">
                    <PulseIcon className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-lg font-semibold text-gray-700">Sweat Gland Activity</h2>
                </div>
                 <div className="flex justify-between items-center mb-2 text-gray-800">
                    <span className="font-medium">{result.sweatGlandActivity.level}% Active</span>
                    <Tag className={getActivityClass(result.sweatGlandActivity.assessment)}>{result.sweatGlandActivity.assessment}</Tag>
                </div>
                <ProgressBar value={result.sweatGlandActivity.level} max={100} />
            </div>

            {/* Detected Triggers */}
            <div className="mb-8">
                <div className="flex items-center mb-3">
                    <DropletIcon className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-lg font-semibold text-gray-700">Detected Triggers</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                    {result.detectedTriggers.map(trigger => (
                        <Tag key={trigger} className="bg-gray-100 text-gray-800">{trigger}</Tag>
                    ))}
                </div>
            </div>

            {/* Treatment Recommendations */}
            <div className="mb-6">
                 <div className="flex items-center mb-4">
                    <StethoscopeIcon className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-lg font-semibold text-gray-700">Treatment Recommendations</h2>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-bold text-blue-800">Primary Treatment</h3>
                    <p className="text-gray-700">{result.treatmentRecommendations.primary}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-600 mb-2">Alternative Options:</h3>
                    <div className="flex flex-wrap gap-2">
                        {result.treatmentRecommendations.alternative.map(option => (
                           <Tag key={option} className="bg-gray-100 text-gray-800">{option}</Tag>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-r-lg" role="alert">
                <p className="text-sm">This analysis works for palms, hands, feet, and soles. Results are for informational purposes only. Consult with a healthcare professional for a medical diagnosis.</p>
            </div>
        </div>
        <div className="bg-gray-50 p-4 text-center">
             <button
                onClick={onReset}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition"
             >
                Analyze Another Image
            </button>
        </div>
    </div>
  );
};

export default AnalysisResults;
