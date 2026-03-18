import express from 'express';
import type { APIResponse } from '../types';
import { contentRepository } from '../repositories/contentRepository';
import {
  getAllowedModulesByTemplate,
  normalizeModuleName
} from '../utils/sectionContentResolver';

const router = express.Router();

const applyPublicReadCache = (res: express.Response): void => {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
};

const UPDATED_HASH_OPERATIONS = [
  {
    name: 'Query/Insert',
    description: 'Input value, query its chain by modulo bucket; if absent, append to chain tail.',
    steps: ['Compute hash index by modulo', 'Scan bucket chain for value', 'Insert at tail if not found']
  },
  {
    name: 'Query/Delete',
    description: 'Input value, query its chain and delete the matched node if it exists.',
    steps: ['Compute hash index by modulo', 'Scan bucket chain for value', 'Delete node when matched']
  }
] as const;

const UPDATED_HASH_NODES = ['12', '7', '19', '26', '31', '9', '14', '22'] as const;

const UPDATED_BTREE_OPERATIONS = [
  {
    name: 'Query/Insert',
    description: 'Input value, query in B-Tree then insert; split nodes when overflow occurs.',
    steps: ['Query target path from root', 'Insert into target leaf', 'Split and promote key if overflow']
  },
  {
    name: 'Query/Delete',
    description: 'Input value, query in B-Tree then delete; merge/redistribute when underflow occurs.',
    steps: ['Query target path from root', 'Delete key from node/leaf', 'Merge or redistribute if underflow']
  }
] as const;

const UPDATED_BTREE_NODES = ['8', '12', '15', '20', '24', '30', '35', '40'] as const;

const UPDATED_BPLUS_OPERATIONS = [
  {
    name: 'Query/Insert',
    description: 'Input value, query leaf position then insert; split nodes and update separators when needed.',
    steps: ['Query from root to target leaf', 'Insert into ordered leaf', 'Split leaf/internal node if overflow']
  },
  {
    name: 'Query/Delete',
    description: 'Input value, query leaf position then delete; merge/redistribute and refresh separators when needed.',
    steps: ['Query from root to target leaf', 'Delete key from leaf', 'Merge or redistribute if underflow']
  }
] as const;

const UPDATED_BPLUS_NODES = ['5', '9', '13', '17', '21', '26', '32', '38'] as const;

