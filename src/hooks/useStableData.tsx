
import { useCallback, useRef } from 'react';

export const useStableData = <T,>(data: T, isEqual?: (a: T, b: T) => boolean): T => {
  const stableRef = useRef<T>(data);
  
  const defaultIsEqual = useCallback((a: T, b: T): boolean => {
    return JSON.stringify(a) === JSON.stringify(b);
  }, []);
  
  const compare = isEqual || defaultIsEqual;
  
  if (!compare(stableRef.current, data)) {
    stableRef.current = data;
  }
  
  return stableRef.current;
};

export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const callbackRef = useRef<T>(callback);
  const depsRef = useRef(deps);
  
  if (!depsRef.current || !deps.every((dep, i) => dep === depsRef.current[i])) {
    callbackRef.current = callback;
    depsRef.current = deps;
  }
  
  return callbackRef.current;
};
