import express from 'express';
import type { APIResponse } from '../types';

const router = express.Router();

// NOTE:
// 进度模块是系统前期设计的一部分（用于学习轨迹与得分持久化）。
// 当前阶段尚未进入实现排期，主入口已注释对应挂载。
// 本文件暂保留为占位，待后续版本恢复并完善真实接口。

// Placeholder routes - will be implemented later
router.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message: 'Progress API - Coming Soon'
  } as APIResponse);
});

export default router;
