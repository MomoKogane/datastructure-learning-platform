import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Button, Space, Slider, Typography } from 'antd';
import { PlayCircleOutlined, PauseOutlined, ReloadOutlined } from '@ant-design/icons';
import * as d3 from 'd3';
import type { DataStructure, Operation } from '../../types';
import './Visualization.css';

const { Title, Text } = Typography;

interface VisualizationProps {
  structure: DataStructure;
  operation: Operation | null;
}

type DemoForm = 'array' | 'linked' | 'tree' | 'graph';
type TreeNode = { name: string; children?: TreeNode[] };

type GraphNode = { id: string; label: string; x: number; y: number };
type GraphLink = { source: string; target: string };

const resolveForm = (structure: DataStructure): DemoForm => {
  const id = structure.id.toLowerCase();
  if (id.includes('linked') || id.includes('stack') || id.includes('queue')) return 'linked';
  if (id.includes('tree') || id.includes('heap')) return 'tree';
  if (id.includes('graph')) return 'graph';
  return 'array';
};

const buildGraphLayout = (labels: string[], width: number, height: number): { nodes: GraphNode[]; links: GraphLink[] } => {
  const nodes: GraphNode[] = labels.map((label, index) => ({
    id: `n-${index}`,
    label,
    x: width / 2,
    y: height / 2
  }));

  const links: GraphLink[] = [];
  for (let i = 0; i < nodes.length - 1; i += 1) {
    links.push({ source: nodes[i].id, target: nodes[i + 1].id });
  }
  for (let i = 0; i < nodes.length - 2; i += 2) {
    links.push({ source: nodes[i].id, target: nodes[i + 2].id });
  }

  const simulation = d3
    .forceSimulation(nodes as d3.SimulationNodeDatum[])
    .force('charge', d3.forceManyBody().strength(-190))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force(
      'link',
      d3
        .forceLink(links as Array<d3.SimulationLinkDatum<d3.SimulationNodeDatum>>)
        .id((d: d3.SimulationNodeDatum) => (d as GraphNode).id)
        .distance(90)
        .strength(0.7)
    )
    .force('collision', d3.forceCollide(28));

  simulation.stop();
  for (let i = 0; i < 130; i += 1) {
    simulation.tick();
  }

  return { nodes, links };
};

