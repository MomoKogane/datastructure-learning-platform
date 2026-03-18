// NOTE: ????? V1 ???????????????????/?????????????
import React from 'react';
import { motion } from 'framer-motion';
import './LinkedListSection.css';

interface LinkedListNode {
  id: number;
  data: number;
  next: number | null;
}

interface LinkedListVisualizationProps {
  nodes: LinkedListNode[];
  animating: boolean;
}

const LinkedListVisualization: React.FC<LinkedListVisualizationProps> = ({ nodes, animating }) => {
  const nodeWidth = 80;
  const nodeHeight = 50;
  const nodeSpacing = 40;
  const arrowLength = 30;

  return (
    <div className="linked-list-visualization">
      <svg 
        width={Math.max(400, (nodeWidth + nodeSpacing + arrowLength) * nodes.length)}
        height={100}
        viewBox={`0 0 ${Math.max(400, (nodeWidth + nodeSpacing + arrowLength) * nodes.length)} 100`}
      >
        {/* Render nodes and arrows */}
        {nodes.map((node, index) => {
          const x = index * (nodeWidth + nodeSpacing + arrowLength);
          const y = 25;

          return (
            <g key={node.id}>
              {/* Node */}
              <motion.g
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Node rectangle */}
                <rect
                  x={x}
                  y={y}
                  width={nodeWidth}
                  height={nodeHeight}
                  fill="#e6f4ff"
                  stroke="#1890ff"
                  strokeWidth={2}
                  rx={8}
                  className={animating ? 'node-animating' : ''}
                />
                
                {/* Data section */}
                <rect
                  x={x}
                  y={y}
                  width={nodeWidth * 0.6}
                  height={nodeHeight}
                  fill="#f0f8ff"
                  stroke="#1890ff"
                  strokeWidth={1}
                  rx={8}
                />
                
                {/* Data value */}
                <text
                  x={x + (nodeWidth * 0.6) / 2}
                  y={y + nodeHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="14"
                  fontWeight="bold"
                  fill="#1890ff"
                >
                  {node.data}
                </text>
                
                {/* Next pointer section */}
                <text
                  x={x + nodeWidth * 0.8}
                  y={y + nodeHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fill="#666"
                >
                  next
                </text>
                
                {/* Node ID label */}
                <text
                  x={x + nodeWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#999"
                >
                  Node {node.id}
                </text>
              </motion.g>

              {/* Arrow to next node */}
              {index < nodes.length - 1 && (
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: (index + 1) * 0.1 }}
                >
                  <line
                    x1={x + nodeWidth}
                    y1={y + nodeHeight / 2}
                    x2={x + nodeWidth + arrowLength}
                    y2={y + nodeHeight / 2}
                    stroke="#52c41a"
                    strokeWidth={2}
                    markerEnd="url(#arrowhead)"
                  />
                </motion.g>
              )}

              {/* NULL pointer for last node */}
              {index === nodes.length - 1 && (
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: (index + 1) * 0.1 }}
                >
                  <line
                    x1={x + nodeWidth}
                    y1={y + nodeHeight / 2}
                    x2={x + nodeWidth + 20}
                    y2={y + nodeHeight / 2}
                    stroke="#ff4d4f"
                    strokeWidth={2}
                  />
                  <text
                    x={x + nodeWidth + 25}
                    y={y + nodeHeight / 2}
                    textAnchor="start"
                    dominantBaseline="middle"
                    fontSize="12"
                    fill="#ff4d4f"
                    fontWeight="bold"
                  >
                    NULL
                  </text>
                </motion.g>
              )}
            </g>
          );
        })}

        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#52c41a"
            />
          </marker>
        </defs>
      </svg>

      {/* Empty list message */}
      {nodes.length === 0 && (
        <div className="empty-list-message">
          <p>Empty linked list - add some nodes to see the visualization!</p>
        </div>
      )}

      {/* Head pointer indicator */}
      {nodes.length > 0 && (
        <div className="head-indicator">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute',
              top: '-10px',
              left: '10px',
              background: '#1890ff',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            HEAD
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LinkedListVisualization;
