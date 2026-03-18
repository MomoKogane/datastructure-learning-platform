import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Tabs, Form, Input, Button, Select, Typography, message, Space } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import './Auth.css';

const { Title, Text } = Typography;

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [loading, setLoading] = useState(false);
  const [sendingSignupCode, setSendingSignupCode] = useState(false);
  const [sendingResetCode, setSendingResetCode] = useState(false);

  const [teachers, setTeachers] = useState<Array<{ userId: string; name: string }>>([]);
  const [classes, setClasses] = useState<Array<{ classId: string; teacherId: string; name: string }>>([]);

  const [registerForm] = Form.useForm();
  const [resetForm] = Form.useForm();

  const redirectPath = (location.state as { from?: string } | undefined)?.from || '/catalog';
  const selectedRole = Form.useWatch('role', registerForm) as 'teacher' | 'student' | undefined;
  const selectedTeacherId = Form.useWatch('teacherIdSelect', registerForm) as string | undefined;

  const loadSignupOptions = useCallback(async (teacherId?: string) => {
    try {
      const result = await apiService.getSignupOptions(teacherId);
      if (result.success && result.data) {
        setTeachers(result.data.teachers || []);
        setClasses(result.data.classes || []);
      }
    } catch {
      message.error('加载教师/教学班列表失败');
    }
  }, []);

  useEffect(() => {
    void loadSignupOptions();
  }, [loadSignupOptions]);

  useEffect(() => {
    if (selectedTeacherId) {
      void loadSignupOptions(selectedTeacherId);
      registerForm.setFieldValue('classIdSelect', undefined);
    } else {
      void loadSignupOptions();
    }
  }, [selectedTeacherId, registerForm, loadSignupOptions]);

  const selectedTeacherOptions = useMemo(
    () => teachers.map((item) => ({ label: `${item.name}（${item.userId}）`, value: item.userId })),
    [teachers]
  );

  const selectedClassOptions = useMemo(
    () => classes.map((item) => ({ label: `${item.name}（${item.classId}）`, value: item.classId })),
    [classes]
  );

  const handleLogin = async (values: { userId: string; password: string }) => {
    setLoading(true);
    try {
      const result = await apiService.login(values);
      if (!result.success || !result.data) {
        message.error(result.error || '登录失败，请检查账号和密码');
        return;
      }
      setAuth(result.data.token, result.data.user);
      message.success(`欢迎，${result.data.user.name}`);
      navigate(redirectPath, { replace: true });
    } catch {
      message.error('登录失败，请检查账号和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSignupCode = async () => {
    const email = String(registerForm.getFieldValue('email') || '').trim();
    if (!email) {
      message.warning('请先输入邮箱');
      return;
    }

    setSendingSignupCode(true);
    try {
      const result = await apiService.sendEmailCode({ email, purpose: 'signup' });
      if (result.success) {
        message.success('验证码已发送至邮箱，请查收');
      } else {
        message.error(result.error || '验证码发送失败');
      }
    } catch {
      message.error('验证码发送失败');
    } finally {
      setSendingSignupCode(false);
    }
  };

  const handleRegister = async (values: {
    role: 'teacher' | 'student';
    name: string;
    email: string;
    password: string;
    verifyCode: string;
    teacherIdSelect?: string;
    teacherIdInput?: string;
    classIdSelect?: string;
    classIdInput?: string;
  }) => {
    setLoading(true);
    try {
      const teacherId = values.teacherIdInput?.trim() || values.teacherIdSelect;
      const classId = values.classIdInput?.trim() || values.classIdSelect;

      const payload: {
        role: 'teacher' | 'student';
        name: string;
        email: string;
        password: string;
        verifyCode: string;
        teacherId?: string;
        classId?: string;
      } = {
        role: values.role,
        name: values.name,
        email: values.email,
        password: values.password,
        verifyCode: values.verifyCode,
      };

      if (values.role === 'student') {
        payload.teacherId = teacherId;
        payload.classId = classId;
      }

      const result = await apiService.registerTeacherOrStudent(payload);
      if (!result.success || !result.data) {
        message.error(result.error || '注册失败，请重试');
        return;
      }

      const loginResult = await apiService.login({
        userId: result.data.userId,
        password: values.password,
      });

      if (!loginResult.success || !loginResult.data) {
        message.warning(`注册成功（用户ID：${result.data.userId}），但自动登录失败，请手动登录`);
        return;
      }

      setAuth(loginResult.data.token, loginResult.data.user);
      message.success(`注册并登录成功，欢迎 ${loginResult.data.user.name}`);
      navigate('/personal-space', { replace: true });
    } catch {
      message.error('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async () => {
    const email = String(resetForm.getFieldValue('email') || '').trim();
    const userId = String(resetForm.getFieldValue('userId') || '').trim();
    if (!email || !userId) {
      message.warning('请先输入用户ID和邮箱');
      return;
    }

    setSendingResetCode(true);
    try {
      const result = await apiService.sendResetPasswordCode({ email, userId });
      if (result.success) {
        message.success('验证码已发送至邮箱，请查收');
      } else {
        message.error(result.error || '发送失败');
      }
    } catch {
      message.error('发送失败');
    } finally {
      setSendingResetCode(false);
    }
  };

  const handleResetPassword = async (values: {
    email: string;
    userId: string;
    verifyCode: string;
    newPassword: string;
  }) => {
    setLoading(true);
    try {
      const result = await apiService.resetPasswordByEmail(values);
      if (result.success) {
        message.success('密码重置成功，请返回登录');
        resetForm.resetFields();
      } else {
        message.error(result.error || '重置失败');
      }
    } catch {
      message.error('重置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <Title level={3} className="auth-title">账户入口</Title>
        <Tabs
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form layout="vertical" onFinish={handleLogin}>
                  <Form.Item label="用户ID" name="userId" rules={[{ required: true, message: '请输入用户ID' }]}> 
                    <Input placeholder="例如：000 / 2026001 / 202600100000" />
                  </Form.Item>
                  <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}> 
                    <Input.Password placeholder="请输入密码" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading}>登录</Button>
                </Form>
              ),
            },
            {
              key: 'register',
              label: '注册（教师/学生）',
              children: (
                <Form layout="vertical" form={registerForm} onFinish={handleRegister} initialValues={{ role: 'student' }}>
                  <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}> 
                    <Select
                      options={[
                        { label: '学生', value: 'student' },
                        { label: '教师', value: 'teacher' }
                      ]}
                    />
                  </Form.Item>
                  <Form.Item label="帐号昵称" name="name" rules={[{ required: true, message: '请输入昵称' }]}> 
                    <Input />
                  </Form.Item>
                  <Form.Item label="邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}> 
                    <Input />
                  </Form.Item>
                  <Form.Item label="邮箱验证码" required>
                    <Space.Compact style={{ width: '100%' }}>
                      <Form.Item name="verifyCode" noStyle rules={[{ required: true, message: '请输入验证码' }]}> 
                        <Input placeholder="6位验证码" />
                      </Form.Item>
                      <Button onClick={() => void handleSendSignupCode()} loading={sendingSignupCode}>发送验证码</Button>
                    </Space.Compact>
                  </Form.Item>
                  <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}> 
                    <Input.Password />
                  </Form.Item>

                  {selectedRole === 'student' && (
                    <>
                      <Text type="secondary">学生注册需要选择所属教师和教学班（可下拉选择，也可直接输入ID）。</Text>
                      <Form.Item label="教师（下拉）" name="teacherIdSelect">
                        <Select allowClear options={selectedTeacherOptions} placeholder="请选择教师" />
                      </Form.Item>
                      <Form.Item label="教师ID（直接输入）" name="teacherIdInput">
                        <Input placeholder="如：2026001" />
                      </Form.Item>
                      <Form.Item label="教学班（下拉）" name="classIdSelect">
                        <Select allowClear options={selectedClassOptions} placeholder="请选择教学班" />
                      </Form.Item>
                      <Form.Item label="教学班ID（直接输入）" name="classIdInput">
                        <Input placeholder="如：202600100" />
                      </Form.Item>
                    </>
                  )}

                  <Button type="primary" htmlType="submit" block loading={loading}>提交注册</Button>
                </Form>
              ),
            },
            {
              key: 'reset',
              label: '找回密码',
              children: (
                <Form layout="vertical" form={resetForm} onFinish={handleResetPassword}>
                  <Form.Item label="用户ID" name="userId" rules={[{ required: true, message: '请输入用户ID' }]}> 
                    <Input placeholder="例如：202600100001" />
                  </Form.Item>
                  <Form.Item label="绑定邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}> 
                    <Input />
                  </Form.Item>
                  <Form.Item label="邮箱验证码" required>
                    <Space.Compact style={{ width: '100%' }}>
                      <Form.Item name="verifyCode" noStyle rules={[{ required: true, message: '请输入验证码' }]}> 
                        <Input placeholder="6位验证码" />
                      </Form.Item>
                      <Button onClick={() => void handleSendResetCode()} loading={sendingResetCode}>发送验证码</Button>
                    </Space.Compact>
                  </Form.Item>
                  <Form.Item label="新密码" name="newPassword" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码至少6位' }]}> 
                    <Input.Password />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading}>重置密码</Button>
                </Form>
              ),
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default AuthPage;
