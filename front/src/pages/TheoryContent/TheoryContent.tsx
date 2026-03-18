import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Card, 
  // Divider, 
  Button, 
  Spin, 
  message, 
  Radio, 
  // Checkbox, 
  Space,
  Progress,
  Result,
  List,
  Tag,
  Alert,
  Modal
} from 'antd';
import { 
  BookOutlined, 
  QuestionCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  HomeOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { apiService } from '../../services/api';
import { apiUrl } from '../../config/api';
import { useLearningStore } from '../../store/learningStore';
import { useAuthStore } from '../../store/authStore';
import { isTrackableSectionId } from '../../utils/progressDisplay';
import './TheoryContent.css';

const { Title, Paragraph, Text } = Typography;

interface TheorySection {
  title: string;
  content: string;
  examples: string[];
}

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: number | boolean | string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

interface TheoryContent {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  content: {
    introduction: string;
    sections: TheorySection[];
    keyTakeaways: string[];
  };
}

interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  results: Array<{
    questionId: string;
    question: string;
    userAnswer: unknown;
    correctAnswer: unknown;
    isCorrect: boolean;
    explanation: string;
  }>;
}

interface QuizGenerationMetadata {
  generationMode?: 'local' | 'online';
  provider?: string;
  dataSource?: 'database' | 'builtin';
  sourceMode?: 'teacher-override' | 'default-source';
  classId?: string | null;
  retryCount?: number;
  fallbackReason?: 'llm-unavailable' | 'llm-error' | 'llm-timeout';
  fallbackToLocal?: boolean;
  notice?: string;
  generatedAt?: string;
}

const TheoryContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const useApiData = useLearningStore((state) => state.useApiData);
  const user = useAuthStore((state) => state.user);
  
  const [content, setContent] = useState<TheoryContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'content' | 'quiz' | 'results'>('content');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, unknown>>({});
  const [quizResults, setQuizResults] = useState<QuizResult | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [showDetailedQuestions, setShowDetailedQuestions] = useState(false);
  const [quizGenerationMode, setQuizGenerationMode] = useState<'local' | 'online'>('local');
  const [quizNotice, setQuizNotice] = useState<string>('');
  const [lastGeneratedMode, setLastGeneratedMode] = useState<'local' | 'online' | null>(null);
  const [quizMetadata, setQuizMetadata] = useState<QuizGenerationMetadata | null>(null);

  // 保存测验结果为txt文件
  const saveQuizResults = () => {
    if (!quizResults || !quizQuestions || !content) return;

    const timestamp = new Date().toLocaleString();
    let txtContent = `Data Structures Learning Platform - Quiz Results\n`;
    txtContent += `==============================================\n\n`;
    txtContent += `Chapter: ${content.title}\n`;
    txtContent += `Subtitle: ${content.subtitle}\n`;
    txtContent += `Date: ${timestamp}\n`;
    txtContent += `Score: ${quizResults.score}% (${quizResults.correctAnswers}/${quizResults.totalQuestions})\n\n`;
    
    txtContent += `DETAILED QUESTIONS AND ANSWERS\n`;
    txtContent += `==============================\n\n`;

    quizQuestions.forEach((question, index) => {
      const result = quizResults.results[index];
      txtContent += `Question ${index + 1}:\n`;
      txtContent += `${question.question}\n\n`;
      
      if (question.type === 'multiple-choice' && question.options) {
        question.options.forEach((option, optionIndex) => {
          const letter = String.fromCharCode(65 + optionIndex);
          const isCorrect = question.correctAnswer === optionIndex;
          const isUserAnswer = quizAnswers[question.id] === optionIndex;
          txtContent += `${letter}. ${option}`;
          if (isCorrect) txtContent += ` [CORRECT ANSWER]`;
          if (isUserAnswer) txtContent += ` [YOUR ANSWER]`;
          txtContent += `\n`;
        });
      } else if (question.type === 'true-false') {
        txtContent += `A. True`;
        if (question.correctAnswer === true) txtContent += ` [CORRECT ANSWER]`;
        if (quizAnswers[question.id] === true) txtContent += ` [YOUR ANSWER]`;
        txtContent += `\n`;
        txtContent += `B. False`;
        if (question.correctAnswer === false) txtContent += ` [CORRECT ANSWER]`;
        if (quizAnswers[question.id] === false) txtContent += ` [YOUR ANSWER]`;
        txtContent += `\n`;
      }
      
      txtContent += `\nResult: ${result?.isCorrect ? 'CORRECT' : 'INCORRECT'}\n`;
      txtContent += `Explanation: ${question.explanation}\n`;
      txtContent += `\n${'='.repeat(50)}\n\n`;
    });

    // 创建并下载文件
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quiz-results-${content.id || 'unknown'}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    message.success('Quiz results saved successfully!');
  };

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) {
        console.log('No ID provided for content fetch');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching content for ID:', id);
        setDebugInfo(`Fetching content for ID: ${id}`);

          const result = await apiService.getSectionModules(id);
          setDebugInfo(`API result: success=${result.success}, hasData=${!!result.data}`);

          if (result.success && result.data?.modules.theory) {
            const theoryModule = result.data.modules.theory as {
              introduction?: string;
              sections?: TheorySection[];
            };

            const mappedContent: TheoryContent = {
              id,
              title: `Section ${id}`,
              subtitle: 'Theory Content',
              type: 'theory',
              content: {
                introduction: theoryModule.introduction ?? '',
                sections: Array.isArray(theoryModule.sections) ? theoryModule.sections : [],
                keyTakeaways: Array.isArray(result.data.modules.keyTakeaways)
                  ? (result.data.modules.keyTakeaways as string[])
                  : []
              }
            };

            setContent(mappedContent);
            setDebugInfo('Content loaded successfully');
          } else {
            setDebugInfo('API returned success=false or no data');
          message.error('Failed to load content');
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        setDebugInfo(`Error: ${error}`);
        message.error('Could not connect to backend');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id]);

  useEffect(() => {
    if (user?.role !== 'student' || !id || !isTrackableSectionId(id)) {
      return;
    }

    void apiService.updateStudentSectionProgress(id, { theoryCompleted: true }).catch(() => {
      // no-op
    });
  }, [user?.role, user?.userId, id]);

  const handleGenerateQuiz = async () => {
    if (!content || !id) return;

    if (!useApiData && quizGenerationMode === 'online') {
      Modal.warning({
        title: ' Hardcode mode.',
        content: 'You are in Hardcode mode and cannot generate quizzes online. Please switch to local mode or disable Hardcode mode to generate quizzes online.',
        okText: 'I understand.'
      });
      return;
    }

    try {
      setGeneratingQuiz(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const endpoint = quizGenerationMode === 'online'
        ? apiUrl(`/quizzes/generate-online/${id}`)
        : apiUrl(`/quizzes/generate/${id}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          questionCount: 8,
          difficulty: 'mixed',
          questionTypes: ['multiple-choice', 'true-false']
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setQuizQuestions(result.data.questions);
          setCurrentStep('quiz');
          setQuizAnswers({}); // Reset answers
          const metadata = (result?.data?.metadata || {}) as QuizGenerationMetadata;
          setQuizMetadata(metadata);
          const overrideNotice = quizGenerationMode === 'online' && metadata.sourceMode === 'teacher-override'
            ? '当前教学班已配置教师指定测验，在线模式已优先加载该题组。'
            : '';
          const notice = metadata.notice || overrideNotice;
          setQuizNotice(notice || '');
          setLastGeneratedMode(quizGenerationMode);

          if (quizGenerationMode === 'online' && metadata.sourceMode === 'teacher-override') {
            message.success('已加载教师指定测验题组');
          } else if (quizGenerationMode === 'online' && metadata.fallbackReason === 'llm-timeout') {
            Modal.confirm({
              title: '在线生成超时',
              content: notice || 'GLM 在线生成在限定时间内未返回，建议切换到本地生成模式继续学习。',
              okText: '切换到本地',
              cancelText: '继续在线',
              onOk: () => {
                setQuizGenerationMode('local');
                message.info('已切换到本地生成模式');
              }
            });
          } else if (quizGenerationMode === 'online' && notice) {
            message.warning(notice);
          } else {
            message.success('Quiz generated successfully!');
          }
        } else {
          message.error('Failed to generate quiz');
        }
      } else {
        if (quizGenerationMode === 'online') {
          message.error('Online generation is not available yet');
        } else {
          message.error('Failed to generate quiz');
        }
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      if (quizGenerationMode === 'online') {
        message.error('Online generation request failed');
      } else {
        message.error('Could not generate quiz');
      }
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleQuizAnswerChange = (questionId: string, answer: unknown) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleQuizSubmit = async () => {
    console.log('handleQuizSubmit called');
    if (!quizQuestions.length || !id) {
      console.log('No questions or id, returning');
      return;
    }

    const unansweredQuestions = quizQuestions.filter(
      q => quizAnswers[q.id] === undefined || quizAnswers[q.id] === null
    );

    console.log('Unanswered questions:', unansweredQuestions.length);

    // 如果有未作答的题目，给用户确认选项
    if (unansweredQuestions.length > 0) {
      const shouldSubmit = window.confirm(
        `You have ${unansweredQuestions.length} unanswered question(s). Do you want to submit anyway? Unanswered questions will be marked as incorrect.`
      );
      
      console.log('User confirmed:', shouldSubmit);
      
      if (!shouldSubmit) {
        console.log('User chose not to submit');
        return;
      }
    }

    // 提交测验
    console.log('Proceeding to submit quiz');
    submitQuiz();
  };

  const submitQuiz = async () => {
    console.log('submitQuiz called');
    try {
      setSubmittingQuiz(true);
      console.log('About to send request to:', apiUrl(`/quizzes/submission/${id}`));
      
      const response = await fetch(apiUrl(`/quizzes/submission/${id}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('auth_token')
            ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            : {}),
        },
        body: JSON.stringify({ 
          answers: quizAnswers,
          questions: quizQuestions,
        }),
      });

      console.log('Response received:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Result:', result);
        if (result.success) {
          setQuizResults(result.data);
          setCurrentStep('results');

          if (user?.role === 'student' && id && isTrackableSectionId(id)) {
            const score = Number(result?.data?.score);
            void apiService.updateStudentSectionProgress(id, {
              quizCompleted: true,
              ...(Number.isFinite(score) ? { quizScore: score } : {})
            }).catch(() => {
              // no-op
            });
          }
        } else {
          message.error('Failed to submit quiz');
        }
      } else {
        message.error('Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      message.error('Could not submit quiz');
    } finally {
      console.log('Setting submittingQuiz to false');
      setSubmittingQuiz(false);
    }
  };

  const renderQuizQuestion = (question: QuizQuestion, index: number) => {
    const userAnswer = quizAnswers[question.id];

    if (question.type === 'multiple-choice') {
      return (
        <Card key={question.id} className="quiz-question-card">
          <Title level={5}>Question {index + 1}</Title>
          <Paragraph>{question.question}</Paragraph>
          <Radio.Group
            value={userAnswer}
            onChange={(e) => handleQuizAnswerChange(question.id, e.target.value)}
          >
            <Space direction="vertical">
              {question.options?.map((option, optionIndex) => (
                <Radio key={optionIndex} value={optionIndex}>
                  {String.fromCharCode(65 + optionIndex)}. {option}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </Card>
      );
    } else if (question.type === 'true-false') {
      return (
        <Card key={question.id} className="quiz-question-card">
          <Title level={5}>Question {index + 1}</Title>
          <Paragraph>{question.question}</Paragraph>
          <Radio.Group
            value={userAnswer}
            onChange={(e) => handleQuizAnswerChange(question.id, e.target.value)}
          >
            <Space>
              <Radio value={true}>True</Radio>
              <Radio value={false}>False</Radio>
            </Space>
          </Radio.Group>
        </Card>
      );
    }

    return null;
  };

  const renderQuizResults = () => {
    if (!quizResults) return null;

    const getScoreColor = (score: number) => {
      if (score >= 80) return '#52c41a';
      if (score >= 60) return '#faad14';
      return '#ff4d4f';
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="quiz-result-summary-card">
          <Title level={2}>Quiz Results</Title>
          <Progress
            type="circle"
            percent={quizResults.score}
            strokeColor={getScoreColor(quizResults.score)}
            size={120}
          />
          <div className="quiz-score-summary">
            <Text strong className="quiz-score-text">
              {quizResults.correctAnswers} out of {quizResults.totalQuestions} correct
            </Text>
          </div>
        </Card>

        <Card title="Detailed Results">
          <List
            dataSource={quizResults.results}
            renderItem={(result, index) => (
              <List.Item>
                <div className="result-item-content">
                  <div className="result-item-header">
                    {result.isCorrect ? (
                      <CheckCircleOutlined className="result-icon-correct" />
                    ) : (
                      <CloseCircleOutlined className="result-icon-incorrect" />
                    )}
                    <Text strong>Question {index + 1}</Text>
                  </div>
                  <Paragraph>{result.question}</Paragraph>
                  <div className="result-tags">
                    <Tag color={result.isCorrect ? 'green' : 'red'}>
                      Your Answer: {typeof result.userAnswer === 'boolean' 
                        ? (result.userAnswer ? 'True' : 'False')
                        : String(result.userAnswer ?? '')}
                    </Tag>
                    {!result.isCorrect && (
                      <Tag color="blue">
                        Correct Answer: {typeof result.correctAnswer === 'boolean'
                          ? (result.correctAnswer ? 'True' : 'False')
                          : String(result.correctAnswer ?? '')}
                      </Tag>
                    )}
                  </div>
                  <Text type="secondary">{result.explanation}</Text>
                </div>
              </List.Item>
            )}
          />
        </Card>

        {/* 显示完整题目和答案 */}
        <Card 
          title="Complete Questions with All Options" 
          className="quiz-complete-card"
          extra={
            <Button 
              icon={<EyeOutlined />}
              onClick={() => setShowDetailedQuestions(!showDetailedQuestions)}
            >
              {showDetailedQuestions ? 'Hide' : 'Show'} Details
            </Button>
          }
        >
          {showDetailedQuestions && (
            <List
              dataSource={quizQuestions}
              renderItem={(question, index) => {
                const result = quizResults.results[index];
                const userAnswer = quizAnswers[question.id];
                
                return (
                  <List.Item>
                    <div className="detail-item-content">
                      <div className="detail-item-header">
                        {result?.isCorrect ? (
                          <CheckCircleOutlined className="result-icon-correct" />
                        ) : (
                          <CloseCircleOutlined className="result-icon-incorrect" />
                        )}
                        <Text strong>Question {index + 1}</Text>
                      </div>
                      
                      <Paragraph className="detail-question-text">
                        {question.question}
                      </Paragraph>
                      
                      {question.type === 'multiple-choice' && question.options && (
                        <div className="detail-options">
                          {question.options.map((option, optionIndex) => {
                            const letter = String.fromCharCode(65 + optionIndex);
                            const isCorrect = question.correctAnswer === optionIndex;
                            const isUserAnswer = userAnswer === optionIndex;
                            
                            return (
                              <div key={optionIndex} className="detail-option-row">
                                <Text>
                                  {letter}. {option}
                                  {isCorrect && <Tag color="green" className="tag-spacing-left">Correct</Tag>}
                                  {isUserAnswer && <Tag color="blue" className="tag-spacing-left">Your Answer</Tag>}
                                </Text>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {question.type === 'true-false' && (
                        <div className="detail-options">
                          <div className="detail-option-row">
                            <Text>
                              A. True
                              {question.correctAnswer === true && <Tag color="green" className="tag-spacing-left">Correct</Tag>}
                              {userAnswer === true && <Tag color="blue" className="tag-spacing-left">Your Answer</Tag>}
                            </Text>
                          </div>
                          <div className="detail-option-row">
                            <Text>
                              B. False
                              {question.correctAnswer === false && <Tag color="green" className="tag-spacing-left">Correct</Tag>}
                              {userAnswer === false && <Tag color="blue" className="tag-spacing-left">Your Answer</Tag>}
                            </Text>
                          </div>
                        </div>
                      )}
                      
                      <Text type="secondary" italic>
                        <strong>Explanation:</strong> {question.explanation}
                      </Text>
                    </div>
                  </List.Item>
                );
              }}
            />
          )}
        </Card>

        <div className="quiz-results-actions">
          <Space>
            <Button 
              type="primary" 
              icon={<HomeOutlined />}
              onClick={() => navigate('/catalog')}
            >
              Back to Catalog
            </Button>
            <Button 
              icon={<DownloadOutlined />}
              onClick={saveQuizResults}
              className="save-results-btn"
            >
              Save Results
            </Button>
            <Button 
              onClick={() => {
                setCurrentStep('content');
                setQuizAnswers({});
                setQuizResults(null);
                setQuizQuestions([]);
                setShowDetailedQuestions(false);
              }}
            >
              Review Content
            </Button>
          </Space>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="theory-loading-container">
        <Spin size="large" tip="Loading content..." />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="theory-empty-container">
        <div className="theory-debug-box">
          <strong>Debug Info:</strong> {debugInfo}
        </div>
        <Result
          status="404"
          title="Content Not Found"
          subTitle="The requested theoretical content could not be found."
          extra={
            <Button type="primary" onClick={() => navigate('/catalog')}>
              Back to Catalog
            </Button>
          }
        />
      </div>
    );
  }

  if (currentStep === 'results') {
    return renderQuizResults();
  }

  return (
    <div className="theory-content">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Card className="theory-header-card">
          <div className="theory-header-row">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/catalog')}
              className="theory-back-btn"
            >
              Back
            </Button>
            <BookOutlined className="theory-book-icon" />
            <div>
              <Title level={2} className="theory-main-title">{content.title}</Title>
              <Text type="secondary">{content.subtitle}</Text>
            </div>
          </div>
          
          <div className="theory-header-actions">
            <Space wrap>
              <Button 
                type={currentStep === 'content' ? 'primary' : 'default'}
                icon={<BookOutlined />}
                onClick={() => setCurrentStep('content')}
              >
                Study Content
              </Button>
              <Button 
                type={currentStep === 'quiz' ? 'primary' : 'default'}
                icon={<QuestionCircleOutlined />}
                loading={generatingQuiz}
                onClick={handleGenerateQuiz}
              >
                Generate Quiz
              </Button>
              <Radio.Group
                value={quizGenerationMode}
                onChange={(e) => {
                  const nextMode = e.target.value as 'local' | 'online';

                  setQuizGenerationMode(nextMode);

                  if (quizQuestions.length > 0) {
                    setQuizQuestions([]);
                    setQuizAnswers({});
                    setQuizMetadata(null);
                    setQuizNotice('Generate Quiz mode changed. Please regenerate the quiz.');
                    setCurrentStep('quiz');
                  }
                }}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="local">Local</Radio.Button>
                <Radio.Button value="online">Online</Radio.Button>
              </Radio.Group>
              {/* <Tag color="blue">DB first</Tag>
              <Tag color="purple">Fallback: built-in</Tag> */}
            </Space>
          </div>
        </Card>

        {/* Content or Quiz */}
        {currentStep === 'content' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Introduction */}
            <Card className="theory-intro-card">
              <Title level={3}>Introduction</Title>
              <Paragraph className="theory-intro-text">
                {content.content.introduction}
              </Paragraph>
            </Card>

            {/* Main Sections */}
            {content.content.sections.map((section, index) => (
              <Card key={index} className="theory-section-card">
                <Title level={3}>{section.title}</Title>
                <div className="theory-section-content">
                  {section.content.split('\n').map((paragraph, pIndex) => (
                    <Paragraph
                      key={pIndex}
                      className={paragraph.trim() === '' ? 'section-paragraph section-paragraph-empty' : 'section-paragraph'}
                    >
                      {paragraph.trim() === '' ? '\u00A0' : paragraph}
                    </Paragraph>
                  ))}
                </div>
                
                {section.examples.length > 0 && (
                  <div className="theory-examples">
                    <Title level={5}>Examples:</Title>
                    <List
                      size="small"
                      dataSource={section.examples}
                      renderItem={(example) => (
                        <List.Item>
                          <Text>{example}</Text>
                        </List.Item>
                      )}
                    />
                  </div>
                )}
              </Card>
            ))}

            {/* Key Takeaways */}
            <Card>
              <Title level={3}>Key Takeaways</Title>
              <List
                dataSource={content.content.keyTakeaways}
                renderItem={(takeaway) => (
                  <List.Item>
                    <CheckCircleOutlined className="takeaway-icon" />
                    {takeaway}
                  </List.Item>
                )}
              />
            </Card>
          </motion.div>
        )}

        {currentStep === 'quiz' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* <Card style={{ marginBottom: '24px' }}>
              <Title level={3}>Intelligent Knowledge Test</Title>
              <Paragraph>
                Local mode generates questions from structured content and rules. Online mode
                will use LLM-based generation when available.
              </Paragraph>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Data source priority: database (if available) → built-in chapter bank.
              </Paragraph>
            </Card> */}

            {(quizNotice || (lastGeneratedMode && lastGeneratedMode !== quizGenerationMode)) && (
              <Alert
                className="quiz-alert"
                type="warning"
                showIcon
                message={quizNotice || 'Quiz generation mode changed. Please regenerate the quiz.'}
              />
            )}

            {quizMetadata && (
              <Card className="quiz-metadata-card">
                <Space wrap>
                  <Tag color="blue">Mode: {quizMetadata.generationMode || quizGenerationMode}</Tag>
                  {quizMetadata.provider && <Tag color="geekblue">Provider: {quizMetadata.provider}</Tag>}
                  {quizMetadata.dataSource && <Tag color="purple">Data: {quizMetadata.dataSource}</Tag>}
                  {typeof quizMetadata.retryCount === 'number' && (
                    <Tag color={quizMetadata.retryCount > 0 ? 'orange' : 'green'}>
                      Retries: {quizMetadata.retryCount}
                    </Tag>
                  )}
                  {quizMetadata.fallbackReason && (
                    <Tag color="red">Fallback: {quizMetadata.fallbackReason}</Tag>
                  )}
                </Space>
                {quizMetadata.notice && (
                  <Paragraph type="secondary" className="quiz-metadata-notice">
                    {quizMetadata.notice}
                  </Paragraph>
                )}
              </Card>
            )}

            {quizQuestions.map((question, index) => 
              renderQuizQuestion(question, index)
            )}

            <div className="quiz-actions-center">
              {quizQuestions.length > 0 ? (
                <Button 
                  type="primary" 
                  size="large"
                  loading={submittingQuiz}
                  onClick={handleQuizSubmit}
                >
                  Submit Quiz
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  size="large"
                  loading={generatingQuiz}
                  onClick={handleGenerateQuiz}
                  icon={<QuestionCircleOutlined />}
                >
                  Generate New Quiz
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default TheoryContent;
