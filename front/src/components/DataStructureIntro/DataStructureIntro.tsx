import React from 'react';
import { Modal, Typography, Divider } from 'antd';

const { Title, Paragraph } = Typography;

interface DataStructureIntroProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  introduction: string;
}

const DataStructureIntro: React.FC<DataStructureIntroProps> = ({
  visible,
  onClose,
  title,
  introduction
}) => {
  // Split introduction into paragraphs for better formatting
  const formatIntroduction = (text: string) => {
    return text.split('\n\n').map((paragraph, index) => {
      // Handle bullet points
      if (paragraph.includes('?')) {
        const lines = paragraph.split('\n');
        const header = lines[0];
        const bullets = lines.slice(1).filter(line => line.trim().startsWith('?'));
        
        return (
          <div key={index} style={{ marginBottom: '1rem' }}>
            <Paragraph strong>{header}</Paragraph>
            <ul style={{ marginLeft: '1rem' }}>
              {bullets.map((bullet, i) => (
                <li key={i} style={{ marginBottom: '0.5rem' }}>
                  {bullet.replace('?', '').trim()}
                </li>
              ))}
            </ul>
          </div>
        );
      }
      
      return (
        <Paragraph key={index} style={{ marginBottom: '1rem' }}>
          {paragraph}
        </Paragraph>
      );
    });
  };

  return (
    <Modal
      title={<Title level={3}>{title}</Title>}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      styles={{
        body: {
          maxHeight: '60vh',
          overflowY: 'auto',
          padding: '1.5rem'
        }
      }}
    >
      <Divider />
      <div style={{ lineHeight: '1.6' }}>
        {formatIntroduction(introduction)}
      </div>
    </Modal>
  );
};

export default DataStructureIntro;
