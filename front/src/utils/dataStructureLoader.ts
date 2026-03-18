import type { 
  DataStructureContent, 
  TheoryContent, 
  VisualizationConfig, 
  CodeExamples, 
  PracticeProblems 
} from '../types/dataStructureContent';

/**
 * Data loader utility for managing data structure content from JSON files
 */
export class DataStructureLoader {
  private static cache: Map<string, DataStructureContent> = new Map();

  /**
   * Load complete data structure content
   */
  static async loadDataStructure(structureId: string): Promise<DataStructureContent | null> {
    // Check cache first
    if (this.cache.has(structureId)) {
      return this.cache.get(structureId)!;
    }

    try {
      const [theory, visualization, examples, practice] = await Promise.all([
        this.loadTheory(structureId),
        this.loadVisualization(structureId),
        this.loadExamples(structureId),
        this.loadPractice(structureId)
      ]);

      if (!theory || !visualization || !examples || !practice) {
        console.error(`Failed to load complete data for structure: ${structureId}`);
        return null;
      }

      const content: DataStructureContent = {
        id: structureId,
        name: theory.title,
        theory,
        visualization,
        examples,
        practice
      };

      // Cache the loaded content
      this.cache.set(structureId, content);
      return content;
    } catch (error) {
      console.error(`Error loading data structure ${structureId}:`, error);
      return null;
    }
  }

  /**
   * Load theory content from JSON
   */
  static async loadTheory(structureId: string): Promise<TheoryContent | null> {
    try {
      const response = await fetch(`/data/structures/${structureId}/theory.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json() as TheoryContent;
    } catch (error) {
      console.error(`Error loading theory for ${structureId}:`, error);
      return null;
    }
  }

  /**
   * Load visualization config from JSON
   */
  static async loadVisualization(structureId: string): Promise<VisualizationConfig | null> {
    try {
      const response = await fetch(`/data/structures/${structureId}/visualization.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json() as VisualizationConfig;
    } catch (error) {
      console.error(`Error loading visualization for ${structureId}:`, error);
      return null;
    }
  }

  /**
   * Load code examples from JSON
   */
  static async loadExamples(structureId: string): Promise<CodeExamples | null> {
    try {
      const response = await fetch(`/data/structures/${structureId}/examples.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json() as CodeExamples;
    } catch (error) {
      console.error(`Error loading examples for ${structureId}:`, error);
      return null;
    }
  }

  /**
   * Load practice problems from JSON
   */
  static async loadPractice(structureId: string): Promise<PracticeProblems | null> {
    try {
      const response = await fetch(`/data/structures/${structureId}/practice.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json() as PracticeProblems;
    } catch (error) {
      console.error(`Error loading practice for ${structureId}:`, error);
      return null;
    }
  }

  /**
   * Get list of available data structures
   */
  static async getAvailableStructures(): Promise<string[]> {
    // For now, return hardcoded list. In the future, this could be dynamic
    return [
      'array',
      'linked-list',
      'stack',
      'queue',
      'tree',
      'graph',
      'hash-table',
      'heap'
    ];
  }

  /**
   * Clear cache for a specific structure or all structures
   */
  static clearCache(structureId?: string): void {
    if (structureId) {
      this.cache.delete(structureId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Preload all available structures for better performance
   */
  static async preloadAll(): Promise<void> {
    const structures = await this.getAvailableStructures();
    const promises = structures.map(id => this.loadDataStructure(id));
    await Promise.allSettled(promises);
  }
}
