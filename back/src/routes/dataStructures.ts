import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import DataStructure from '../models/DataStructure';
import type { APIResponse } from '../types';

const router = express.Router();

type DataStructureDbRecord = Record<string, unknown>;

const isObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const getDataStructuresCollection = () => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB is not connected');
  }

  return db.collection('datastructures');
};

const inferAllowedModules = (templateType: unknown, modules: unknown): string[] => {
  if (Array.isArray(modules)) {
    return modules.map((item) => String(item));
  }

  if (templateType === 'theory') {
    return ['theory', 'keyTakeaways'];
  }

  return ['theory', 'visualization', 'examples', 'practice'];
};

const normalizeModuleName = (moduleName: string): string | null => {
  const normalized = moduleName.trim().toLowerCase();

  switch (normalized) {
    case 'theory':
      return 'theory';
    case 'visualization':
      return 'visualization';
    case 'examples':
      return 'examples';
    case 'practice':
      return 'practice';
    case 'keytakeaways':
    case 'key_takeaways':
    case 'key-takeaways':
    case 'keytakeaway':
    case 'key-takeaway':
      return 'keyTakeaways';
    default:
      return null;
  }
};

const toApiDataStructure = (doc: DataStructureDbRecord): Record<string, unknown> => {
  const sectionId = String(doc.sectionId ?? doc.id ?? '');
  const modules = isObject(doc.modules) ? doc.modules : {};
  const theoryModule = isObject(modules.theory) ? modules.theory : {};
  const visualizationModule = isObject(modules.visualization) ? modules.visualization : {};
  const complexity = isObject(theoryModule.complexity) ? theoryModule.complexity : {};

  const concepts = Array.isArray(doc.concepts)
    ? doc.concepts
    : (Array.isArray(theoryModule.concepts)
      ? theoryModule.concepts
      : (Array.isArray(theoryModule.sections) ? theoryModule.sections : []));

  const operations = Array.isArray(doc.operations)
    ? doc.operations
    : (Array.isArray(visualizationModule.operations) ? visualizationModule.operations : []);

  const visualizationConfig = isObject(doc.visualizationConfig)
    ? doc.visualizationConfig
    : visualizationModule;

  const timeComplexity = isObject(doc.timeComplexity)
    ? doc.timeComplexity
    : (isObject(complexity.time)
      ? complexity.time
      : (isObject(complexity.timeComplexity) ? complexity.timeComplexity : {}));

  const spaceComplexity = doc.spaceComplexity
    ?? complexity.space
    ?? complexity.spaceComplexity
    ?? '';

  const allowedModules = Array.isArray(doc.allowedModules)
    ? doc.allowedModules.map((item) => String(item))
    : inferAllowedModules(doc.templateType, doc.allowedModules);

  return {
    ...doc,
    id: String(doc.id ?? sectionId),
    sectionId,
    aliases: Array.isArray(doc.aliases) ? doc.aliases : [],
    name: String(doc.name ?? doc.sectionTitle ?? `Section ${sectionId}`),
    displayName: String(doc.displayName ?? doc.name ?? doc.sectionTitle ?? `Section ${sectionId}`),
    description: String(doc.description ?? theoryModule.overview ?? theoryModule.introduction ?? ''),
    category: String(doc.category ?? 'linear'),
    difficulty: String(doc.difficulty ?? 'beginner'),
    templateType: doc.templateType === 'theory' ? 'theory' : 'data-structure',
    quizSource: String(doc.quizSource ?? 'theory'),
    allowedModules,
    modules,
    concepts,
    operations,
    timeComplexity,
    spaceComplexity,
    visualizationConfig
  };
};

const findOneByIdOrAlias = async (id: string): Promise<Record<string, unknown> | null> => {
  const normalizedId = id.trim();
  const collection = getDataStructuresCollection();

  const doc = await collection.findOne({
    $or: [
      { id: normalizedId },
      { sectionId: normalizedId },
      { aliases: normalizedId }
    ]
  });

  return doc ? toApiDataStructure(doc as DataStructureDbRecord) : null;
};

// Validation middleware
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors.array()
    } as APIResponse);
    return;
  }
  next();
};

/**
 * GET /api/data-structures
 * Get all data structures with optional filtering
 */
