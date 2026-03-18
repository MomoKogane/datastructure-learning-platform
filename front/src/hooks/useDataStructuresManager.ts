// Custom hook for managing data structures across the application
import { useEffect, useMemo } from 'react';
import { dataStructures } from '../data/structures';
import { useDataStructures, useOnlineStatus } from './useApi';
import { useLearningStore } from '../store/learningStore';
import { isLocalContentFallbackEnabled } from '../config/contentSource';

export const useDataStructuresManager = () => {
  const isOnline = useOnlineStatus();
  const { data: apiData, loading, error, refetch } = useDataStructures();
  const fallbackEnabled = isLocalContentFallbackEnabled();
  
  const {
    useApiData,
    // dataStructures: storeStructures,
    setUseApiData,
    setDataStructures
  } = useLearningStore();

  // Determine which data to use
  const structures = useMemo(
    () => (useApiData && apiData ? apiData : (fallbackEnabled ? dataStructures : [])),
    [useApiData, apiData, fallbackEnabled]
  );

  useEffect(() => {
    // Update store with current structures
    setDataStructures(structures);
  }, [structures, setDataStructures]);

  useEffect(() => {
    // Automatically switch to API mode when online and API data is available
    if (isOnline && apiData && !error) {
      setUseApiData(true);
    }
  }, [isOnline, apiData, error, setUseApiData]);

  return {
    structures,
    loading,
    error,
    refetch,
    useApiData,
    setUseApiData,
    isOnline
  };
};
