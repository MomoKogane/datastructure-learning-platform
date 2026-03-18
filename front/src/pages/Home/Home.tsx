import React from 'react';
import { Row, Col, Card, Typography, Button, Space, Alert, Spin, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOutlined, CodeOutlined, BulbOutlined, RobotOutlined, WifiOutlined, DatabaseOutlined } from '@ant-design/icons';
import { getDifficultyLabel, getCategoryLabel } from '../../utils';
import { useCourseCatalogManager } from '../../hooks/useCourseCatalogManager';
import { useAuthStore } from '../../store/authStore';
import './Home.css';

const { Title, Paragraph } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const {
    displayCards,
    loading,
    error,
    refetch,
    useApiData,
    setUseApiData,
    isOnline
  } = useCourseCatalogManager();

  const frontendOrigin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
  const frontendPort = typeof window !== 'undefined'
    ? (window.location.port || (window.location.protocol === 'https:' ? '443' : '80'))
    : 'unknown';

  const features = [
    {
      icon: <BookOutlined className="feature-icon feature-icon-book" />,
      title: 'Concept Explanation',
      description: 'In-depth explanation of core concepts and principles of data structures'
    },
    {
      icon: <BulbOutlined className="feature-icon feature-icon-bulb" />,
      title: 'Logic Visualization',
      description: 'Intuitive display of data structure operations through animations and graphics'
    },
    {
      icon: <CodeOutlined className="feature-icon feature-icon-code" />,
      title: 'Code in Practice',
      description: 'Write and run code online to practice data structure implementations'
    },
    {
      icon: <RobotOutlined className="feature-icon feature-icon-robot" />,
      title: 'AI Smart Testing',
      description: 'AI-powered personalized Q&A and learning path recommendations'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  const promptLogin = (targetPath: string) => {
    navigate('/auth', { state: { from: targetPath } });
  };

  const handleCatalogClick = () => {
    navigate('/catalog');
  };

  const handleSectionClick = (chapterId: string, sectionId: string, toPractice = false) => {
    const targetPath = toPractice
      ? `/structure/${chapterId}/section/${sectionId}#practice`
      : `/structure/${chapterId}/section/${sectionId}`;

    if (!user) {
      promptLogin(targetPath);
      return;
    }

    navigate(targetPath);
  };

  return (
    <div className="home-container">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="hero-section"
      >
        <Title level={1} className="hero-title">
          Welcome to Data Structures Learning Platform
        </Title>
        <Paragraph className="hero-subtitle">
          A modern learning platform that integrates concept learning, visualization demonstrations,
          code practice, and intelligent testing to help you deeply understand and master various data structures.
        </Paragraph>

        <div className="hero-actions-row">
          <Button
            type="primary"
            size="large"
            icon={<BookOutlined />}
            className="btn-primary hero-action-btn"
            onClick={handleCatalogClick}
          >
            Browse Course Catalog
          </Button>
          <Button
            size="large"
            icon={<BulbOutlined />}
            className="btn-secondary hero-action-btn"
            onClick={() => {
              document.getElementById('data-structures-section')?.scrollIntoView({
                behavior: 'smooth'
              });
            }}
          >
            Quick Start
          </Button>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="features-section"
      >
        <Title level={2} className="section-title-centered">
          Core Features
        </Title>
        <Row gutter={[24, 24]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <motion.div variants={itemVariants}>
                <Card hoverable className="feature-card">
                  <div className="feature-icon-wrap">
                    {feature.icon}
                  </div>
                  <Title level={4}>{feature.title}</Title>
                  <Paragraph>{feature.description}</Paragraph>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        id="data-structures-section"
      >
        <div className="chapters-header-row">
          <Title level={2} className="chapters-title">
            Course Chapters
          </Title>

          <div>
            <Space>
              {!isOnline && (
                <Alert
                  message="Offline Mode"
                  description="Using local data"
                  type="info"
                  showIcon
                  icon={<DatabaseOutlined />}
                  className="offline-mode-alert"
                />
              )}

              {isOnline && (
                <Space>
                  <WifiOutlined className={`online-status-icon ${useApiData ? 'online-status-icon--database' : 'online-status-icon--hardcode'}`} />
                  <Switch
                    checked={useApiData}
                    onChange={setUseApiData}
                    checkedChildren="Database"
                    unCheckedChildren="Hardcode"
                    disabled={loading || !!error}
                  />
                </Space>
              )}
            </Space>
          </div>
        </div>

        {loading && (
          <div className="catalog-loading">
            <Spin size="large" />
            <div className="catalog-loading-text">Loading course catalog...</div>
          </div>
        )}

        {error && (
          <Alert
            message="Failed to load data from server"
            description={
              <div>
                <div>{error}</div>
                <div className="home-error-debug-info">
                  Current frontend Origin/port: {frontendOrigin} / {frontendPort}
                </div>
              </div>
            }
            type="error"
            showIcon
            className="home-error-alert"
            action={
              <Space className="btn-group">
                <Button size="small" onClick={refetch} className="btn-primary">
                  Retry
                </Button>
                <Button size="small" onClick={() => setUseApiData(false)} className="btn-secondary">
                  Use Local Data
                </Button>
              </Space>
            }
          />
        )}

        <Row gutter={[24, 24]}>
          {displayCards.map((chapter: {
            id: string;
            chapterId: string;
            sectionId: string;
            name: string;
            description?: string;
            difficulty: string;
            category: string;
            isTheoryTemplate?: boolean;
          }) => (
            <Col xs={24} md={12} lg={8} key={chapter.id}>
              <motion.div variants={itemVariants}>
                <Card
                  hoverable
                  className="chapter-card"
                  actions={[
                    <Button
                      type="primary"
                      className="start-learning-btn card-action-btn"
                      key="learn"
                      onClick={() => handleSectionClick(chapter.chapterId, chapter.sectionId)}
                    >
                      Learn & Practice
                    </Button>,
                    ...(!chapter.isTheoryTemplate ? [
                      <Button
                        className="code-practice-btn card-action-btn"
                        key="practice"
                        onClick={() => handleSectionClick(chapter.chapterId, chapter.sectionId, true)}
                      >
                        Advanced Practice
                      </Button>
                    ] : [])
                  ]}
                >
                  <Card.Meta
                    title={<span className="chapter-card-title">{chapter.name}</span>}
                    description={
                      <div>
                        <Paragraph ellipsis={{ rows: 2 }}>
                          {chapter.description}
                        </Paragraph>
                        <Space size="small" wrap>
                          <span className={`difficulty-tag ${chapter.difficulty}`}>
                            {getDifficultyLabel(chapter.difficulty)}
                          </span>
                          <span className={`category-tag ${chapter.category}`}>
                            {getCategoryLabel(chapter.category)}
                          </span>
                        </Space>
                      </div>
                    }
                  />
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </motion.div>
    </div>
  );
};

export default Home;
