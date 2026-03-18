/**
 * 目录页面组件
 * 展示课程章节和内容结构，支持章节选择和内容导航
 */
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Typography, List, Button, Space, Divider, Spin, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOutlined, ArrowRightOutlined, HomeOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { catalogData as fallbackData, type Chapter, type Section } from '../../data/catalog';
import apiService from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { isLocalContentFallbackEnabled } from '../../config/contentSource';
import './Catalog.css';

const { Sider, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const Catalog: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [catalogData, setCatalogData] = useState<Chapter[]>([]);
  const [favoriteSections, setFavoriteSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  // const [forceUpdate, setForceUpdate] = useState(0);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const chapterParam = searchParams.get('chapter');

  // 从后端API获取课程目录和章节映射
  useEffect(() => {
    const fetchCatalogData = async () => {
      const fallbackEnabled = isLocalContentFallbackEnabled();
      try {
        setLoading(true);
        const result = await apiService.getCourseCatalog();
        if (result.success && result.data) {
          setCatalogData(result.data as Chapter[]);
        } else if (fallbackEnabled) {
          message.info('Using offline data - backend connection unavailable (dev fallback)');
          setCatalogData(fallbackData);
        } else {
          setCatalogData([]);
          message.error(result.error || 'Failed to load course catalog');
        }
      } catch (error) {
        console.error('Error fetching catalog data:', error);
        if (fallbackEnabled) {
          message.warning('Could not connect to backend, using offline data (dev fallback)');
          setCatalogData(fallbackData);
        } else {
          setCatalogData([]);
          message.error('Could not connect to backend');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogData();
  }, []);

  useEffect(() => {
    const loadFavorites = async () => {
      if (user?.role !== 'student') {
        return;
      }

      try {
        const result = await apiService.getFavorites();
        if (result.success && result.data) {
          setFavoriteSections(result.data);
        }
      } catch {
        // ignore silently
      }
    };

    void loadFavorites();
  }, [user?.role]);

  useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { from: '/catalog' }, replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!catalogData.length) {
      return;
    }

    if (!chapterParam) {
      setSelectedChapter(null);
      return;
    }

    const matched = catalogData.find(chapter => chapter.id === chapterParam);
    if (matched) {
      setSelectedChapter(matched);
    }
  }, [catalogData, chapterParam]);

  const handleChapterSelect = (chapter: Chapter) => {
    if (!user) {
      navigate('/auth', { state: { from: '/catalog' } });
      return;
    }

    setSelectedChapter(chapter);
    setSearchParams({ chapter: chapter.id }, { replace: true });
  };

  const handleSectionClick = (section: Section, chapterId: string) => {
    if (!user) {
      navigate('/auth', { state: { from: '/catalog' } });
      return;
    }

    navigate(`/structure/${chapterId}/section/${section.id}`);
  };

  const sectionFavoriteKey = (chapterId: string, sectionId: string): string => `${chapterId}:${sectionId}`;

  const handleToggleFavorite = async (chapterId: string, sectionId: string) => {
    if (user?.role !== 'student') {
      return;
    }

    const key = sectionFavoriteKey(chapterId, sectionId);
    try {
      const result = await apiService.toggleFavorite(key);
      if (result.success && result.data) {
        setFavoriteSections(result.data.favoriteSections);
      }
    } catch {
      message.error('收藏更新失败');
    }
  };

  const getChapterOverviewRoute = (chapterId: string): string | null => {
    if (chapterId === 'searching') {
      return '/structure/6';
    }

    if (chapterId === 'sorting') {
      return '/structure/7';
    }

    return null;
  };

  const menuItems = catalogData.map(chapter => ({
    key: chapter.id,
    icon: <BookOutlined />,
    label: chapter.title,
    onClick: () => handleChapterSelect(chapter)
  }));

  if (loading) {
    return (
      <div className="catalog-container catalog-loading-center">
        <Spin size="large" tip="Loading course catalog..." />
      </div>
    );
  }

  return (
    <div className="catalog-container">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="catalog-header">
          <Space>
            <Button 
              icon={<HomeOutlined />} 
              onClick={() => {
                setSelectedChapter(null);
                setSearchParams({}, { replace: true });
                navigate('/');
              }}
              type="text"
            >
              Back to Home
            </Button>
            <Divider type="vertical" />
            <Title level={2} style={{ 
              margin: 0 ,
              textAlign: 'center',
              width: '100%',
              }}>
              Data Structures & Algorithms - Course Catalog
            </Title>
            <Divider type="vertical" />
          </Space>
        </div>
      </motion.div>

      <Layout className="catalog-layout">
        <Sider width={350} className="catalog-sider">
          <div className="catalog-menu-container">
            <Title level={4} className="catalog-menu-title">
              Course Chapters
            </Title>
            <Menu
              mode="inline"
              items={menuItems}
              selectedKeys={selectedChapter ? [selectedChapter.id] : []}
              className="catalog-menu"
            />
          </div>
        </Sider>

        <Content className="catalog-content catalog-content-flex">
          {!selectedChapter ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="catalog-welcome"
            >
              <Card className="welcome-card welcome-card-flex">
                <div className="welcome-content">
                  <BookOutlined className="welcome-icon" />
                  <Title level={3}>Welcome to Data Structures & Algorithms</Title>
                  <Paragraph>
                    This course adopts a systematic teaching approach, 
                    covering core concepts of data structures and classic algorithms. 
                  </Paragraph>
                  <Paragraph>
                    Please select a chapter from the left to start learning.
                  </Paragraph>
                  
                  <div className="system-info">
                    <Title level={5}>System Information</Title>
                    <List size="small" className="system-info-list">
                      <List.Item className="system-info-list-item">
                        <Text strong> Version</Text>
                        <Text>v1.0.0</Text>
                      </List.Item>
                      <Divider type="vertical" />
                      <List.Item style={{ flexDirection: 'column', padding: '8px 0' }}>
                        <Text strong> Last Updated </Text> 
                        <Text> January 2026 </Text>
                      </List.Item>
                      <Divider type="vertical" />
                      <List.Item style={{ flexDirection: 'column', padding: '8px 0' }}>
                        <Text strong> Tech Stack </Text>
                        <Text> React + TypeScript + Ant Design </Text>
                      </List.Item>
                      <Divider type="vertical" />        
                      <List.Item style={{ flexDirection: 'column', padding: '8px 0' }}>
                        <Text strong> Features </Text>
                        <Text> Visualization, Online Programming, Smart Testing </Text>
                      </List.Item>
                    </List>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key={selectedChapter.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="chapter-content"
            >
              <Card className="chapter-card">
                <div className="chapter-header">
                  <div className="chapter-header-main">
                    <div className="chapter-header-text">
                      <Title level={3}>{selectedChapter.title}</Title>
                      <Paragraph className="chapter-description">
                        {selectedChapter.description}
                      </Paragraph>
                    </div>
                    {getChapterOverviewRoute(selectedChapter.id) && (
                      <Button
                        type="primary"
                        icon={<ArrowRightOutlined />}
                        onClick={() => navigate(getChapterOverviewRoute(selectedChapter.id) as string)}
                        className="section-action-btn chapter-overview-btn"
                      >
                        Chapter Overview
                      </Button>
                    )}
                  </div>
                </div>

                <div className="sections-container">
                  <Title level={4}>Chapter Content</Title>
                  <List
                    dataSource={selectedChapter.sections}
                    renderItem={(section) => (
                      <List.Item
                        className="section-item"
                        actions={[
                          ...(user?.role === 'student'
                            ? [
                                <Button
                                  key="favorite"
                                  type="text"
                                  icon={favoriteSections.includes(sectionFavoriteKey(selectedChapter.id, section.id))
                                    ? <StarFilled style={{ color: '#faad14' }} />
                                    : <StarOutlined />}
                                  onClick={() => void handleToggleFavorite(selectedChapter.id, section.id)}
                                >
                                  收藏
                                </Button>
                              ]
                            : []),
                          <Button
                            type="primary"
                            icon={<ArrowRightOutlined />}
                            onClick={() => handleSectionClick(section, selectedChapter.id)}
                            className="section-action-btn"
                          >
                            Start Learning
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          title={<Text strong>{section.title}</Text>}
                          description={section.description}
                        />
                      </List.Item>
                    )}
                  />
                </div>
              </Card>
            </motion.div>
          )}
        </Content>
      </Layout>
    </div>
  );
};

export default Catalog;