router.get('/', 
  [
    query('category').optional().isIn(['linear', 'tree', 'graph', 'hash']),
    query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    handleValidationErrors
  ],
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { category, difficulty } = req.query;
      
      const filter: Record<string, unknown> = {};
      if (category) filter.category = category;
      if (difficulty) filter.difficulty = difficulty;

      const collection = getDataStructuresCollection();
      const docs = await collection.find(filter).sort({ category: 1, name: 1 }).toArray();
      const dataStructures = docs.map((doc) => toApiDataStructure(doc as DataStructureDbRecord));

      res.json({
        success: true,
        data: dataStructures,
        count: dataStructures.length
      } as APIResponse);
    } catch (error) {
      console.error('Error fetching data structures:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch data structures'
      } as APIResponse);
    }
  }
);

/**
 * GET /api/data-structures/:id
 * Get specific data structure by ID
 */
router.get('/:id',
  [
    param('id').notEmpty().withMessage('Data structure ID is required'),
    handleValidationErrors
  ],
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { id } = req.params;
      const dataStructure = await findOneByIdOrAlias(id);
      
      if (!dataStructure) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Data structure with ID '${id}' not found`
        } as APIResponse);
        return;
      }

      res.json({
        success: true,
        data: dataStructure
      } as APIResponse);
    } catch (error) {
      console.error('Error fetching data structure:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch data structure'
      } as APIResponse);
    }
  }
);

/**
 * GET /api/data-structures/:id/operations
 * Get operations for a specific data structure
 */
router.get('/:id/operations',
  [
    param('id').notEmpty().withMessage('Data structure ID is required'),
    handleValidationErrors
  ],
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { id } = req.params;
      const dataStructure = await findOneByIdOrAlias(id);
      
      if (!dataStructure) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Data structure with ID '${id}' not found`
        } as APIResponse);
        return;
      }

      const operations = Array.isArray(dataStructure.operations) ? dataStructure.operations : [];

      res.json({
        success: true,
        data: operations
      } as APIResponse);
    } catch (error) {
      console.error('Error fetching operations:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch operations'
      } as APIResponse);
    }
  }
);

/**
 * GET /api/data-structures/:id/concepts
 * Get learning concepts for a specific data structure
 */
router.get('/:id/concepts',
  [
    param('id').notEmpty().withMessage('Data structure ID is required'),
    handleValidationErrors
  ],
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { id } = req.params;
      const dataStructure = await findOneByIdOrAlias(id);
      
      if (!dataStructure) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Data structure with ID '${id}' not found`
        } as APIResponse);
        return;
      }

      // Sort concepts by order
      const concepts = Array.isArray(dataStructure.concepts) ? dataStructure.concepts : [];
      const sortedConcepts = [...concepts].sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));

      res.json({
        success: true,
        data: sortedConcepts
      } as APIResponse);
    } catch (error) {
      console.error('Error fetching concepts:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch concepts'
      } as APIResponse);
    }
  }
);

/**
 * GET /api/data-structures/:id/modules/:module
 * Get a specific module by data structure section id / alias
 */
router.get('/:id/modules/:module',
  [
    param('id').notEmpty().withMessage('Data structure ID is required'),
    param('module').notEmpty().withMessage('Module name is required'),
    handleValidationErrors
  ],
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { id, module } = req.params;
      const normalizedModule = normalizeModuleName(module);

      if (!normalizedModule) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: `Invalid module '${module}'. Allowed modules: theory, visualization, examples, practice, keyTakeaways`
        } as APIResponse);
        return;
      }

      const dataStructure = await findOneByIdOrAlias(id);
      if (!dataStructure) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Data structure with ID '${id}' not found`
        } as APIResponse);
        return;
      }

      const templateType = dataStructure.templateType === 'theory' ? 'theory' : 'data-structure';
      const allowedModules = inferAllowedModules(templateType, dataStructure.allowedModules);

      if (!allowedModules.includes(normalizedModule)) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: `Module '${normalizedModule}' is not available for template '${templateType}'`,
          data: {
            sectionId: dataStructure.sectionId,
            templateType,
            allowedModules
          }
        } as APIResponse);
        return;
      }

      const modules = isObject(dataStructure.modules)
        ? dataStructure.modules
        : {};
      const moduleContent = modules[normalizedModule];

      res.json({
        success: true,
        data: {
          sectionId: dataStructure.sectionId,
          templateType,
          quizSource: dataStructure.quizSource,
          module: normalizedModule,
          content: moduleContent
        }
      } as APIResponse);
    } catch (error) {
      console.error('Error fetching section module content from datastructures:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch section module content'
      } as APIResponse);
    }
  }
);

