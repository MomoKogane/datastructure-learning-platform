import express from 'express';
import type { APIResponse } from '../types';
import { contentRepository } from '../repositories/contentRepository';

const router = express.Router();

const applyPublicReadCache = (res: express.Response): void => {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
};

router.get('/catalog', async (_req: express.Request, res: express.Response): Promise<void> => {
  try {
    const data = await contentRepository.getCourseCatalog();
    applyPublicReadCache(res);
    res.json({ success: true, data, count: data.length } as APIResponse);
  } catch (error) {
    console.error('Error fetching content catalog:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch content catalog' } as APIResponse);
  }
});

router.get('/sections/:sectionId', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { sectionId } = req.params;
    const resolved = await contentRepository.resolveSection(sectionId);
    if (!resolved) {
      res.status(404).json({ success: false, error: `Section '${sectionId}' not found` } as APIResponse);
      return;
    }

    applyPublicReadCache(res);
    res.json({
      success: true,
      data: {
        sectionId: resolved.sectionId,
        templateType: resolved.templateType,
        quizSource: resolved.quizSource,
        modules: resolved.modules
      }
    } as APIResponse);
  } catch (error) {
    console.error('Error fetching content section:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch content section' } as APIResponse);
  }
});

export default router;
