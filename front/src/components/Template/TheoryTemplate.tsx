import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Button, Tabs, Space, Tag, Spin, Alert, List, message } from 'antd';
import { BookOutlined, QuestionCircleOutlined, CheckCircleOutlined, StarFilled } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { isTrackableSectionId } from '../../utils/progressDisplay';
import './DataStructureTemplate.css';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

interface TheoryConcept {
  title: string;
  content: string;
  examples?: string[];
}

export interface TheoryTemplateContent {
  id: string;
  name: string;
  subtitle?: string;
  theory: {
    overview: string;
    concepts: TheoryConcept[];
  };
  keyTakeaways: string[];
  quizSectionId?: string;
  levelTag?: string;
}

export interface TheoryTemplateProps {
  structureId: string;
  structureName: string;
  chapterNumber?: string;
  dataLoader: () => Promise<TheoryTemplateContent>;
}

const TheoryTemplate: React.FC<TheoryTemplateProps> = ({
  structureId,
  structureName,
  chapterNumber = '',
  dataLoader
}) => {
  const [content, setContent] = useState<TheoryTemplateContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { chapterId, sectionId, id } = useParams<{ chapterId?: string; sectionId?: string; id?: string }>();
  const user = useAuthStore((state) => state.user);
  const [favoriteSections, setFavoriteSections] = useState<string[]>([]);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const getInitialTab = () => {
    const hash = location.hash.replace('#', '');
    if (['theory', 'takeaways', 'quiz'].includes(hash)) {
      return hash;
    }
    return 'theory';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());

  const resolveFavoriteKey = (): string | null => {
    if (chapterId && sectionId) {
      return `${chapterId}:${sectionId}`;
    }

    const rawSectionId = sectionId || id || chapterNumber || '';
    if (rawSectionId && rawSectionId.includes('.')) {
      const chapterFromSection = rawSectionId.split('.')[0];
      return `${chapterFromSection}:${rawSectionId}`;
    }

    return null;
  };

  const favoriteKey = resolveFavoriteKey();
  const canFavorite = user?.role === 'student' && Boolean(favoriteKey);
  const isFavorited = Boolean(favoriteKey && favoriteSections.includes(favoriteKey));

  const resolveProgressSectionId = (): string | null => {
    if (sectionId && isTrackableSectionId(sectionId)) {
      return sectionId;
    }

    if (id && isTrackableSectionId(id)) {
      return id;
    }

    if (chapterNumber && isTrackableSectionId(chapterNumber)) {
      return chapterNumber;
    }

    return null;
  };

  const progressSectionId = resolveProgressSectionId();

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (['theory', 'takeaways', 'quiz'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  useEffect(() => {
    const loadFavorites = async () => {
      if (user?.role !== 'student') {
        setFavoriteSections([]);
        return;
      }

      try {
        const result = await apiService.getFavorites();
        if (result.success && result.data) {
          setFavoriteSections(result.data);
        }
      } catch {
        // no-op
      }
    };

    void loadFavorites();
  }, [user?.role, user?.userId]);

  useEffect(() => {
    if (user?.role !== 'student' || !progressSectionId) {
      return;
    }

    void apiService.updateStudentSectionProgress(progressSectionId, { theoryCompleted: true }).catch(() => {
      // no-op
    });
  }, [user?.role, user?.userId, progressSectionId]);

  const handleToggleFavorite = async () => {
    if (!favoriteKey || user?.role !== 'student') {
      return;
    }

    setFavoriteLoading(true);
    try {
      const result = await apiService.toggleFavorite(favoriteKey);
      if (result.success && result.data) {
        setFavoriteSections(result.data.favoriteSections || []);
        message.success(result.data.toggledOn ? '已收藏' : '已取消收藏');
      } else {
        message.error(result.error || '收藏操作失败');
      }
    } catch {
      message.error('收藏操作失败');
    } finally {
      setFavoriteLoading(false);
    }
  };

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        console.log(`Loading ${structureId} content...`);
        const structureContent = await dataLoader();
        console.log('Loaded content:', structureContent);
        setContent(structureContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
        console.error(`Failed to load ${structureId} content:`, err);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [dataLoader, structureId]);

  const renderTheoryTab = () => {
    if (!content) return <div>Loading theory content...</div>;
    const levelTag = content.levelTag || 'Theory';

    return (
      <div className="theory-content">
        <Title level={3}>{structureName} Theory</Title>

        <Card title="Overview" className="concept-card">
          <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8' }}>
            {content.theory.overview}
          </div>
          <div style={{ marginTop: '12px' }}>
            <Space size="small">
              <Tag color="blue">{levelTag}</Tag>
              <Tag color="purple">Theory</Tag>
            </Space>
          </div>
        </Card>

        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
          {content.theory.concepts.map((concept, index) => (
            <Col xs={24} lg={12} key={`${concept.title}-${index}`}>
              <Card title={concept.title} className="concept-card">
                <Paragraph>{concept.content}</Paragraph>
                {concept.examples?.length ? (
                  <List
                    size="small"
                    dataSource={concept.examples}
                    renderItem={(item) => (
                      <List.Item>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        <Text>{item}</Text>
                      </List.Item>
                    )}
                  />
                ) : null}
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  const renderTakeawaysTab = () => {
    if (!content) return null;

    return (
      <div className="theory-content">
        <Card className="takeaway-card">
          <Title level={4}>Key Takeaways</Title>
          <List
            className="takeaway-list"
            dataSource={content.keyTakeaways}
            renderItem={(item) => (
              <List.Item>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <Text>{item}</Text>
              </List.Item>
            )}
          />
        </Card>
      </div>
    );
  };

  const renderQuizTab = () => {
    const quizSectionId = content?.quizSectionId?.trim() || chapterNumber?.trim();
    const canOpenUnifiedQuiz = Boolean(quizSectionId);

    return (
      <div className="quiz-content">
        <Card style={{ marginBottom: '24px' }}>
          <Title level={3}>Ready for a quick quiz?</Title>
          <Paragraph>
            Generate a personalized test based on what you just learned in the {structureName} section.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            icon={<QuestionCircleOutlined />}
            disabled={!canOpenUnifiedQuiz}
            onClick={() => {
              if (quizSectionId) {
                navigate(`/theory/${quizSectionId}`);
              }
            }}
          >
            Generate Quiz
          </Button>
          {!canOpenUnifiedQuiz && (
            <Paragraph type="secondary" style={{ marginTop: '12px', marginBottom: 0 }}>
              Quiz entry is unavailable because chapterNumber is not configured.
            </Paragraph>
          )}
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <span style={{ marginLeft: '16px' }}>Loading {structureName.toLowerCase()} content...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        className="error-container"
      />
    );
  }

  const subtitle = content?.subtitle || `Learn about ${structureName.toLowerCase()}s - theory and key takeaways`;

  return (
    <motion.div 
      className={`data-structure-template ${structureId}-section`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="section-header">
        <div className="section-header-main">
          <div className="header-content">
            <Title level={1} className="section-title">
              <BookOutlined /> {chapterNumber} {structureName}
            </Title>
            <Paragraph className="section-description">
              {subtitle}
            </Paragraph>
          </div>
          {canFavorite && (
            <div className="section-header-favorite">
              <Button
                type="text"
                icon={<StarFilled />}
                loading={favoriteLoading}
                onClick={() => void handleToggleFavorite()}
                className={`section-favorite-btn ${isFavorited ? 'section-favorite-btn-active' : ''}`}
                aria-label={isFavorited ? '取消收藏' : '收藏'}
              />
            </div>
          )}
        </div>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        size="large"
        style={{ marginTop: '24px' }}
      >
        <TabPane 
          tab={<span><BookOutlined />Theory</span>} 
          key="theory"
        >
          {renderTheoryTab()}
        </TabPane>

        <TabPane 
          tab={<span><CheckCircleOutlined />Key Takeaways</span>}
          key="takeaways"
        >
          {renderTakeawaysTab()}
        </TabPane>

        <TabPane
          tab={<span><QuestionCircleOutlined />Quiz</span>} 
          key="quiz"
        >
          {renderQuizTab()}
        </TabPane>
      </Tabs>
    </motion.div>
  );
};

export default TheoryTemplate;