const Visualization: React.FC<VisualizationProps> = ({ structure, operation }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(55);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState(0);

  const form = resolveForm(structure);
  const labels = useMemo(() => ['10', '25', '3', '47', '18', '92', '15'], []);

  const graphLayout = useMemo(() => {
    return form === 'graph' ? buildGraphLayout(labels, 600, 380) : null;
  }, [form, labels]);

  useEffect(() => {
    const animate = (timestamp: number) => {
      const durationScale = d3.scaleLinear().domain([0, 100]).range([1500, 220]).clamp(true);
      const stepDuration = durationScale(speed);

      if (lastTickRef.current === 0) {
        lastTickRef.current = timestamp;
      }

      const elapsed = timestamp - lastTickRef.current;
      setPhase((timestamp % 1000) / 1000);

      if (isPlaying && elapsed >= stepDuration) {
        setStep((prev) => (prev + 1) % labels.length);
        lastTickRef.current = timestamp;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
      lastTickRef.current = 0;
    };
  }, [isPlaying, labels.length, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const pulse = 0.8 + 0.25 * Math.sin(phase * Math.PI * 2);

    const drawArrow = (x1: number, y1: number, x2: number, y2: number) => {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLength = 8;

      ctx.save();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
      ctx.restore();
    };

    if (form === 'array') {
      const cellWidth = 64;
      const gap = 10;
      const totalWidth = labels.length * cellWidth + (labels.length - 1) * gap;
      const startX = (width - totalWidth) / 2;
      const y = height / 2 - 24;

      labels.forEach((label, index) => {
        const x = startX + index * (cellWidth + gap);
        const highlighted = index === step;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, cellWidth, 48, 8);
        ctx.fillStyle = highlighted ? `rgba(22, 119, 255, ${0.18 * pulse})` : '#f8fafc';
        ctx.fill();
        ctx.strokeStyle = highlighted ? '#1677ff' : '#cbd5e1';
        ctx.lineWidth = highlighted ? 2.2 : 1.1;
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#0f172a';
        ctx.font = '600 14px Microsoft YaHei, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + cellWidth / 2, y + 24);
      });
    } else if (form === 'linked') {
      const nodeW = 92;
      const nodeH = 44;
      const gap = 26;
      const totalWidth = labels.length * nodeW + (labels.length - 1) * gap;
      const startX = (width - totalWidth) / 2;
      const y = height / 2 - nodeH / 2;

      labels.forEach((label, index) => {
        const x = startX + index * (nodeW + gap);
        const highlighted = index === step;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, nodeW, nodeH, 8);
        ctx.fillStyle = highlighted ? `rgba(22, 119, 255, ${0.18 * pulse})` : '#f8fafc';
        ctx.fill();
        ctx.strokeStyle = highlighted ? '#1677ff' : '#93c5fd';
        ctx.lineWidth = highlighted ? 2.3 : 1.2;
        ctx.stroke();

        ctx.strokeStyle = '#93c5fd';
        ctx.beginPath();
        ctx.moveTo(x + nodeW * 0.68, y + 4);
        ctx.lineTo(x + nodeW * 0.68, y + nodeH - 4);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#0f172a';
        ctx.font = '600 14px Microsoft YaHei, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + nodeW * 0.34, y + nodeH / 2);

        if (index < labels.length - 1) {
          drawArrow(x + nodeW + 4, y + nodeH / 2, x + nodeW + gap - 6, y + nodeH / 2);
        }
      });
    } else if (form === 'tree') {
      const rootData: TreeNode = {
        name: labels[0],
        children: [
          {
            name: labels[1],
            children: [{ name: labels[3] }, { name: labels[4] }]
          },
          {
            name: labels[2],
            children: [{ name: labels[5] }, { name: labels[6] }]
          }
        ]
      };

      const root = d3.hierarchy<TreeNode>(rootData);
      d3.tree<TreeNode>().size([width - 120, height - 120])(root);

      root.links().forEach((link) => {
        drawArrow((link.source.x ?? 0) + 60, (link.source.y ?? 0) + 45, (link.target.x ?? 0) + 60, (link.target.y ?? 0) + 27);
      });

      root.descendants().forEach((node, index) => {
        const x = (node.x ?? 0) + 60;
        const y = (node.y ?? 0) + 45;
        const highlighted = index === step % root.descendants().length;

        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fillStyle = highlighted ? `rgba(22, 119, 255, ${0.2 * pulse})` : '#eef2ff';
        ctx.fill();
        ctx.strokeStyle = highlighted ? '#1677ff' : '#818cf8';
        ctx.lineWidth = highlighted ? 2.3 : 1.2;
        ctx.stroke();

        ctx.fillStyle = '#111827';
        ctx.font = '600 13px Microsoft YaHei, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.data.name, x, y);
      });
    } else if (form === 'graph' && graphLayout) {
      const map = new Map(graphLayout.nodes.map((item, index) => [item.id, { ...item, index }]));

      graphLayout.links.forEach((link) => {
        const source = map.get(link.source);
        const target = map.get(link.target);
        if (!source || !target) return;

        const highlighted = source.index === step || target.index === step;
        ctx.strokeStyle = highlighted ? '#1677ff' : '#94a3b8';
        ctx.lineWidth = highlighted ? 2.2 : 1.1;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      });

      graphLayout.nodes.forEach((node, index) => {
        const highlighted = index === step;

        ctx.beginPath();
        ctx.arc(node.x, node.y, 17, 0, Math.PI * 2);
        ctx.fillStyle = highlighted ? `rgba(22, 119, 255, ${0.2 * pulse})` : '#f1f5f9';
        ctx.fill();
        ctx.strokeStyle = highlighted ? '#1677ff' : '#64748b';
        ctx.lineWidth = highlighted ? 2.3 : 1.2;
        ctx.stroke();

        ctx.fillStyle = '#111827';
        ctx.font = '600 12px Microsoft YaHei, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y);
      });
    }
  }, [form, graphLayout, labels, phase, step]);

  const handleReset = () => {
    setIsPlaying(false);
    setStep(0);
  };

  return (
    <div className="visualization-container">
      <Card title={`${structure.name} Visualization Demo (Canvas + D3)`}>
        <div className="visualization-controls">
          <Space wrap>
            <Button
              type="primary"
              icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
              onClick={() => setIsPlaying((prev) => !prev)}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Reset
            </Button>
          </Space>

          <div className="visualization-speed-control">
            <Text>Playback Speed</Text>
            <Slider value={speed} onChange={setSpeed} min={0} max={100} style={{ marginTop: '8px' }} />
          </div>
        </div>

        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width={600}
            height={380}
            className="visualization-canvas"
          />
        </div>

        {operation && (
          <div className="operation-info">
            <Title level={5}>Current Operation: {operation.name}</Title>
            <p>{operation.description}</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Visualization;
