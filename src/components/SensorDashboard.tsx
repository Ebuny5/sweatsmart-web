import React from 'react';
import { HeartIcon, PulseIcon } from './icons';

type SensorStatus = 'disconnected' | 'connecting' | 'connected';
export type SimulationScenario = 'Resting' | 'Exercise' | 'Normal';

interface SensorCardProps {
  icon: React.ReactNode;
  name: string;
  status: SensorStatus;
  dataDisplay: string;
}

const getStatusClasses = (status: SensorStatus) => {
  switch (status) {
    case 'connected':
      return {
        dot: 'bg-green-500',
        text: 'text-green-700',
        label: 'Connected',
      };
    case 'connecting':
      return {
        dot: 'bg-yellow-500 animate-pulse',
        text: 'text-yellow-700',
        label: 'Connecting...',
      };
    case 'disconnected':
    default:
      return {
        dot: 'bg-red-500',
        text: 'text-red-700',
        label: 'Disconnected',
      };
  }
};

const SensorCard: React.FC<SensorCardProps> = ({ icon, name, status, dataDisplay }) => {
  const { dot, text, label } = getStatusClasses(status);

  return (
    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between gap-4 border flex-1">
      <div className="flex items-center">
        <div className="text-blue-600 mr-4">{icon}</div>
        <div>
          <h3 className="font-bold text-gray-800">{name}</h3>
          <div className="flex items-center mt-1">
            <span className={`h-2.5 w-2.5 rounded-full mr-2 ${dot}`}></span>
            <span className={`text-sm font-medium ${text}`}>{label}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-mono text-gray-700">{dataDisplay}</p>
      </div>
    </div>
  );
};


interface SensorDashboardProps {
  hrStatus: SensorStatus;
  gsrStatus: SensorStatus;
  hrData: number | null;
  gsrData: number | null;
  onConnect: () => void;
  simulationScenario: SimulationScenario;
  setSimulationScenario: (scenario: SimulationScenario) => void;
}

const SensorDashboard: React.FC<SensorDashboardProps> = ({
  hrStatus,
  gsrStatus,
  hrData,
  gsrData,
  onConnect,
  simulationScenario,
  setSimulationScenario
}) => {
    const isConnected = hrStatus === 'connected';
    const isConnecting = hrStatus === 'connecting';

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-8 border border-gray-200">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Device Simulation Control</h2>
        <p className="text-gray-600 mb-6">Choose a scenario to simulate sensor data for the AI analysis.</p>
      </div>
      
      {/* Simulation Scenario Selector */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold text-center text-gray-700 mb-3">Select Simulation Scenario</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(['Resting', 'Exercise', 'Normal'] as SimulationScenario[]).map((scenario) => (
            <label key={scenario} className={`p-2 text-center rounded-md cursor-pointer text-sm font-semibold transition-colors ${simulationScenario === scenario ? 'bg-blue-600 text-white shadow' : 'bg-white hover:bg-gray-200'}`}>
              <input 
                type="radio" 
                name="scenario" 
                value={scenario}
                checked={simulationScenario === scenario}
                onChange={() => setSimulationScenario(scenario)}
                className="sr-only"
                disabled={isConnected || isConnecting}
              />
              {scenario === 'Resting' ? 'Resting (Hyperhidrosis)' : scenario}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SensorCard 
          icon={<HeartIcon className="h-8 w-8" />}
          name="Heart Rate"
          status={hrStatus}
          dataDisplay={hrData ? `${hrData} bpm` : '-- bpm'}
        />
        <SensorCard 
          icon={<PulseIcon className="h-8 w-8" />}
          name="GSR"
          status={gsrStatus}
          dataDisplay={gsrData ? `${gsrData.toFixed(2)} µS` : '-- µS'}
        />
      </div>
      
       <div className="text-center">
         <button
            onClick={onConnect}
            disabled={isConnecting}
            className={`w-full sm:w-auto px-8 py-3 text-base font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-wait
              ${isConnected 
                ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' 
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'}`}
          >
            {isConnecting ? 'Connecting...' : (isConnected ? 'Disconnect Sensors' : 'Connect Sensors')}
        </button>
      </div>

    </div>
  );
};

export default SensorDashboard;