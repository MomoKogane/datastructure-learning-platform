import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import codeExecutionRouter from './routes/codeExecution';

// Import routes
import dataStructureRoutes from './routes/dataStructures';
import quizRoutes from './routes/quizzes';
import sectionContentRoutes from './routes/sectionContent';
import userRoutes from './routes/users';
import ojRoutes from './routes/oj';
import contentRoutes from './routes/content';
// import progressRoutes from './routes/progress';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';
const FRONTEND_PORT = process.env.FRONTEND_PORT ?? '5178';
const FRONTEND_URL = process.env.FRONTEND_URL ?? `http://localhost:${FRONTEND_PORT}`;
const NODE_ENV = process.env.NODE_ENV ?? 'development';

const explicitAllowedOrigins = new Set<string>([
  `http://localhost:${FRONTEND_PORT}`,
  `http://127.0.0.1:${FRONTEND_PORT}`,
  `https://localhost:${FRONTEND_PORT}`,
  `https://127.0.0.1:${FRONTEND_PORT}`
]);

if (FRONTEND_URL) {
  explicitAllowedOrigins.add(FRONTEND_URL);
}

const localhostOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const lanOriginPattern = new RegExp(
  `^https?:\\/\\/(?:10(?:\\.\\d{1,3}){3}|192\\.168(?:\\.\\d{1,3}){2}|172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?::${FRONTEND_PORT})?$`
);

const isAllowedOrigin = (origin: string): boolean => {
  if (explicitAllowedOrigins.has(origin) || localhostOriginPattern.test(origin)) {
    return true;
  }

  // In development, allow private-network frontend IPs on the configured Vite port.
  if (NODE_ENV !== 'production' && lanOriginPattern.test(origin)) {
    return true;
  }

  return false;
};

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Security middleware - Configure helmet to allow cross-origin requests
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 跨域配置 - 允许前端应用访问API
app.use(cors(corsOptions));

// 提交预检请求
app.options(/.*/, cors(corsOptions));

// 日志
app.use(morgan('combined'));

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 连接数据库
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/dslp';
    await mongoose.connect(mongoURI);
    console.log('? Connected to MongoDB');
  } catch (error) {
    console.error('? MongoDB connection error:', error);
    process.exit(1);
  }
};

// API路由
app.use('/api/data-structures', dataStructureRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/content/sections', sectionContentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/oj', ojRoutes);
// app.use('/api/progress', progressRoutes);
app.use('/api/code', codeExecutionRouter);

// // 获取章节内容
// const sectionToStructureMap = {
//   // Basic concepts - theory content
//   '1.1': 'theory:1.1',
//   '1.2': 'theory:1.2',
//   'basic-concepts': 'theory:1.1',
//   'complexity-analysis': 'theory:1.2',

//   // Strings
//   '3.1': 'array',
//   '3.2': 'array',
//   '3.2.1': 'array',
//   '3.2.2': 'array',
//   '3.2.3': 'array',
//   'string-basics': 'array',
//   'pattern-matching-overview': 'array',
//   'bf-algorithm': 'array',
//   'kmp-algorithm': 'array',
//   'pattern-matching': 'array',
  
//   // Arrays and Sequential structures
//   '2.1': 'array',
//   'arrays': 'array',
//   'linear-search': 'array',
//   'binary-search': 'array',
//   'hash-tables': 'array',
//   'advanced-search': 'array',
//   'b-tree-search': 'array',
//   'b-plus-tree-search': 'array',
//   'simple-sorts': 'array',
//   'advanced-sorts': 'array',
//   'special-sorts': 'array',
  
//   // Linked Lists
//   '2.2': 'linkedlist',
//   '2.3': 'linkedlist',
//   '2.4': 'linkedlist',
//   'linked-lists': 'linkedlist',
//   'stacks': 'linkedlist',
//   'queues': 'linkedlist',
  
