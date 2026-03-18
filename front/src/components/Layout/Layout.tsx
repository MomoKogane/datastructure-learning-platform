import React, { useMemo, useState } from 'react';
import { Layout as AntLayout, Menu, Typography, Button, Drawer, List, Tag, Input } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HomeOutlined, BookOutlined, TranslationOutlined, UserOutlined } from '@ant-design/icons';
import { dictionaryTerms } from '../../data/termDictionary';
import { useAuthStore } from '../../store/authStore';
import './Layout.css';

const { Header, Content, Footer } = AntLayout;
const { Title } = Typography;

const UI_TEXT = {
  dictionaryButton: 'translate dictionary',
  dictionaryTitle: 'Data Structures English-Chinese Dictionary',
  dictionarySearchPlaceholder: 'Enter keyword, support Chinese-English real-time filtering',
  dictionarySortPrefix: 'Sorted by English first letter, total',
  dictionarySortSuffix: ' terms',
  dictionaryEmpty: 'No matching terms found, please try other keywords.'
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [dictionaryKeyword, setDictionaryKeyword] = useState('');

  const handleCloseDictionary = () => {
    setDictionaryOpen(false);
    setDictionaryKeyword('');
  };

  const groupedDictionary = useMemo(() => {
    const normalizedKeyword = dictionaryKeyword.trim().toLowerCase();
    const filtered = !normalizedKeyword
      ? dictionaryTerms
      : dictionaryTerms.filter((item) => {
          const targets = [
            item.english,
            item.chinese,
            item.englishDefinition,
            item.chineseDefinition
          ];

          return targets.some((target) => target.toLowerCase().includes(normalizedKeyword));
        });

    const sorted = [...filtered].sort((a, b) => a.english.localeCompare(b.english, 'en-US'));
    const groups = new Map<string, typeof sorted>();

    for (const item of sorted) {
      const firstChar = item.english.charAt(0).toUpperCase();
      const groupKey = /[A-Z]/.test(firstChar) ? firstChar : '#';
      const existing = groups.get(groupKey) ?? [];
      existing.push(item);
      groups.set(groupKey, existing);
    }

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'en-US'));
  }, [dictionaryKeyword]);

  const handleCatalogClick = () => {
    navigate('/catalog');
  };

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">Home</Link>,
    },
    {
      key: '/catalog',
      icon: <BookOutlined />,
      label: 'Course Catalog',
      onClick: handleCatalogClick,
    },
    ...(user
      ? [{
          key: '/personal-space',
          icon: <UserOutlined />,
          label: <Link to="/personal-space">Personal Space</Link>
        }]
      : [])
  ];

  const selectedMenuKey = location.pathname.startsWith('/personal-space')
    ? '/personal-space'
    : location.pathname.startsWith('/catalog')
      ? '/catalog'
      : location.pathname;

  return (
    <AntLayout className="layout" style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div className="header-title">
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            Data Structures Learning System
          </Title>
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedMenuKey]}
          items={menuItems}
          style={{ flex: 1, border: 'none' }}
        />
        {!user && (
          <>
            <Link to="/auth">
              <Button type="default">Login</Button>
            </Link>
            <Link to="/auth">
              <Button type="primary" className="header-auth-button">Register</Button>
            </Link>
          </>
        )}
        {user && (
          <>
            <Link to="/personal-space">
              <Button>{user.name}(Personal Space)</Button>
            </Link>
            <Button className="header-auth-button" onClick={logout}>Logout</Button>
          </>
        )}
        <Button
          icon={<TranslationOutlined />}
          onClick={() => setDictionaryOpen(true)}
          className="header-dictionary-button"
        >
          {UI_TEXT.dictionaryButton}
        </Button>
      </Header>

      <Drawer
        title={UI_TEXT.dictionaryTitle}
        placement="right"
        width={520}
        open={dictionaryOpen}
        onClose={handleCloseDictionary}
        destroyOnClose
      >
        <Input
          allowClear
          value={dictionaryKeyword}
          onChange={(event) => setDictionaryKeyword(event.target.value)}
          placeholder={UI_TEXT.dictionarySearchPlaceholder}
          className="dictionary-search"
        />
        <div className="dictionary-meta">{UI_TEXT.dictionarySortPrefix} {dictionaryTerms.length} {UI_TEXT.dictionarySortSuffix}</div>
        {groupedDictionary.length === 0 && (
          <Typography.Text type="secondary">{UI_TEXT.dictionaryEmpty}</Typography.Text>
        )}
        {groupedDictionary.map(([group, terms]) => (
          <div key={group} className="dictionary-group">
            <Tag color="blue" className="dictionary-group-tag">{group}</Tag>
            <List
              dataSource={terms}
              renderItem={(term) => (
                <List.Item className="dictionary-item">
                  <div className="dictionary-item-header">
                    <Typography.Text strong>{term.english}</Typography.Text>
                    <Typography.Text type="secondary">{term.chinese}</Typography.Text>
                  </div>
                  <Typography.Paragraph style={{ marginBottom: 6 }}>
                    {term.englishDefinition}
                  </Typography.Paragraph>
                  <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    {term.chineseDefinition}
                  </Typography.Paragraph>
                </List.Item>
              )}
            />
          </div>
        ))}
      </Drawer>
      
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        {children}
      </Content>
      
      {/* <Footer style={{ textAlign: 'center', background: '#fff' }}>
        Data Structures Learning System 
      </Footer> */}

      <Footer style={{ textAlign: 'center', background: '#fff' }}>
        @2025 Created by Shao. All rights reserved.
      </Footer>

    </AntLayout>
  );
};

export default Layout;
