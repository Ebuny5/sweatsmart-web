interface EDAData {
  value: number;
  timestamp: string;
  source: 'palm-scanner' | 'climate-alert';
}

export const edaManager = {
  saveEDA: (value: number, source: 'palm-scanner' | 'climate-alert') => {
    const data: EDAData = {
      value,
      timestamp: new Date().toISOString(),
      source
    };
    localStorage.setItem('sharedEDA', JSON.stringify(data));
    console.log('EDA saved:', data);
  },
  
  getEDA: (): EDAData | null => {
    const stored = localStorage.getItem('sharedEDA');
    if (!stored) return null;
    
    try {
      return JSON.parse(stored) as EDAData;
    } catch {
      return null;
    }
  },
  
  isFresh: (): boolean => {
    const data = edaManager.getEDA();
    if (!data) return false;
    
    const age = Date.now() - new Date(data.timestamp).getTime();
    const FIVE_MINUTES = 5 * 60 * 1000;
    return age < FIVE_MINUTES;
  },
  
  clearEDA: () => {
    localStorage.removeItem('sharedEDA');
    console.log('EDA cleared');
  }
};