//   // Binary Trees
//   '4.1': 'binarytree',
//   '4.2': 'binarytree',
//   '4.3': 'binarytree',
//   '4.4': 'binarytree',
//   '4.5': 'binarytree',
//   '4.6': 'binarytree',
//   '4.7': 'binarytree',
//   '4.8': 'binarytree',
//   '4.9': 'binarytree',
//   '4.10': 'theory:4.10',
//   'tree-basics': 'binarytree',
//   'tree-traversal': 'binarytree',
//   'binary-tree-basics': 'binarytree',
//   'binary-trees': 'binarytree',
//   'search-trees': 'binarytree',
//   'huffman-trees': 'binarytree',
//   'heap': 'theory:4.10',
//   'binary-tree-basics-traversal': 'binarytree',
//   'threaded-binary-tree': 'binarytree',
//   'bst-basics': 'binarytree',
//   'avl-tree': 'binarytree',
//   'red-black-tree': 'binarytree',
//   'multiway-balanced-tree': 'binarytree',

//   // Graphs
//   '5.1': 'graph',
//   '5.2': 'graph',
//   '5.2.1': 'graph',
//   '5.2.2': 'graph',
//   '5.2.3': 'graph',
//   '5.3': 'graph',
//   '5.3.1': 'graph',
//   '5.3.2': 'graph',
//   '5.3.3': 'graph',
//   '5.3.4': 'graph',
//   '5.4': 'graph',
//   '5.4.1': 'graph',
//   '5.4.2': 'graph',
//   '5.4.3': 'graph',
//   'graph-basics': 'graph',
//   'graph-traversal': 'graph',
//   'shortest-paths': 'graph',
//   'minimum-spanning-trees': 'graph',
//   'graph-traversal-overview': 'graph',
//   'graph-dfs': 'graph',
//   'graph-bfs': 'graph',
//   'shortest-path-overview': 'graph',
//   'dijkstra-algorithm': 'graph',
//   'bellman-ford-algorithm': 'graph',
//   'floyd-algorithm': 'graph',
//   'mst-overview': 'graph',
//   'prim-algorithm': 'graph',
//   'kruskal-algorithm': 'graph',

//   // Searching (chapter-number aliases)
//   '6': 'array',
//   '6.1': 'array',
//   '6.2': 'array',
//   '6.3': 'array',
//   '6.4': 'array',
//   '6.5': 'array',

//   // Sorting (chapter-number aliases)
//   '7': 'array',
//   '7.1': 'array',
//   '7.2': 'array',
//   '7.3': 'array',
//   '7.4': 'array',
//   '7.5': 'array',
//   '7.6': 'array',
//   '7.7': 'array',
//   '7.8': 'array',
//   '7.9': 'array',
//   '7.10': 'array',
//   '7.11': 'array'
// };

// // Get section mapping to data structures
// app.get('/api/section-mapping', (req, res) => {
//   res.json({
//     success: true,
//     data: sectionToStructureMap
//   });
// });

// 健康检查端点
app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Data Structure Learning Platform API',
    dbConnected
  });
});

// API root info
app.get('/api', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Data Structure Learning Platform API',
    mode: 'index',
    message: 'API is running. Use one of the available routes below.',
    availableRoutes: [
      '/api',
      '/api/health',
      '/api/content/catalog',
      '/api/content/sections/:sectionId',
      '/api/content/sections/:sectionId/modules',
      '/api/content/sections/:sectionId/modules/:module',
      '/api/data-structures',
      '/api/data-structures/:id',
      '/api/quizzes/template',
      '/api/quizzes/generate/:sectionId',
      '/api/quizzes/generate-online/:sectionId',
      '/api/quizzes/submission/:sectionId',
      '/api/code/template/:sectionId',
      '/api/code/execute'
    ]
  });
});

// 404 
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, HOST, () => {
      const backendApiUrl = `http://localhost:${PORT}/api`;
      const frontendUrl = FRONTEND_URL || `http://localhost:${FRONTEND_PORT}`;
      const lanBackendUrl = HOST === '0.0.0.0' ? `http://<your-lan-ip>:${PORT}/api` : `http://${HOST}:${PORT}/api`;

      console.log(`? Server running on port ${PORT}`);
      console.log(`? Host: ${HOST}`);
      console.log(`? Environment: ${NODE_ENV}`);
      console.log(`? API URL: ${backendApiUrl}`);
      console.log(`? LAN API URL: ${lanBackendUrl}`);
      console.log('');
      console.log('=== Runtime Quick Check ===');
      console.log(`Frontend URL : ${frontendUrl}`);
      console.log(`Backend URL  : ${backendApiUrl}`);
      console.log(`Allowed CORS origins: ${Array.from(explicitAllowedOrigins).join(', ')}`);
      console.log('Tip: use the same host/IP to open frontend and backend on LAN devices.');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
