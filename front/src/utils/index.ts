// Utility functions collection

/**
 * Format time complexity display
 */
export const formatComplexity = (complexity: string): string => {
  return complexity.replace(/O\(([^)]+)\)/, 'O($1)');
};

/**
 * Get difficulty level display in English
 */
export const getDifficultyLabel = (difficulty: string): string => {
  const difficultyMap: Record<string, string> = {
    'beginner': 'Beginner',
    'intermediate': 'Intermediate',
    'advanced': 'Advanced',
    'easy': 'Easy',
    'medium': 'Medium',
    'hard': 'Hard'
  };
  return difficultyMap[difficulty] || difficulty;
};

/**
 * Get category display in English
 */
export const getCategoryLabel = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'linear': 'Linear Structure',
    'tree': 'Tree Structure',
    'graph': 'Graph Structure',
    'hash': 'Hash Structure'
  };
  return categoryMap[category] || category;
};

/**
 * Generate random color
 */
export const generateRandomColor = (): string => {
  const colors = [
    '#1890ff', '#52c41a', '#fa8c16', '#eb2f96',
    '#722ed1', '#13c2c2', '#faad14', '#f5222d'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Delay function
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Get random array for demonstration
 */
export const getRandomArray = (length: number = 5, max: number = 100): number[] => {
  return Array.from({ length }, () => Math.floor(Math.random() * max) + 1);
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | null = null;
  let previous = 0;
  
  return function(this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
};
