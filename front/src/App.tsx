import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Home from './pages/Home/Home';
import Catalog from './pages/Catalog/Catalog';
import StructureDetail from './pages/StructureDetail/StructureDetail';
import TheoryContent from './pages/TheoryContent/TheoryContent';
import Practice from './pages/Practice/Practice';
// import AuthPage from './pages/Auth/Auth';
import AuthPage from './pages/Auth/Auth';
import PersonalSpace from './pages/PersonalSpace/PersonalSpace';
import TeachingClassManage from './pages/TeachingClassManage/TeachingClassManage';
import OJPractice from './pages/OJPractice/OJPractice';
import NotFound from './components/NotFound/NotFound';
import { useAuthStore } from './store/authStore';

// Enhanced font configuration for better rendering
const antdTheme = {
  token: {
    fontFamily: '"Noto Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", "SimSun", "SimHei", "PingFang SC", "Hiragino Sans GB", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: 14,
    colorText: '#000000',
    colorTextBase: '#000000',
    colorTextHeading: '#000000',
  },
  components: {
    Typography: {
      fontFamily: '"Noto Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", "SimSun", "SimHei", "PingFang SC", "Hiragino Sans GB", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
      colorText: '#000000',
      colorTextHeading: '#000000',
    },
    Button: {
      fontFamily: '"Noto Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", "SimSun", "SimHei", "PingFang SC", "Hiragino Sans GB", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    Menu: {
      fontFamily: '"Noto Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", "SimSun", "SimHei", "PingFang SC", "Hiragino Sans GB", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
      colorText: '#000000',
    },
    Card: {
      fontFamily: '"Noto Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", "SimSun", "SimHei", "PingFang SC", "Hiragino Sans GB", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
      colorText: '#000000',
      colorTextHeading: '#000000',
    },
  },
};

function App() {
  useEffect(() => {
    void useAuthStore.getState().initialize();
  }, []);

  return (
    <ConfigProvider 
      locale={enUS} 
      theme={antdTheme}
    >
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/structure/:id" element={<ProtectedRoute><StructureDetail /></ProtectedRoute>} />
            <Route path="/structure/:chapterId/section/:sectionId" element={<ProtectedRoute><StructureDetail /></ProtectedRoute>} />
            <Route path="/theory/:id" element={<ProtectedRoute><TheoryContent /></ProtectedRoute>} />
            <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
            <Route path="/practice/:id" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
            <Route path="/oj/:sectionId" element={<ProtectedRoute><OJPractice /></ProtectedRoute>} />
            <Route path="/personal-space" element={<ProtectedRoute><PersonalSpace /></ProtectedRoute>} />
            <Route path="/teaching-class/:classId" element={<ProtectedRoute><TeachingClassManage /></ProtectedRoute>} />
            {/* 404 处理 - 匹配所有未定义的路由 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
