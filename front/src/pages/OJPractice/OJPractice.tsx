import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, List, message, Modal, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import CodeEditor from '../../components/CodeEditor/CodeEditor';
import apiService, { type OjProblem, type OjSubmission, type TeachingClass } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import './OJPractice.css';

const { Title, Paragraph, Text } = Typography;

const compilerOptions: Record<'cpp' | 'java' | 'typescript' | 'python', string[]> = {
  cpp: ['g++', 'clang++', 'gcc', 'clang'],
  java: ['OpenJDK 8', 'OpenJDK 17'],
  typescript: ['TypeScript 5.0 (Node 20)'],
  python: ['python3', 'python', 'py -3']
};

type OjOverrideFormValues = {
  title: string;
  description: string;
  inputDescription: string;
  outputDescription: string;
  sampleInput: string;
  sampleOutput: string;
  dataRange?: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  stackLimitKb: number;
};

const pythonStarterCode = `import sys\n\ndef main():\n    lines = sys.stdin.read().strip().splitlines()\n    print('DEBUG lines:', lines, file=sys.stderr)\n    if len(lines) < 2:\n        print('输入格式错误', file=sys.stderr)\n        return\n    n, k = map(int, lines[0].split())\n    arr = list(map(int, lines[1].split()))\n    # TODO: 实现算法\n    arr.sort(reverse=True)\n    print(arr[k - 1])\n\nif __name__ == "__main__":\n    main()`;

// 自动生成 starterCode，注释带题目标题
function buildStarterCodeWithTitle(title: string) {
  const todo = '// TODO: Write your code here';
  return {
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    ${todo}\n    return 0;\n}`,
    java: `import java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        ${todo}\n    }\n}`,
    typescript: `import * as fs from "fs";
