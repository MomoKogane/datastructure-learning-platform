import { create } from 'zustand';
import type { DataStructure, LearningProgress, Operation } from '../types';

interface LearningStore {
  // 状态
  currentStructure: DataStructure | null;
  progress: LearningProgress;
  isVisualizationActive: boolean;
  selectedOperation: Operation | null;
  
  // 数据源管理
  useApiData: boolean;
  dataStructures: DataStructure[];
  
  // 动作
  setCurrentStructure: (structure: DataStructure | null) => void;
  setProgress: (progress: LearningProgress) => void;
  toggleVisualization: () => void;
  setSelectedOperation: (operation: Operation | null) => void;
  updateProgress: (structureId: string, score?: number) => void;
  
  // 数据源动作
  setUseApiData: (useApi: boolean) => void;
  setDataStructures: (structures: DataStructure[]) => void;
}

export const useLearningStore = create<LearningStore>()((set) => ({
  // 初始状态
  currentStructure: null,
  progress: {
    userId: 'default',
    completedStructures: [],
    quizScores: {},
    totalTimeSpent: 0,
  },
  isVisualizationActive: false,
  selectedOperation: null,
  
  // 数据源状态
  useApiData: true,
  dataStructures: [],
  
  // 动作实现
  setCurrentStructure: (structure) => set({ currentStructure: structure }),
  
  setProgress: (progress) => set({ progress }),
  
  toggleVisualization: () => set((state) => ({ 
    isVisualizationActive: !state.isVisualizationActive 
  })),
  
  setSelectedOperation: (operation) => set({ selectedOperation: operation }),
  
  // 数据源动作
  setUseApiData: (useApi) => set({ useApiData: useApi }),
  
  setDataStructures: (structures) => set({ dataStructures: structures }),
  
  updateProgress: (structureId, score) => set((state) => {
    const newProgress = { ...state.progress };
    
    if (!newProgress.completedStructures.includes(structureId)) {
      newProgress.completedStructures.push(structureId);
    }
    
    if (score !== undefined) {
      newProgress.quizScores[structureId] = score;
    }
    
    return { progress: newProgress };
  }),
}));
