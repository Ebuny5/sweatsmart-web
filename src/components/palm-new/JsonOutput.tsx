import React, { useState, useEffect } from 'react';
import { SensorReading } from './types';
import { CopyIcon, CheckIcon } from './constants';

interface JsonOutputProps {
  data: SensorReading | null;
}

const JsonOutput: React.FC<JsonOutputProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const jsonString = data ? JSON.stringify(data, null, 2) : '{\n  "status": "Awaiting simulation..."\n}';

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = () => {
    if (data) {
      navigator.clipboard.writeText(jsonString);
      setCopied(true);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative bg-slate-950 rounded-lg border border-slate-700 font-mono text-sm">
      <div className="absolute top-2 right-2">
        <button
          onClick={handleCopy}
          disabled={!data}
          className="p-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label="Copy JSON"
        >
          {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
        </button>
      </div>
      <pre className="p-4 pt-10 text-slate-300 overflow-x-auto">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
};

export default JsonOutput;
