/**
 * 
 * 这是一个通用的数据结构学习页面模板，模板提供了统一的页面结构和交互体验，适用于所有数据结构章节
 * 
 * 设计目标：
 * 1. 统一的5标签页结构：Theory(理论) / Visualization(可视化) / Examples(代码示例) / Practice(练习) / Test(测试)
 * 2. 一致的样式和交互体验
 * 3. 支持多种编程语言的代码示例
 * 4. 模块化的数据加载和内容管理
 * 5. 响应式设计和良好的用户体验
 * 
 * 使用方式：
 * 1. 为每个数据结构创建独立的页面组件
 * 2. 继承这个模板的结构和样式
 * 3. 根据具体数据结构定制可视化组件和操作
 * 4. 提供对应的理论内容和练习题
 * 
 * 模板参数：
 * - structureId: 数据结构标识符（如 'array', 'linkedlist', 'stack'）
 * - structureName: 数据结构显示名称
 * - dataLoader: 数据加载函数
 * - VisualizationComponent: 可视化组件
 * - operationHandlers: 操作处理函数集合
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Typography, Button, Tabs, Space, Tag, Select, Spin, Alert, message } from 'antd';
import { PlayCircleOutlined, CodeOutlined, BulbOutlined, BookOutlined, QuestionCircleOutlined, StarFilled } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import CodeEditor from '../CodeEditor/CodeEditor';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { isTrackableSectionId } from '../../utils/progressDisplay';
import './DataStructureTemplate.css';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const LANGUAGE_OPTIONS: Array<{ value: ProgrammingLanguage; label: string }> = [
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' }
];

// 支持的编程语言类型
export type ProgrammingLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'c';
type LinkDisplayMode = 'theory' | 'practice' | 'both';

interface PracticeExercise {
  title: string;
  difficulty: string;
  description: string;
  hints: string[];
  solution?: string;
  solutions?: string;
}

interface PracticeExample extends PracticeExercise {
  solutionLanguage?: ProgrammingLanguage;
}

interface PracticeLink {
  title: string;
  url: string;
  platform: string;
  mode?: LinkDisplayMode;
}

// 通用数据结构内容接口
export interface DataStructureContent {
  id: string;
  name: string;
  theory: {
    overview: string;
    concepts: Array<{
      title: string;
      content: string;
      examples?: string[];
    }>;
    complexity: {
      timeComplexity: Record<string, string>;
      spaceComplexity: string;
    };
    relatedLinks?: PracticeLink[];
  };
  visualization: {
    operations: Array<{
      name: string;
      description: string;
      steps: string[];
    }>;
  };
  examples: Record<ProgrammingLanguage, unknown>;
  practice: {
    exercises: PracticeExercise[];
    externalLinks: PracticeLink[];
    sections?: {
      example: PracticeExample;
      thinking: PracticeExercise[];
      programming: PracticeLink[];
    };
  };
}

// 模板属性接口
export interface DataStructureTemplateProps {
  structureId: string;
  structureName: string;
  chapterNumber?: string;
  dataLoader: () => Promise<DataStructureContent>;
  VisualizationComponent: React.ComponentType<Record<string, unknown>>;
  visualizationProps?: Record<string, unknown>;
  hideDefaultVisualizationSteps?: boolean;
  operationControls?: React.ReactNode;
  codeExamples?: {
    [key in ProgrammingLanguage]: {
      basic: string;
      operations: string;
      advanced: string;
    };
  };
}

/**
 * 数据结构页面模板组件
 * 提供标准的5标签页布局和通用功能
 */
