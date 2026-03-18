// Custom hooks for API data fetching
import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { DataStructure } from '../types';

interface UseDataStructuresOptions {
  category?: string;
  difficulty?: string;
}

interface APIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Hook for fetching all data structures
export const useDataStructures = (options: UseDataStructuresOptions = {}) => {
  const { category, difficulty } = options;
  const [state, setState] = useState<APIState<DataStructure[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const response = await apiService.getDataStructures({ category, difficulty });
        
        if (isMounted) {
          if (response.success && response.data) {
            setState({
              data: response.data,
              loading: false,
              error: null,
            });
          } else {
            setState({
              data: null,
              loading: false,
              error: response.error || 'Failed to fetch data structures',
            });
          }
        }
      } catch (error) {
        if (isMounted) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : 'An error occurred',
          });
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [category, difficulty]);

  const refetch = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await apiService.getDataStructures({ category, difficulty });
      
      if (response.success && response.data) {
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch data structures',
        });
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  return { ...state, refetch };
};

// Hook for fetching course catalog
export const useCourseCatalog = () => {
  const [state, setState] = useState<APIState<unknown[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const response = await apiService.getCourseCatalog();
        
        if (isMounted) {
          if (response.success && response.data) {
            setState({
              data: response.data,
              loading: false,
              error: null,
            });
          } else {
            setState({
              data: null,
              loading: false,
              error: response.error || 'Failed to fetch course catalog',
            });
          }
        }
      } catch (error) {
        if (isMounted) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : 'An error occurred',
          });
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const refetch = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await apiService.getCourseCatalog();
      
      if (response.success && response.data) {
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch course catalog',
        });
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  return { ...state, refetch };
};

// Hook for fetching a single data structure (deprecated, currently unused)
// export const useDataStructure = (id: string | undefined) => {
//   const [state, setState] = useState<APIState<DataStructure>>({
//     data: null,
//     loading: true,
//     error: null,
//   });

//   useEffect(() => {
//     if (!id) {
//       setState({ data: null, loading: false, error: 'No ID provided' });
//       return;
//     }

//     let isMounted = true;

//     const fetchData = async () => {
//       try {
//         setState(prev => ({ ...prev, loading: true, error: null }));
//
//         const response = await apiService.getDataStructure(id);
//
//         if (isMounted) {
//           if (response.success && response.data) {
//             setState({
//               data: response.data,
//               loading: false,
//               error: null,
//             });
//           } else {
//             setState({
//               data: null,
//               loading: false,
//               error: response.error || 'Failed to fetch data structure',
//             });
//           }
//         }
//       } catch (error) {
//         if (isMounted) {
//           setState({
//             data: null,
//             loading: false,
//             error: error instanceof Error ? error.message : 'An error occurred',
//           });
//         }
//       }
//     };

//     fetchData();

//     return () => {
//       isMounted = false;
//     };
//   }, [id]);

//   return state;
// };

// Hook for online/offline detection
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
