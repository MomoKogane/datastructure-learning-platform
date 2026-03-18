import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout, Card, Typography, Form, Input, Button, Upload, Table, Space, List, message, Modal } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { UploadFile } from 'antd/es/upload/interface';
import apiService, {
  type AuthUser,
  type TeachingClass,
  type SectionProgressRow,
  type OjSubmission,
  type QuizSubmission
} from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { renderCodingProgressDisplay, renderQuizProgressDisplay } from '../../utils/progressDisplay';
import './TeachingClassManage.css';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const TeachingClassManage: React.FC = () => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const user = useAuthStore((state) => state.user);

  const [classes, setClasses] = useState<TeachingClass[]>([]);
  const [students, setStudents] = useState<AuthUser[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [viewProgressOpen, setViewProgressOpen] = useState(false);
  const [viewProgressData, setViewProgressData] = useState<{ student?: AuthUser; rows: SectionProgressRow[] }>({ rows: [] });
  const [viewPracticeOpen, setViewPracticeOpen] = useState(false);
  const [viewPracticeLoading, setViewPracticeLoading] = useState(false);
  const [viewPracticeData, setViewPracticeData] = useState<{ student?: AuthUser; submissions: OjSubmission[] }>({ submissions: [] });
  const [selectedPracticeSubmission, setSelectedPracticeSubmission] = useState<OjSubmission | null>(null);
  const [viewQuizOpen, setViewQuizOpen] = useState(false);
  const [viewQuizLoading, setViewQuizLoading] = useState(false);
  const [viewQuizData, setViewQuizData] = useState<{ student?: AuthUser; submissions: QuizSubmission[] }>({ submissions: [] });
  const [selectedQuizSubmission, setSelectedQuizSubmission] = useState<QuizSubmission | null>(null);
  const [classKeyword, setClassKeyword] = useState('');
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [createClassName, setCreateClassName] = useState('');
  const [createClassFileList, setCreateClassFileList] = useState<UploadFile[]>([]);
  const [renameClassName, setRenameClassName] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);
  const [renamingClass, setRenamingClass] = useState(false);
  const [deletingClass, setDeletingClass] = useState(false);
  const [deleteClassOpen, setDeleteClassOpen] = useState(false);

  const [addStudentForm] = Form.useForm();

  const selectedClass = useMemo(() => classes.find((item) => item.classId === classId), [classes, classId]);
  const filteredClasses = useMemo(() => {
    const keyword = classKeyword.trim().toLowerCase();
    if (!keyword) {
      return classes;
    }
    return classes.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [classes, classKeyword]);

  useEffect(() => {
    setRenameClassName(selectedClass?.name || '');
  }, [selectedClass?.classId, selectedClass?.name]);

  const loadClasses = useCallback(async () => {
    const result = await apiService.getClasses();
    if (result.success && result.data) {
      setClasses(result.data);
      if (!classId && result.data.length > 0) {
        navigate(`/teaching-class/${result.data[0].classId}`, { replace: true });
        return;
      }

      if (classId && !result.data.some((item) => item.classId === classId)) {
        if (result.data.length > 0) {
          navigate(`/teaching-class/${result.data[0].classId}`, { replace: true });
        } else {
          navigate('/teaching-class', { replace: true });
          setStudents([]);
        }
      }
    }
  }, [classId, navigate]);

  const loadStudents = useCallback(async (targetClassId?: string) => {
    if (!targetClassId) {
      setStudents([]);
      return;
    }

    const result = await apiService.getStudents({ classId: targetClassId });
    if (result.success && result.data) {
      setStudents(result.data);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'teacher') {
      message.warning('仅教师可访问教学班管理页面');
      navigate('/personal-space', { replace: true });
      return;
    }

    void loadClasses();
  }, [user?.role, navigate, loadClasses]);

  useEffect(() => {
    void loadStudents(classId);
  }, [classId, loadStudents]);

  const parseRosterFileNames = async (file?: UploadFile): Promise<string[]> => {
    const rawFile = (file?.originFileObj as File | undefined) || (file as unknown as File | undefined);
    const text = rawFile ? await rawFile.text() : '';
    return String(text || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  };

  const resetCreateClassModal = (): void => {
    setCreateClassName('');
    setCreateClassFileList([]);
    setCreateClassOpen(false);
  };

  const handleConfirmCreateClass = async () => {
    const name = createClassName.trim();
    if (!name) {
      message.warning('请输入教学班名称');
      return;
    }

    setCreatingClass(true);
    try {
      const createResult = await apiService.createClass({ name });
      if (!createResult.success || !createResult.data) {
        message.error(createResult.error || '创建失败');
        return;
      }

      let importedCount = 0;
      const names = await parseRosterFileNames(createClassFileList[0]);
      if (names.length > 0) {
        const importResult = await apiService.importStudents(createResult.data.classId, names);
        if (!importResult.success) {
          message.warning(`教学班已创建，但名单导入失败：${importResult.error || '未知错误'}`);
        } else {
          importedCount = importResult.data?.length || 0;
        }
      }

      if (importedCount > 0) {
        message.success(`教学班创建成功：${createResult.data.classId}，已导入${importedCount}名学生`);
      } else {
        message.success(`教学班创建成功：${createResult.data.classId}`);
      }

      await loadClasses();
      navigate(`/teaching-class/${createResult.data.classId}`);
      resetCreateClassModal();
    } finally {
      setCreatingClass(false);
    }
  };

  const handleRenameClass = async () => {
    if (!selectedClass) {
      message.warning('请先选择教学班');
      return;
    }

    const nextName = renameClassName.trim();
    if (!nextName) {
      message.warning('请输入教学班名称');
      return;
    }

    if (nextName === selectedClass.name) {
      return;
    }

    setRenamingClass(true);
    try {
      const result = await apiService.updateClass(selectedClass.classId, { name: nextName });
      if (result.success) {
        message.success('教学班命名已更新');
        await loadClasses();
      } else {
        message.error(result.error || '更新失败');
      }
    } finally {
      setRenamingClass(false);
    }
  };

  const handleDeleteClass = () => {
    if (!selectedClass) {
      message.warning('请先选择教学班');
      return;
    }

    setDeleteClassOpen(true);
  };

  const handleConfirmDeleteClass = async () => {
    if (!selectedClass) {
      setDeleteClassOpen(false);
      return;
    }

    setDeletingClass(true);
    try {
      const result = await apiService.deleteClass(selectedClass.classId);
      if (result.success) {
        message.success('教学班已删除，ID 将在后续创建时自动回收复用');
        setSelectedStudentIds([]);
        setDeleteClassOpen(false);
        await loadClasses();
      } else {
        message.error(result.error || '删除失败');
      }
    } catch (error) {
      message.error((error as Error).message || '删除失败');
    } finally {
      setDeletingClass(false);
    }
  };

  const handleAddStudent = async (values: { name: string }) => {
    if (!classId) {
      message.warning('请先选择教学班');
      return;
    }

    const result = await apiService.createStudent({ name: values.name, classId });
    if (result.success) {
      message.success(`学生创建成功：${result.data?.userId}`);
      addStudentForm.resetFields();
      await loadStudents(classId);
      await loadClasses();
    } else {
      message.error(result.error || '创建失败');
    }
  };

  const handleImportStudents = async (file: UploadFile) => {
    if (!classId) {
      message.warning('请先选择教学班');
      return false;
    }

    try {
      const names = await parseRosterFileNames(file);
      if (names.length === 0) {
        message.warning('名单为空');
        return false;
      }

      const result = await apiService.importStudents(classId, names);
      if (result.success) {
        message.success(`导入成功：${result.data?.length || 0}人`);
        await loadStudents(classId);
        await loadClasses();
      } else {
        message.error(result.error || '导入失败');
      }
    } catch (error) {
      message.error((error as Error).message || '导入失败');
    }

    return false;
  };

  const handleRemoveSelectedStudents = async () => {
    if (!classId) {
      message.warning('请先选择教学班');
      return;
    }

    if (selectedStudentIds.length === 0) {
      message.warning('请先勾选学生');
      return;
    }

    const result = await apiService.removeStudents(classId, selectedStudentIds);
    if (result.success) {
      message.success('移除成功');
      setSelectedStudentIds([]);
      await loadStudents(classId);
      await loadClasses();
    } else {
      message.error(result.error || '移除失败');
    }
  };

  const handleViewStudentInfo = async (student: AuthUser) => {
    const targetClassId = student.classId || classId;
    if (!targetClassId) {
      return;
    }

    const result = await apiService.getStudentProgressInClass(targetClassId, student.userId);
    if (result.success && result.data) {
      setViewProgressData({ student: result.data.student, rows: result.data.rows || [] });
      setViewProgressOpen(true);
    } else {
      message.error(result.error || '查询失败');
    }
  };

  const handleViewPracticeDetail = async (student: AuthUser) => {
    const targetClassId = student.classId || classId;
    if (!targetClassId) {
      return;
    }

    setViewPracticeLoading(true);
    try {
      const result = await apiService.getStudentPracticeSubmissionsInClass(targetClassId, student.userId, { limit: 100 });
      if (result.success && result.data) {
        setViewPracticeData({ student: result.data.student, submissions: result.data.submissions || [] });
        setViewPracticeOpen(true);
      } else {
        message.error(result.error || '查询失败');
      }
    } finally {
      setViewPracticeLoading(false);
    }
  };

  const handleViewQuizDetail = async (student: AuthUser) => {
    const targetClassId = student.classId || classId;
    if (!targetClassId) {
      return;
    }

    setViewQuizLoading(true);
    try {
      const result = await apiService.getStudentQuizSubmissionsInClass(targetClassId, student.userId, { limit: 100 });
      if (result.success && result.data) {
        setViewQuizData({ student: result.data.student, submissions: result.data.submissions || [] });
        setViewQuizOpen(true);
      } else {
        message.error(result.error || '查询失败');
      }
    } finally {
      setViewQuizLoading(false);
    }
  };

  const formatAnswerValue = (value: unknown): string => {
    if (typeof value === 'boolean') {
      return value ? '是' : '否';
    }
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  return (
    <div className="teaching-class-manage-container">
      <Title level={2}>教学班管理</Title>
      <Layout className="teaching-class-manage-layout">
        <Sider width={280} className="teaching-class-manage-sider">
          <Card title="教学班列表" size="small">
            <Input
              value={classKeyword}
              onChange={(event) => setClassKeyword(event.target.value)}
              placeholder="按教学班名称搜索"
            />
            <Button type="primary" block className="teaching-class-create-btn" onClick={() => setCreateClassOpen(true)}>
              新建教学班
            </Button>

            <List
              style={{ marginTop: 16 }}
              dataSource={filteredClasses}
              locale={{ emptyText: classKeyword.trim() ? '未找到匹配教学班' : '暂无教学班' }}
              renderItem={(item) => (
                <List.Item
                  className={item.classId === classId ? 'teaching-class-item-selected' : ''}
                  onClick={() => navigate(`/teaching-class/${item.classId}`)}
                >
                  <div>
                    <div>{item.name}</div>
                    <Text type="secondary">{item.classId}</Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Sider>

        <Content className="teaching-class-manage-content">
          <Card
            title={(
              <div className="teaching-class-info-header">
                <div>{selectedClass ? `班级信息：${selectedClass.name}` : '请选择教学班'}</div>
                <Space>
                  <Input
                    value={renameClassName}
                    onChange={(event) => setRenameClassName(event.target.value)}
                    disabled={!selectedClass}
                    placeholder="教学班名称"
                    className="teaching-class-rename-input"
                  />
                  <Button type="primary" onClick={() => void handleRenameClass()} loading={renamingClass} disabled={!selectedClass}>
                    更新命名
                  </Button>
                  <Button danger onClick={handleDeleteClass} disabled={!selectedClass}>
                    删除教学班
                  </Button>
                </Space>
              </div>
            )}
          >
            {!selectedClass && <Text type="secondary">请选择左侧教学班进行管理。</Text>}
            {selectedClass && (
              <>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Form layout="inline" form={addStudentForm} onFinish={handleAddStudent}>
                    <Form.Item name="name" rules={[{ required: true, message: '请输入学生姓名' }]}>
                      <Input placeholder="输入学生姓名" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit">单独添加学生</Button>
                  </Form>

                  <Space>
                    <Upload maxCount={1} accept=".txt" beforeUpload={handleImportStudents} showUploadList={false}>
                      <Button icon={<UploadOutlined />}>导入名单（UTF-8 txt）</Button>
                    </Upload>
                    <Button danger onClick={() => void handleRemoveSelectedStudents()}>删除选中学生</Button>
                  </Space>
                </Space>

                <Table
                  style={{ marginTop: 16 }}
                  rowKey="userId"
                  dataSource={students}
                  rowSelection={{
                    selectedRowKeys: selectedStudentIds,
                    onChange: (keys) => setSelectedStudentIds(keys as string[])
                  }}
                  columns={[
                    { title: '学生ID', dataIndex: 'userId' },
                    { title: '姓名', dataIndex: 'name' },
                    {
                      title: '操作',
                      render: (_, record) => (
                        <Space>
                          <Button onClick={() => void handleViewStudentInfo(record)}>查看信息</Button>
                          <Button onClick={() => void handleViewQuizDetail(record)}>quiz答题明细</Button>
                          <Button onClick={() => void handleViewPracticeDetail(record)}>practice答题明细</Button>
                        </Space>
                      )
                    }
                  ]}
                />
              </>
            )}
          </Card>
        </Content>
      </Layout>

      <Modal
        open={viewProgressOpen}
        title={`学生信息：${viewProgressData.student?.name || ''} (${viewProgressData.student?.userId || ''})`}
        onCancel={() => setViewProgressOpen(false)}
        footer={null}
        width={820}
      >
        <Table
          rowKey="section"
          dataSource={viewProgressData.rows}
          pagination={false}
          scroll={{ y: 580 }}
          columns={[
            { title: '小节', dataIndex: 'section' },
            { title: '理论', render: (_, record) => (record.theory ? 'y' : '') },
            { title: '测验', render: (_, record) => renderQuizProgressDisplay(record.quiz, record.quizScore) },
            { title: '编程', render: (_, record) => renderCodingProgressDisplay(record.section, record.coding, record.codingJudgeStatus, record.ojVisited) }
          ]}
        />
      </Modal>

      <Modal
        open={viewQuizOpen}
        title={`Quiz答题明细：${viewQuizData.student?.name || ''} (${viewQuizData.student?.userId || ''})`}
        onCancel={() => {
          setViewQuizOpen(false);
          setSelectedQuizSubmission(null);
        }}
        footer={null}
        width={1080}
      >
        <Table
          rowKey="_id"
          dataSource={viewQuizData.submissions}
          loading={viewQuizLoading}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: '提交时间', dataIndex: 'createdAt', render: (value: string) => new Date(value).toLocaleString() },
            { title: '小节', dataIndex: 'sectionId', width: 100 },
            { title: '得分', render: (_, record) => `${record.score}` },
            { title: '正确题数', render: (_, record) => `${record.correctAnswers}/${record.totalQuestions}` },
            {
              title: '操作',
              width: 120,
              render: (_, record) => (
                <Button size="small" onClick={() => setSelectedQuizSubmission(record)}>查看详情</Button>
              )
            }
          ]}
        />
      </Modal>

      <Modal
        open={Boolean(selectedQuizSubmission)}
        title={`Quiz提交详情：${selectedQuizSubmission?.sectionId || ''}`}
        onCancel={() => setSelectedQuizSubmission(null)}
        footer={null}
        width={1120}
      >
        <Table
          rowKey={(record) => `${record.questionId}-${record.question}`}
          dataSource={selectedQuizSubmission?.results || []}
          pagination={false}
          scroll={{ y: 500 }}
          columns={[
            { title: '题号', dataIndex: 'questionId', width: 110 },
            { title: '题目', dataIndex: 'question' },
            { title: '学生答案', render: (_, record) => formatAnswerValue(record.userAnswer), width: 130 },
            { title: '正确答案', render: (_, record) => formatAnswerValue(record.correctAnswer), width: 130 },
            { title: '判定', render: (_, record) => (record.isCorrect ? '正确' : '错误'), width: 90 },
            { title: '解析', dataIndex: 'explanation', width: 220 }
          ]}
        />
      </Modal>

      <Modal
        open={viewPracticeOpen}
        title={`Practice答题明细：${viewPracticeData.student?.name || ''} (${viewPracticeData.student?.userId || ''})`}
        onCancel={() => {
          setViewPracticeOpen(false);
          setSelectedPracticeSubmission(null);
        }}
        footer={null}
        width={1080}
      >
        <Table
          rowKey="_id"
          dataSource={viewPracticeData.submissions}
          loading={viewPracticeLoading}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: '提交时间', dataIndex: 'createdAt', render: (value: string) => new Date(value).toLocaleString() },
            { title: '小节', dataIndex: 'sectionId', width: 100 },
            { title: '语言', dataIndex: 'language', width: 100 },
            { title: '编译器', dataIndex: 'compiler', width: 120 },
            { title: '结果', render: (_, record) => record.result?.status || '', width: 90 },
            { title: '耗时(ms)', render: (_, record) => record.result?.executionTimeMs ?? '-', width: 110 },
            {
              title: '操作',
              width: 120,
              render: (_, record) => (
                <Button size="small" onClick={() => setSelectedPracticeSubmission(record)}>查看详情</Button>
              )
            }
          ]}
        />
      </Modal>

      <Modal
        open={Boolean(selectedPracticeSubmission)}
        title={`Practice提交详情：${selectedPracticeSubmission?.sectionId || ''}`}
        onCancel={() => setSelectedPracticeSubmission(null)}
        footer={null}
        width={1120}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Text>结果：{selectedPracticeSubmission?.result?.status || ''}</Text>
          <Text>耗时：{selectedPracticeSubmission?.result?.executionTimeMs ?? '-'} ms</Text>
          <Text>内存：{selectedPracticeSubmission?.result?.memoryUsageMb ?? '-'} MB</Text>
          <Text>判题详情：</Text>
          <Input.TextArea value={selectedPracticeSubmission?.result?.detail || ''} readOnly autoSize={{ minRows: 3, maxRows: 8 }} />
          <Text>提交代码：</Text>
          <Input.TextArea value={selectedPracticeSubmission?.code || ''} readOnly autoSize={{ minRows: 12, maxRows: 22 }} />
        </Space>
      </Modal>

      <Modal
        open={createClassOpen}
        title="新建教学班"
        onCancel={resetCreateClassModal}
        onOk={() => void handleConfirmCreateClass()}
        okText="新建教学班"
        cancelText="取消"
        confirmLoading={creatingClass}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            value={createClassName}
            onChange={(event) => setCreateClassName(event.target.value)}
            placeholder="教学班名称"
          />
          <Upload
            maxCount={1}
            accept=".txt"
            fileList={createClassFileList}
            beforeUpload={(file) => {
              setCreateClassFileList([file]);
              return false;
            }}
            onRemove={() => {
              setCreateClassFileList([]);
              return true;
            }}
          >
            <Button icon={<UploadOutlined />}>导入名单（可选，仅新建后初始化）</Button>
          </Upload>
        </Space>
      </Modal>

      <Modal
        open={deleteClassOpen}
        title="确认删除该教学班？"
        onCancel={() => setDeleteClassOpen(false)}
        onOk={() => void handleConfirmDeleteClass()}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        confirmLoading={deletingClass}
      >
        <Text>
          教学班 {selectedClass?.name || ''}（{selectedClass?.classId || ''}）删除后，班内学生将解除班级关联。
        </Text>
      </Modal>
    </div>
  );
};

export default TeachingClassManage;