const DataStructureTemplate: React.FC<DataStructureTemplateProps> = ({
  structureId,
  structureName,
  chapterNumber = '',
  dataLoader,
  VisualizationComponent,
  visualizationProps = {},
  hideDefaultVisualizationSteps = false,
  operationControls,
  codeExamples
}) => {
  // 状态管理
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>('cpp');
  const [content, setContent] = useState<DataStructureContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { chapterId, sectionId, id } = useParams<{ chapterId?: string; sectionId?: string; id?: string }>();
  const user = useAuthStore((state) => state.user);
  const [favoriteSections, setFavoriteSections] = useState<string[]>([]);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // 支持的编程语言列表
  const languages = LANGUAGE_OPTIONS;

  const hasEffectiveExample = (snippet: unknown): boolean => {
    if (typeof snippet !== 'string') {
      return false;
    }

    const normalized = snippet.trim();
    if (!normalized) {
      return false;
    }

    return !/(placeholder|coming\s+soon|占位|待补充)/i.test(normalized);
  };

  const availableLanguages = useMemo(() => {
    if (!codeExamples) {
      return languages;
    }

    const filtered = languages.filter(({ value }) => {
      const examples = codeExamples[value];
      if (!examples) {
        return false;
      }

      return hasEffectiveExample(examples.basic)
        && hasEffectiveExample(examples.operations)
        && hasEffectiveExample(examples.advanced);
    });

    return filtered.length > 0 ? filtered : languages;
  }, [codeExamples, languages]);

  useEffect(() => {
    if (!availableLanguages.some((lang) => lang.value === selectedLanguage)) {
      setSelectedLanguage(availableLanguages[0].value);
    }
  }, [availableLanguages, selectedLanguage]);

  // 获取初始标签页
  const getInitialTab = () => {
    const hash = location.hash.replace('#', '');
    if (['theory', 'visualization', 'examples', 'practice', 'quiz'].includes(hash)) {
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
  const shouldAppendSystemOjLink = Boolean(progressSectionId);

  // 响应URL hash变化
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (['theory', 'visualization', 'examples', 'practice', 'quiz'].includes(hash)) {
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
        message.success(result.data.toggledOn ? 'favorited' : 'cancelled favorite');
      } else {
        message.error(result.error || 'Failed to toggle favorite');
      }
    } catch {
      message.error('Failed to toggle favorite');
    } finally {
      setFavoriteLoading(false);
    }
  };

  // 加载内容数据
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

  const renderResourceLinkButton = (
    link: PracticeLink,
    index: number,
    keyPrefix: string
  ) => {
    const handleLinkClick = async (): Promise<void> => {
      if (link.url.startsWith('/')) {
        navigate(link.url);
        return;
      }

      window.open(link.url, '_blank', 'noopener,noreferrer');
    };

    const isInternalLink = link.url.startsWith('/');

    if (isInternalLink) {
      return (
        <Button
          key={`${keyPrefix}-${index}`}
          type="link"
          onClick={() => {
            void handleLinkClick().catch(() => {
              message.error('打开链接失败');
            });
          }}
          className="external-link-button"
          block
        >
          <div className="external-link-content">
            <div className="external-link-title">{link.title}</div>
            <div className="external-link-platform">{link.platform}</div>
          </div>
        </Button>
      );
    }

    return (
      <Button
        key={`${keyPrefix}-${index}`}
        type="link"
        onClick={() => {
          void handleLinkClick().catch(() => {
            message.error('打开链接失败');
          });
        }}
        className="external-link-button"
        block
      >
        <div className="external-link-content">
          <div className="external-link-title">{link.title}</div>
          <div className="external-link-platform">{link.platform}</div>
        </div>
      </Button>
    );
  };

  // 渲染理论标签页
  const renderTheoryTab = () => {
    if (!content) return <div>Loading theory content...</div>;

    const relatedLinks = content.theory.relatedLinks ?? [];

    return (
      <div className="theory-content">
        <Title level={3}>{structureName} Theory</Title>
        
        {/* 概述 */}
        <Card title="Overview" className="concept-card">
          <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8' }}>
            {content.theory.overview}
          </div>
        </Card>

        {/* 核心概念 */}
        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
          {content.theory.concepts.map((concept, index) => (
            <Col xs={24} lg={12} key={index}>
              <Card title={concept.title} className="concept-card">
                <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6', marginBottom: '16px' }}>
                  {concept.content}
                </div>
                {concept.examples && (
                  <div>
                    <Text strong>Examples:</Text>
                    <ul style={{ marginTop: '8px' }}>
                      {concept.examples.map((example, i) => (
                        <li key={i}>
                          <Text code>{example}</Text>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>

        {/* 复杂度分析 */}
        <Card title="Time & Space Complexity" style={{ marginTop: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={18}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong>Time Complexity:</Text>
                  <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                    {Object.entries(content.theory.complexity.timeComplexity).map(([operation, complexity]) => (
                      <li key={operation}>
                        {operation.charAt(0).toUpperCase() + operation.slice(1)}: 
                        <Tag color="blue" style={{ marginLeft: '8px' }}>{complexity}</Tag>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <Text strong>Space Complexity: </Text>
                  <Tag color="green">{content.theory.complexity.spaceComplexity}</Tag>
                </div>
              </Space>
            </Col>
          </Row>
        </Card>

        {relatedLinks.length > 0 && (
          <Card title="Related Sections & Resources" style={{ marginTop: '24px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {relatedLinks.map((link, index) => renderResourceLinkButton(link, index, 'theory-link'))}
            </Space>
          </Card>
        )}
      </div>
    );
  };

  // 渲染可视化标签页
  const renderVisualizationTab = () => {
    return (
      <div className="visualization-content">
        <Title level={3}>Interactive {structureName} Visualization</Title>
        
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card title={`${structureName} Structure`} className="visualization-card">
              <VisualizationComponent {...visualizationProps} />
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            {/* 操作控制面板 */}
            {operationControls && (
              <div className="operation-controls">
                {operationControls}
              </div>
            )}
          </Col>
        </Row>

        {/* 操作步骤说明 */}
        {content && !hideDefaultVisualizationSteps && (
          <Card title="Operation Steps" style={{ marginTop: '24px' }}>
            <Row gutter={[16, 16]}>
              {content.visualization.operations.map((op, index) => (
                <Col xs={24} md={12} lg={6} key={index}>
                  <div style={{ padding: '12px', border: '1px solid #f0f0f0', borderRadius: '6px' }}>
                    <Text strong>{op.name}:</Text>
                    <ol style={{ marginLeft: '16px', marginTop: '8px' }}>
                      {op.steps.map((step, i) => (
                        <li key={i} style={{ fontSize: '13px', marginBottom: '4px' }}>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        )}
      </div>
    );
  };

  // 渲染代码示例标签页
  const renderExamplesTab = () => {
    const getCodeForLanguage = (category: 'basic' | 'operations' | 'advanced') => {
      if (codeExamples && codeExamples[selectedLanguage]) {
        return codeExamples[selectedLanguage][category];
      }
      return `// ${structureName} ${category} examples for ${selectedLanguage} - Coming soon...`;
    };

    return (
      <div className="examples-content">
        <Title level={3}>Code Examples</Title>
        
        <div style={{ marginBottom: '20px' }}>
          <Text strong>Select Programming Language: </Text>
          <Select
            value={selectedLanguage}
            onChange={setSelectedLanguage}
            style={{ width: 150, marginLeft: '10px' }}
          >
            {availableLanguages.map(lang => (
              <Option key={lang.value} value={lang.value}>{lang.label}</Option>
            ))}
          </Select>
        </div>

        <Tabs defaultActiveKey="0">
          <TabPane tab={`${structureName} Basics`} key="0">
            <Card>
              <Paragraph>Learn the basic structure and creation of {structureName.toLowerCase()}s</Paragraph>
              <CodeEditor
                value={getCodeForLanguage('basic')}
                language={selectedLanguage}
                readOnly
                height="400px"
              />
            </Card>
          </TabPane>

          <TabPane tab="Basic Operations" key="1">
            <Card>
              <Paragraph>Implement basic {structureName.toLowerCase()} operations</Paragraph>
              <CodeEditor
                value={getCodeForLanguage('operations')}
                language={selectedLanguage}
                readOnly
                height="400px"
              />
            </Card>
          </TabPane>

          <TabPane tab="Advanced Algorithms" key="2">
            <Card>
              <Paragraph>Advanced {structureName.toLowerCase()} algorithms and techniques</Paragraph>
              <CodeEditor
                value={getCodeForLanguage('advanced')}
                language={selectedLanguage}
                readOnly
                height="400px"
              />
            </Card>
          </TabPane>
        </Tabs>
      </div>
    );
  };

  // 渲染练习标签页
  const renderPracticeTab = () => {
    if (!content) return <div>Loading practice content...</div>;

    const practiceSections = content.practice.sections;

    if (!practiceSections) {
      return (
        <div className="practice-content">
          <Title level={3}>Practice</Title>
          <Alert
            type="info"
            showIcon
            message="Practice data is provided by section pages"
            description="This template only renders formatted practice content. Please provide practice.sections from the section page data loader."
          />
        </div>
      );
    }

    const example = practiceSections.example;
    const linksToRender = [...(practiceSections.programming || [])];

    if (shouldAppendSystemOjLink && progressSectionId) {
      const targetOjUrl = `/oj/${progressSectionId}`;
      const existsSystemOjLink = linksToRender.some((link) => link.url === targetOjUrl);
      if (!existsSystemOjLink) {
        linksToRender.push({
          title: 'System Online Judgement Platform',
          url: targetOjUrl,
          platform: 'DSLP OJ'
        });
      }
    }

    return (
      <div className="practice-content">
        <Title level={3}>Practice</Title>
        
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card className="exercise-card" title="Part 1 - Example Problem ">
                <div style={{ marginBottom: '12px' }}>
                  <Space>
                    <Title level={5} style={{ margin: 0 }}>{example.title}</Title>
                    <Tag color={
                      example.difficulty === 'Easy' ? 'green' :
                      example.difficulty === 'Medium' ? 'orange' : 'red'
                    }>
                      {example.difficulty}
                    </Tag>
                  </Space>
                </div>
                <Paragraph>{example.description}</Paragraph>
                <div>
                  <Text strong>Hints:</Text>
                  <ul style={{ marginTop: '8px' }}>
                    {example.hints.map((hint, i) => (
                      <li key={i}>{hint}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <Text strong>Solution:</Text>
                  <CodeEditor
                    value={example.solution ?? example.solutions ?? ''}
                    language={example.solutionLanguage ?? 'javascript'}
                    readOnly
                    height="220px"
                  />
                </div>
              </Card>

              <Card className="exercise-card" title="Part 2 - Thinking Exercises ">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {practiceSections.thinking.map((exercise, index) => (
                    <Card key={`thinking-${index}`} size="small">
                      <div style={{ marginBottom: '8px' }}>
                        <Space>
                          <Text strong>{exercise.title}</Text>
                          <Tag color={
                            exercise.difficulty === 'Easy' ? 'green' :
                            exercise.difficulty === 'Medium' ? 'orange' : 'red'
                          }>
                            {exercise.difficulty}
                          </Tag>
                        </Space>
                      </div>
                      <Paragraph style={{ marginBottom: '8px' }}>{exercise.description}</Paragraph>
                      {exercise.hints.length > 0 && (
                        <div>
                          <Text strong>Hints:</Text>
                          <ul style={{ marginTop: '8px' }}>
                            {exercise.hints.map((hint, i) => (
                              <li key={i}>{hint}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  ))}
                </Space>
              </Card>
            </Space>
          </Col>
          
          <Col xs={24} lg={8}>
            <Card title="Part 3 - Coding Practice">
              {linksToRender.length > 0 ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {linksToRender.map((link, index) => (
                    renderResourceLinkButton(link, index, 'practice-link')
                  ))}
                </Space>
              ) : (
                <Alert
                  type="info"
                  showIcon
                  message="No practice links configured"
                  description="Provide practice links under practice.sections.programming or practice.externalLinks."
                />
              )}
            </Card>

            <Card title="Tips for Success" className="tips-card" style={{ marginTop: '16px' }}>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Practice drawing the data structure</li>
                <li>Understand time and space complexity</li>
                <li>Code the operations step by step</li>
                <li>Test with different input sizes</li>
                <li>Learn the common patterns and applications</li>
              </ul>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // 渲染测试标签页
  const renderQuizTab = () => {
    const quizSectionId = progressSectionId;
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

  // 处理加载状态
  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <span style={{ marginLeft: '16px' }}>Loading {structureName.toLowerCase()} content...</span>
      </div>
    );
  }

  // 处理错误状态
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

  // 主渲染
  return (
    <motion.div 
      className={`data-structure-template ${structureId}-section`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 页面头部 */}
      <div className="section-header">
        <div className="section-header-main">
          <div className="header-content">
            <Title level={1} className="section-title">
              <BookOutlined /> {chapterNumber} {structureName}
            </Title>
            <Paragraph className="section-description">
              Learn about {structureName.toLowerCase()}s - structure, operations, and applications
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

      {/* 主要内容标签页 */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        size="large"
        style={{ marginTop: '24px' }}
      >
        {/* 理论标签页 */}
        <TabPane 
          tab={<span><BookOutlined />Theory</span>} 
          key="theory"
        >
          {renderTheoryTab()}
        </TabPane>

        {/* 可视化标签页 */}
        <TabPane 
          tab={<span><PlayCircleOutlined />Visualization</span>} 
          key="visualization"
        >
          {renderVisualizationTab()}
        </TabPane>

        {/* 代码示例标签页 */}
        <TabPane 
          tab={<span><CodeOutlined />Examples</span>} 
          key="examples"
        >
          {renderExamplesTab()}
        </TabPane>

        {/* 练习标签页 */}
        <TabPane 
          tab={<span><BulbOutlined />Practice</span>} 
          key="practice"
        >
          {renderPracticeTab()}
        </TabPane>

        {/* 测试标签页 */}
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

export default DataStructureTemplate;