\n\nconst tokens = fs.readFileSync(0, "utf8").trim().split(/\\s+/);
let ptr = 0;
\n\nfunction next(): string {\n  return tokens[ptr++];\n}\n\nfunction main(): void {\n  ${todo}\n}\n\nmain();`,
    python: `import sys\n\ndef main():\n    lines = sys.stdin.read().strip().splitlines()\n    print('DEBUG lines:', lines, file=sys.stderr)\n    if len(lines) < 2:\n        print('输入格式错误', file=sys.stderr)\n        return\n    n, k = map(int, lines[0].split())\n    arr = list(map(int, lines[1].split()))\n    ${todo}\n    arr.sort(reverse=True)\n    print(arr[k - 1])\n\nif __name__ == "__main__":\n    main()`
  };
}

const resolveStarterCodeByLanguage = (
  starterCode: OjProblem['starterCode'],
  language: 'cpp' | 'java' | 'typescript' | 'python'
): string => {
  if (language === 'python') {
    return String(starterCode.python || pythonStarterCode);
  }

  return starterCode[language];
};

const OJPractice: React.FC = () => {
  const navigate = useNavigate();
  const { sectionId = '4.3' } = useParams<{ sectionId: string }>();
  const user = useAuthStore((state) => state.user);

  const [problem, setProblem] = useState<OjProblem | null>(null);
  const [sourceMode, setSourceMode] = useState<'teacher-override' | 'default-source'>('default-source');

  const [language, setLanguage] = useState<'cpp' | 'java' | 'typescript' | 'python'>('cpp');
  const [compiler, setCompiler] = useState('g++');
  const [code, setCode] = useState('');

  const [classes, setClasses] = useState<TeachingClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [overrideForm] = Form.useForm();

  const [submissions, setSubmissions] = useState<OjSubmission[]>([]);
  const [catalogTitleMap, setCatalogTitleMap] = useState<Record<string, string>>({});
  const [panel, setPanel] = useState<'records' | 'code'>('records');
  // 新增：详情弹窗相关 state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentDetail, setCurrentDetail] = useState<string>('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sectionTitle = useMemo(() => catalogTitleMap[sectionId] || `Section ${sectionId}`, [catalogTitleMap, sectionId]);

  useEffect(() => {
    const loadCatalogTitleMap = async () => {
      try {
        const result = await apiService.getCourseCatalog();
        if (!result.success || !result.data) {
          return;
        }

        const map: Record<string, string> = {};
        for (const chapter of result.data as Array<{ sections?: Array<{ id?: string; title?: string }> }>) {
          for (const section of chapter.sections || []) {
            const id = String(section.id || '').trim();
            if (!id) continue;
            map[id] = String(section.title || `Section ${id}`);
          }
        }
        setCatalogTitleMap(map);
      } catch {
        // keep fallback title
      }
    };

    void loadCatalogTitleMap();
  }, []);

  const loadProblem = useCallback(async (classId?: string) => {
    const result = await apiService.getOjProblem(sectionId, classId);
    if (!result.success || !result.data) {
      message.error(result.error || '加载题目失败');
      return;
    }

    const payload = result.data;
    setProblem(payload.problem);
    setSourceMode(payload.sourceMode);

    const defaultLang = payload.problem.defaultLanguage;
    setLanguage(defaultLang);
    setCompiler(compilerOptions[defaultLang][0]);
    setCode(resolveStarterCodeByLanguage(payload.problem.starterCode, defaultLang));

    overrideForm.setFieldsValue({
      title: payload.problem.title,
      description: payload.problem.description,
      inputDescription: payload.problem.inputDescription,
      outputDescription: payload.problem.outputDescription,
      sampleInput: payload.problem.sampleInput,
      sampleOutput: payload.problem.sampleOutput,
      dataRange: payload.problem.dataRange,
      timeLimitMs: payload.problem.constraints.timeLimitMs,
      memoryLimitMb: payload.problem.constraints.memoryLimitMb,
      stackLimitKb: payload.problem.constraints.stackLimitKb,
    });
  }, [sectionId, overrideForm]);

  const loadSubmissions = useCallback(async () => {
    const result = await apiService.getOjSubmissions(sectionId, 30);
    if (result.success && result.data) {
      setSubmissions(result.data);
    }
  }, [sectionId]);

  const loadTeacherClasses = useCallback(async () => {
    if (user?.role !== 'teacher') {
      return;
    }

    const result = await apiService.getClasses();
    if (result.success && result.data) {
      setClasses(result.data);
      if (result.data.length > 0) {
        setSelectedClassId(result.data[0].classId);
      }
    }
  }, [user?.role]);

  useEffect(() => {
    void loadTeacherClasses();
  }, [loadTeacherClasses]);

  useEffect(() => {
    const classId = user?.role === 'teacher' ? selectedClassId : undefined;
    void loadProblem(classId);
    void loadSubmissions();
  }, [sectionId, selectedClassId, user?.role, loadProblem, loadSubmissions]);

  useEffect(() => {
    if (!problem) {
      return;
    }

    setCompiler(compilerOptions[language][0]);
    setCode(resolveStarterCodeByLanguage(problem.starterCode, language));
  }, [language, problem]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await apiService.submitOj(sectionId, { code, language, compiler });
      if (!result.success || !result.data) {
        message.error(result.error || '提交失败');
        return;
      }
      message.success(`提交完成：${result.data.result.status}`);
      setPanel('records');
      await loadSubmissions();
      setFeedbackOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveOverride = async (values: OjOverrideFormValues) => {
    if (!selectedClassId) {
      message.warning('请先选择教学班');
      return;
    }

    // 自动生成 starterCode 注释
    const starterCode = buildStarterCodeWithTitle(values.title);

    const payload: OjProblem = {
      title: values.title,
      description: values.description,
      inputDescription: values.inputDescription,
      outputDescription: values.outputDescription,
      sampleInput: values.sampleInput,
      sampleOutput: values.sampleOutput,
      dataRange: values.dataRange || problem?.dataRange || '',
      constraints: {
        timeLimitMs: Number(values.timeLimitMs),
        memoryLimitMb: Number(values.memoryLimitMb),
        stackLimitKb: Number(values.stackLimitKb)
      },
      testCases: Array.isArray(problem?.testCases) ? problem.testCases : [],
      source: 'custom',
      defaultLanguage: language,
      starterCode
    };

    const result = await apiService.saveOjClassOverride(sectionId, selectedClassId, payload);
    if (!result.success) {
      message.error(result.error || '保存班级覆盖题目失败');
      return;
    }

    message.success('班级自定义题目已保存');
    await loadProblem(selectedClassId);
  };

  const handleResetOverride = async () => {
    if (!selectedClassId) {
      message.warning('请先选择教学班');
      return;
    }

    const result = await apiService.resetOjClassOverride(sectionId, selectedClassId);
    if (!result.success) {
      message.error(result.error || '重置失败');
      return;
    }

    message.success('已恢复默认题目');
    await loadProblem(selectedClassId);
  };

  if (!problem) {
    return <div className="oj-loading">Loading OJ problem...</div>;
  }

  return (
    <div className="oj-container">
      <div className="oj-topbar">
        <div className="oj-topbar-left">
          <Button type="link" onClick={() => navigate(-1)}>← 返回</Button>
        </div>
        <div className="oj-topbar-center">
          <div className="oj-action-bar">
            <Button
              type="default"
              onClick={() => {
                setPanel('records');
                setFeedbackOpen(true);
              }}
            >
              提交记录
            </Button>
            <Button
              type="primary"
              className="oj-action-submit-code"
              onClick={() => {
                setPanel('code');
                setFeedbackOpen(true);
              }}
            >
              提交代码
            </Button>
            <Button type="primary" loading={submitting} onClick={() => void handleSubmit()}>
              提交评测
            </Button>
          </div>
        </div>
        <div className="oj-topbar-right">
          <Title level={4} style={{ margin: 0 }}>{sectionId} {sectionTitle}</Title>
        </div>
      </div>

      <Row gutter={12} className="oj-main-row">
        <Col span={11} className="oj-left-col">
          <Card title={problem.title} extra={<Tag color={sourceMode === 'teacher-override' ? 'orange' : 'blue'}>{sourceMode === 'teacher-override' ? '班级自定义题' : `默认题源：${problem.source}`}</Tag>}>
            <Paragraph>{problem.description}</Paragraph>
            <Title level={5}>输入描述</Title>
            <Paragraph>{problem.inputDescription}</Paragraph>
            <Title level={5}>输出描述</Title>
            <Paragraph>{problem.outputDescription}</Paragraph>

            <Title level={5}>输入样例</Title>
            <Card size="small"><pre>{problem.sampleInput}</pre></Card>
            <Title level={5} style={{ marginTop: 12 }}>输出样例</Title>
            <Card size="small"><pre>{problem.sampleOutput}</pre></Card>

            <Title level={5} style={{ marginTop: 12 }}>数据限制</Title>
            <List
              size="small"
              dataSource={[
                `时间限制: ${problem.constraints.timeLimitMs} ms`,
                `内存限制: ${problem.constraints.memoryLimitMb} MB`,
                `栈限制: ${problem.constraints.stackLimitKb} KB`
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </Card>

          {user?.role === 'teacher' && (
            <Card title="教学班题目调整" style={{ marginTop: 12 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select
                  placeholder="选择教学班"
                  value={selectedClassId}
                  onChange={(value) => setSelectedClassId(value)}
                  options={classes.map((item) => ({ label: `${item.classId} - ${item.name}`, value: item.classId }))}
                />

                <Form form={overrideForm} layout="vertical" onFinish={handleSaveOverride}>
                  <Form.Item name="title" label="题目标题" rules={[{ required: true }]}><Input /></Form.Item>
                  <Form.Item name="description" label="题目描述" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
                  <Form.Item name="inputDescription" label="输入描述"><Input.TextArea rows={2} /></Form.Item>
                  <Form.Item name="outputDescription" label="输出描述"><Input.TextArea rows={2} /></Form.Item>
                  <Form.Item name="sampleInput" label="输入样例"><Input.TextArea rows={2} /></Form.Item>
                  <Form.Item name="sampleOutput" label="输出样例"><Input.TextArea rows={2} /></Form.Item>
                  <Form.Item name="dataRange" label="题目数据范围"><Input.TextArea rows={2} /></Form.Item>
                  <Row gutter={8}>
                    <Col span={8}><Form.Item name="timeLimitMs" label="时间ms"><Input /></Form.Item></Col>
                    <Col span={8}><Form.Item name="memoryLimitMb" label="内存MB"><Input /></Form.Item></Col>
                    <Col span={8}><Form.Item name="stackLimitKb" label="栈KB"><Input /></Form.Item></Col>
                  </Row>
                  <Space>
                    <Button type="primary" htmlType="submit">保存该班题目</Button>
                    <Button onClick={() => void handleResetOverride()}>恢复默认题目</Button>
                  </Space>
                </Form>
              </Space>
            </Card>
          )}
        </Col>

        <Col span={13} className="oj-right-col">
          <Card
            title={
              <Space>
                <Select
                  value={language}
                  onChange={(value) => setLanguage(value)}
                  options={[
                    { label: 'C/C++', value: 'cpp' },
                    { label: 'Java', value: 'java' },
                    { label: 'TypeScript', value: 'typescript' },
                    { label: 'Python', value: 'python' }
                  ]}
                  style={{ width: 120 }}
                />
                <Select
                  value={compiler}
                  onChange={setCompiler}
                  options={compilerOptions[language].map((item) => ({ label: item, value: item }))}
                  style={{ width: 190 }}
                />
              </Space>
            }
          >
            <CodeEditor
              value={code}
              onChange={(value) => setCode(value || '')}
              height="calc(100vh - 280px)"
              language={language}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        open={feedbackOpen}
        title={panel === 'records' ? '提交反馈 - 提交记录' : '提交反馈 - 提交代码'}
        onCancel={() => setFeedbackOpen(false)}
        footer={null}
        width={900}
      >
        {panel === 'records' ? (
          <>
            <Table
              rowKey="_id"
              dataSource={submissions}
              pagination={{ pageSize: 6 }}
              columns={[
                { title: '时间', dataIndex: 'createdAt', render: (value: string) => new Date(value).toLocaleString() },
                { title: '语言', dataIndex: 'language' },
                { title: '状态', render: (_, record) => <Tag color={record.result.status === 'AC' ? 'green' : 'red'}>{record.result.status}</Tag> },
                { title: '耗时(ms)', render: (_, record) => record.result.executionTimeMs },
                { title: '内存(MB)', render: (_, record) => record.result.memoryUsageMb },
                {
                  title: '详情',
                  render: (_, record) => (
                    <Button size="small" onClick={() => {
                      setCurrentDetail(record.result.detail || '无详情');
                      setDetailModalOpen(true);
                    }}>查看详情</Button>
                  )
                }
              ]}
            />
            <Modal
              open={detailModalOpen}
              title="评测详情"
              onCancel={() => setDetailModalOpen(false)}
              footer={null}
              width={700}
            >
              <pre style={{ maxHeight: 400, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#f6f6f6', padding: 12 }}>{currentDetail}</pre>
            </Modal>
          </>
        ) : (
          <Card size="small" title="当前提交代码">
            <pre className="oj-code-preview">{code}</pre>
            <Text type="secondary">当前语言: {language} / 编译器: {compiler}</Text>
          </Card>
        )}
      </Modal>
    </div>
  );
};

export default OJPractice;
