import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Result, Button, message } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 显示友好的错误信息
    message.warning(`路径 "${location.pathname}" 不存在，已自动跳转到首页`);
    
    // 3秒后自动跳转到首页
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, location.pathname]);

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  return (
    <Result
      status="404"
      title="页面未找到"
      subTitle={`抱歉，您访问的路径 "${location.pathname}" 不存在。系统将在3秒后自动跳转到首页。`}
      extra={
        <Button 
          type="primary" 
          icon={<HomeOutlined />} 
          onClick={handleGoHome}
        >
          立即返回首页
        </Button>
      }
    />
  );
};

export default NotFound;