/**
 * GET /api/data-structures/:id/modules
 * Get all available modules for a specific data structure section
 */
router.get('/:id/modules',
  [
    param('id').notEmpty().withMessage('Data structure ID is required'),
    handleValidationErrors
  ],
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { id } = req.params;

      const dataStructure = await findOneByIdOrAlias(id);
      if (!dataStructure) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Data structure with ID '${id}' not found`
        } as APIResponse);
        return;
      }

      const templateType = dataStructure.templateType === 'theory' ? 'theory' : 'data-structure';
      const allowedModules = inferAllowedModules(templateType, dataStructure.allowedModules);
      const modules = isObject(dataStructure.modules)
        ? dataStructure.modules
        : {};

      const filteredModules = allowedModules.reduce<Record<string, unknown>>((acc, moduleName) => {
        acc[moduleName] = modules[moduleName];
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          sectionId: dataStructure.sectionId,
          templateType,
          quizSource: dataStructure.quizSource,
          allowedModules,
          modules: filteredModules
        }
      } as APIResponse);
    } catch (error) {
      console.error('Error fetching section modules from datastructures:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch section modules'
      } as APIResponse);
    }
  }
);

/**
 * POST /api/data-structures
 * Create a new data structure (Admin only - for now without auth)
 */
router.post('/',
  [
    body('id').notEmpty().withMessage('ID is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('displayName').notEmpty().withMessage('Display name is required'),
    body('category').isIn(['linear', 'tree', 'graph']).withMessage('Invalid category'),
    body('description').notEmpty().withMessage('Description is required'),
    handleValidationErrors
  ],
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const dataStructureData = req.body;
      
      // Check if data structure already exists
      const existingDS = await DataStructure.findOne({ id: dataStructureData.id });
      if (existingDS) {
        res.status(409).json({
          success: false,
          error: 'Conflict',
          message: `Data structure with ID '${dataStructureData.id}' already exists`
        } as APIResponse);
        return;
      }

      const dataStructure = new DataStructure(dataStructureData);
      await dataStructure.save();

      res.status(201).json({
        success: true,
        data: dataStructure,
        message: 'Data structure created successfully'
      } as APIResponse);
    } catch (error) {
      console.error('Error creating data structure:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create data structure'
      } as APIResponse);
    }
  }
);

/**
 * PUT /api/data-structures/:id
 * Update an existing data structure
 */
router.put('/:id',
  [
    param('id').notEmpty().withMessage('Data structure ID is required'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('displayName').optional().notEmpty().withMessage('Display name cannot be empty'),
    body('category').optional().isIn(['linear', 'tree', 'graph']).withMessage('Invalid category'),
    handleValidationErrors
  ],
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const dataStructure = await DataStructure.findOneAndUpdate(
        { id },
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select('-__v');
      
      if (!dataStructure) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Data structure with ID '${id}' not found`
        } as APIResponse);
        return;
      }

      res.json({
        success: true,
        data: dataStructure,
        message: 'Data structure updated successfully'
      } as APIResponse);
    } catch (error) {
      console.error('Error updating data structure:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update data structure'
      } as APIResponse);
    }
  }
);

/**
 * DELETE /api/data-structures/:id
 * Delete a data structure
 */
router.delete('/:id',
  [
    param('id').notEmpty().withMessage('Data structure ID is required'),
    handleValidationErrors
  ],
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const dataStructure = await DataStructure.findOneAndDelete({ id });
      
      if (!dataStructure) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Data structure with ID '${id}' not found`
        } as APIResponse);
        return;
      }

      res.json({
        success: true,
        message: 'Data structure deleted successfully'
      } as APIResponse);
    } catch (error) {
      console.error('Error deleting data structure:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete data structure'
      } as APIResponse);
    }
  }
);

export default router;