const normalizeVisualizationContent = (sectionId: string, content: unknown): unknown => {
  if (!content || typeof content !== 'object') {
    return content;
  }

  const payload = content as Record<string, unknown>;
  if (!['6.3', '6.4', '6.5'].includes(sectionId)) {
    return payload;
  }

  const rawOperations = Array.isArray(payload.operations) ? payload.operations : [];
  const hasUpdatedOps = rawOperations.some((item) => {
    if (!item || typeof item !== 'object') return false;
    const name = String((item as Record<string, unknown>).name ?? '').toLowerCase();
    return name.includes('query/insert') || name.includes('query/delete');
  });

  const hasLegacyLookupOnly = sectionId === '6.3'
    && rawOperations.length === 1
    && String((rawOperations[0] as Record<string, unknown>)?.name ?? '').toLowerCase() === 'lookup';
  const hasLegacyBTreeOps = sectionId === '6.4'
    && rawOperations.length === 1
    && /insert\s*key/i.test(String((rawOperations[0] as Record<string, unknown>)?.name ?? ''));
  const hasLegacyBPlusOps = sectionId === '6.5'
    && rawOperations.length === 1
    && /range\s*query/i.test(String((rawOperations[0] as Record<string, unknown>)?.name ?? ''));

  const rawNodes = Array.isArray(payload.nodes)
    ? payload.nodes
    : (Array.isArray(payload.visualNodes) ? payload.visualNodes : []);
  const hasLegacyNodes = sectionId === '6.3'
    ? rawNodes.some((item) => /k\d+|\//i.test(String(item)))
    : sectionId === '6.4'
    ? rawNodes.some((item) => /\[|\]|\|/.test(String(item)))
    : rawNodes.some((item) => /index|leaf/i.test(String(item)));

  const targetType = sectionId === '6.3' ? 'hash' : 'tree';
  const targetTitle = sectionId === '6.3'
    ? 'Buckets and collisions'
    : sectionId === '6.4'
    ? 'B-Tree node split/merge'
    : 'B+ Tree leaf split/merge';
  const targetNodes = sectionId === '6.3'
    ? [...UPDATED_HASH_NODES]
    : sectionId === '6.4'
    ? [...UPDATED_BTREE_NODES]
    : [...UPDATED_BPLUS_NODES];
  const targetOps = sectionId === '6.3'
    ? [...UPDATED_HASH_OPERATIONS]
    : sectionId === '6.4'
    ? [...UPDATED_BTREE_OPERATIONS]
    : [...UPDATED_BPLUS_OPERATIONS];
  const hasLegacyOps = hasLegacyLookupOnly || hasLegacyBTreeOps || hasLegacyBPlusOps;

  return {
    ...payload,
    type: payload.type ?? targetType,
    title: String(payload.title ?? payload.visualCaption ?? targetTitle),
    visualCaption: String(payload.visualCaption ?? payload.title ?? targetTitle),
    nodes: (hasLegacyNodes || rawNodes.length === 0) ? targetNodes : rawNodes.map((item) => String(item)),
    visualNodes: (hasLegacyNodes || rawNodes.length === 0) ? targetNodes : rawNodes.map((item) => String(item)),
    operations: hasUpdatedOps
      ? rawOperations
      : (hasLegacyOps || rawOperations.length === 0)
      ? targetOps
      : rawOperations
  };
};

router.get('/:id/modules/:module', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { id, module } = req.params;
    const normalizedModule = normalizeModuleName(module);

    if (!normalizedModule) {
      res.status(400).json({
        success: false,
        error: `Invalid module '${module}'. Allowed modules: theory, visualization, examples, practice, keyTakeaways`
      } as APIResponse);
      return;
    }

    const resolved = await contentRepository.resolveSection(id);

    if (!resolved) {
      res.status(404).json({
        success: false,
        error: `Section '${id}' not found`
      } as APIResponse);
      return;
    }

    const allowedModules = getAllowedModulesByTemplate(resolved.templateType);
    if (!allowedModules.includes(normalizedModule)) {
      res.status(400).json({
        success: false,
        error: `Module '${normalizedModule}' is not available for template '${resolved.templateType}'`,
        data: {
          sectionId: resolved.sectionId,
          templateType: resolved.templateType,
          allowedModules
        }
      } as APIResponse);
      return;
    }

    const moduleContent = normalizedModule === 'visualization'
      ? normalizeVisualizationContent(resolved.sectionId, resolved.modules[normalizedModule])
      : resolved.modules[normalizedModule];

    applyPublicReadCache(res);

    res.json({
      success: true,
      data: {
        sectionId: resolved.sectionId,
        templateType: resolved.templateType,
        quizSource: resolved.quizSource,
        module: normalizedModule,
        content: moduleContent
      }
    } as APIResponse);
  } catch (error) {
    console.error('Error fetching section module content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch section module content'
    } as APIResponse);
  }
});

router.get('/:id/modules', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { id } = req.params;
    const resolved = await contentRepository.resolveSection(id);

    if (!resolved) {
      res.status(404).json({
        success: false,
        error: `Section '${id}' not found`
      } as APIResponse);
      return;
    }

    const allowedModules = getAllowedModulesByTemplate(resolved.templateType);
    const filteredModules = allowedModules.reduce<Record<string, unknown>>((acc, moduleName) => {
      acc[moduleName] = moduleName === 'visualization'
        ? normalizeVisualizationContent(resolved.sectionId, resolved.modules[moduleName])
        : resolved.modules[moduleName];
      return acc;
    }, {});

    applyPublicReadCache(res);

    res.json({
      success: true,
      data: {
        sectionId: resolved.sectionId,
        templateType: resolved.templateType,
        quizSource: resolved.quizSource,
        allowedModules,
        modules: filteredModules
      }
    } as APIResponse);
  } catch (error) {
    console.error('Error fetching section modules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch section modules'
    } as APIResponse);
  }
});

export default router;
