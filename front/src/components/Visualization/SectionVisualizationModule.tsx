import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Input, InputNumber, Slider, Space, Tag, Typography } from 'antd';
import { PauseOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import * as d3 from 'd3';
import type { VisualizationFrame, VisualizationModuleData } from '../../utils/visualizationModuleResolver';
import './SectionVisualizationModule.css';

const { Text, Paragraph } = Typography;

interface SectionVisualizationModuleProps {
  data: VisualizationModuleData;
}

type HitRegion = {
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'rect' | 'circle';
  r?: number;
};

type GraphNode = { id: string; label: string; x: number; y: number; index: number };
type GraphLink = { source: string; target: string; weight: number; key: string; fromIndex: number; toIndex: number };
type DirectedWeightedEdge = { from: number; to: number; weight: number };
type NodePoint = { x: number; y: number };

type SimpleTreeNode = {
  value: number;
  left: SimpleTreeNode | null;
  right: SimpleTreeNode | null;
  height: number;
};

const isHiddenTreeLabel = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return normalized.length === 0 || normalized === '__deleted__' || /^(null|nil|none)$/i.test(normalized);
};

const graphEdgeKey = (from: number, to: number): string => `${from}->${to}`;

const buildDirectedWeightedEdges = (nodeCount: number): DirectedWeightedEdge[] => {
  if (nodeCount <= 1) return [];

  const template: DirectedWeightedEdge[] = [
    { from: 0, to: 1, weight: 4 },
    { from: 0, to: 2, weight: 2 },
    { from: 0, to: 3, weight: 7 },
    { from: 1, to: 2, weight: 1 },
    { from: 1, to: 3, weight: 5 },
    { from: 1, to: 4, weight: 6 },
    { from: 2, to: 1, weight: 3 },
    { from: 2, to: 3, weight: 8 },
    { from: 2, to: 4, weight: 10 },
    { from: 2, to: 5, weight: 4 },
    { from: 3, to: 4, weight: 2 },
    { from: 3, to: 5, weight: 6 },
    { from: 4, to: 5, weight: 1 },
    { from: 4, to: 0, weight: 9 },
    { from: 5, to: 0, weight: 7 },
    { from: 5, to: 2, weight: 5 }
  ];

  if (nodeCount >= 6) {
    return template.filter((edge) => edge.from < nodeCount && edge.to < nodeCount);
  }

  const edges: DirectedWeightedEdge[] = [];
  for (let i = 0; i < nodeCount; i += 1) {
    const next = (i + 1) % nodeCount;
    const prev = (i - 1 + nodeCount) % nodeCount;
    edges.push({ from: i, to: next, weight: 2 + ((i * 3) % 7) });
    edges.push({ from: i, to: prev, weight: 3 + ((i * 5) % 7) });
    if (nodeCount > 3) {
      const jump = (i + 2) % nodeCount;
      edges.push({ from: i, to: jump, weight: 4 + ((i * 2) % 5) });
    }
  }

  const dedup = new Map<string, DirectedWeightedEdge>();
  edges.forEach((edge) => {
    const key = graphEdgeKey(edge.from, edge.to);
    const existing = dedup.get(key);
    if (!existing || edge.weight < existing.weight) {
      dedup.set(key, edge);
    }
  });
  return Array.from(dedup.values());
};

const buildGraphLayout = (labels: string[], width: number, height: number): { nodes: GraphNode[]; links: GraphLink[] } => {
  const nodeCount = labels.length;
  const centerX = width / 2;
  const centerY = Math.max(130, height / 2 - 22);
  const radius = Math.min(width, height) * 0.32;

  const nodes: GraphNode[] = labels.map((label, index) => {
    const angle = (-Math.PI / 2) + (index * (2 * Math.PI) / Math.max(1, nodeCount));
    return {
      id: `n-${index}`,
      label,
      index,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });

  const links: GraphLink[] = buildDirectedWeightedEdges(nodeCount).map((edge) => ({
    source: `n-${edge.from}`,
    target: `n-${edge.to}`,
    weight: edge.weight,
    key: graphEdgeKey(edge.from, edge.to),
    fromIndex: edge.from,
    toIndex: edge.to
  }));

  return { nodes, links };
};

const buildGraphAdjacency = (nodeCount: number): Array<Array<{ to: number; weight: number }>> => {
  const adjacency: Array<Array<{ to: number; weight: number }>> = Array.from({ length: nodeCount }, () => []);
  buildDirectedWeightedEdges(nodeCount).forEach((edge) => {
    adjacency[edge.from].push({ to: edge.to, weight: edge.weight });
  });
  adjacency.forEach((row) => row.sort((a, b) => a.to - b.to));
  return adjacency;
};

const buildAccessRuntimeFrames = (nodes: string[], targetIndex: number): VisualizationFrame[] => {
  if (targetIndex < 0 || targetIndex >= nodes.length) {
    return [];
  }

  return [
    {
      label: `定位索引 ${targetIndex}`,
      activeIndices: [targetIndex],
      arrayState: [...nodes]
    },
    {
      label: `读取 arr[${targetIndex}] = ${nodes[targetIndex]}`,
      activeIndices: [targetIndex],
      visitedIndices: [targetIndex],
      arrayState: [...nodes]
    }
  ];
};

const buildModifyRuntimeFrames = (nodes: string[], targetIndex: number, value: string): VisualizationFrame[] => {
  if (targetIndex < 0 || targetIndex >= nodes.length) {
    return [];
  }

  const next = [...nodes];
  next[targetIndex] = value;

  return [
    {
      label: `Locate index ${targetIndex}`,
      activeIndices: [targetIndex],
      arrayState: [...nodes]
    },
    {
      label: `Set arr[${targetIndex}] = ${value}`,
      activeIndices: [targetIndex],
      visitedIndices: [targetIndex],
      arrayState: next
    }
  ];
};

const buildInsertRuntimeFrames = (nodes: string[], targetIndex: number, value: string): VisualizationFrame[] => {
  if (targetIndex < 0 || targetIndex > nodes.length) {
    return [];
  }

  const arr = [...nodes];
  arr.push(arr[arr.length - 1] ?? value);

  const frames: VisualizationFrame[] = [
    {
      label: `在索引 ${targetIndex} 处插入 ${value}`,
      activeIndices: [targetIndex],
      arrayState: [...nodes]
    }
  ];

  for (let j = arr.length - 2; j >= targetIndex; j -= 1) {
    arr[j + 1] = arr[j];
    frames.push({
      label: `右移 a[${j}] -> a[${j + 1}]`,
      swapIndices: [j, j + 1],
      activeIndices: [j, j + 1],
      arrayState: [...arr]
    });
  }

  arr[targetIndex] = value;
  frames.push({
    label: `写入新值 ${value} 到索引 ${targetIndex}`,
    activeIndices: [targetIndex],
    visitedIndices: [targetIndex],
    arrayState: [...arr]
  });

  return frames;
};

const buildDeleteRuntimeFrames = (nodes: string[], targetIndex: number): VisualizationFrame[] => {
  if (targetIndex < 0 || targetIndex >= nodes.length) {
    return [];
  }

  const arr = [...nodes];
  const frames: VisualizationFrame[] = [
    {
      label: `删除索引 ${targetIndex}`,
      activeIndices: [targetIndex],
      arrayState: [...arr]
    }
  ];

  for (let j = targetIndex; j < arr.length - 1; j += 1) {
    arr[j] = arr[j + 1];
    frames.push({
      label: `左移 a[${j + 1}] -> a[${j}]`,
      swapIndices: [j, j + 1],
      activeIndices: [j, j + 1],
      arrayState: [...arr]
    });
  }

  arr.pop();
  frames.push({
    label: '逻辑长度减一',
    activeIndices: [Math.max(0, targetIndex - 1)],
    arrayState: [...arr]
  });

  return frames;
};

const isNullLikeNode = (value: string): boolean => /^(null|nil|none)$/i.test(value.trim());
const toFiniteNumberOrNull = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const isLinkedMarkerNode = (value: string): boolean => /^(head|top|front|rear|null|nil|none)$/i.test(value.trim());
const findMarkerIndex = (nodes: string[], marker: 'top' | 'front' | 'rear' | 'head'): number => {
  const index = nodes.findIndex((item) => item.trim().toLowerCase() === marker);
  return index;
};

const resolveStackTopValueIndex = (nodes: string[]): number => {
  const topIndex = findMarkerIndex(nodes, 'top');
  return topIndex >= 0 ? topIndex + 1 : 0;
};

const resolveQueueFrontValueIndex = (nodes: string[]): number => {
  const frontIndex = findMarkerIndex(nodes, 'front');
  return frontIndex >= 0 ? frontIndex + 1 : 0;
};

const resolveQueueRearInsertIndex = (nodes: string[]): number => {
  const rearIndex = findMarkerIndex(nodes, 'rear');
  return rearIndex >= 0 ? rearIndex : nodes.length;
};

const buildLinkedInsertAfterHeadFrames = (nodes: string[], value: string): VisualizationFrame[] => {
  if (nodes.length === 0) {
    return [];
  }

  const next = [...nodes];
  next.splice(1, 0, value);

  return [
    {
      label: 'Locate head node',
      activeIndices: [0],
      arrayState: [...nodes]
    },
    {
      label: `Insert ${value} after head`,
      activeIndices: [0, 1],
      visitedIndices: [1],
      arrayState: next
    }
  ];
};

const buildLinkedDeleteFromHeadFrames = (nodes: string[]): VisualizationFrame[] => {
  if (nodes.length <= 1 || isNullLikeNode(nodes[1])) {
    return [
      {
        label: 'No deletable node after head',
        activeIndices: [0],
        arrayState: [...nodes]
      }
    ];
  }

  const next = [...nodes];
  const removed = next[1];
  next.splice(1, 1);

  return [
    {
      label: 'Locate first value node after head',
      activeIndices: [0, 1],
      arrayState: [...nodes]
    },
    {
      label: `Delete ${removed} after head`,
      activeIndices: [0],
      visitedIndices: [1],
      arrayState: next
    }
  ];
};

const buildLinkedDeleteCurrentFrames = (nodes: string[], targetIndex: number): VisualizationFrame[] => {
  if (targetIndex <= 0 || targetIndex >= nodes.length || isNullLikeNode(nodes[targetIndex])) {
    return [
      {
        label: 'Invalid current node selection for deletion',
        activeIndices: targetIndex >= 0 && targetIndex < nodes.length ? [targetIndex] : [0],
        arrayState: [...nodes]
      }
    ];
  }

  const next = [...nodes];
  const removed = next[targetIndex];
  next.splice(targetIndex, 1);

  return [
    {
      label: `Locate current node at index ${targetIndex}`,
      activeIndices: [targetIndex],
      arrayState: [...nodes]
    },
    {
      label: `Delete current node ${removed}`,
      activeIndices: [Math.max(0, targetIndex - 1)],
      visitedIndices: [targetIndex],
      arrayState: next
    }
  ];
};

const buildLinkedModifyFrames = (nodes: string[], targetIndex: number, value: string): VisualizationFrame[] => {
  if (
    targetIndex <= 0
    || targetIndex >= nodes.length
    || isNullLikeNode(nodes[targetIndex])
    || isLinkedMarkerNode(nodes[targetIndex])
  ) {
    return [
      {
        label: 'Invalid node selection for modify',
        activeIndices: targetIndex >= 0 && targetIndex < nodes.length ? [targetIndex] : [0],
        arrayState: [...nodes]
      }
    ];
  }

  const next = [...nodes];
  next[targetIndex] = value;

  return [
    {
      label: `Locate node at index ${targetIndex}`,
      activeIndices: [targetIndex],
      arrayState: [...nodes]
    },
    {
      label: `Modify node value to ${value}`,
      activeIndices: [targetIndex],
      visitedIndices: [targetIndex],
      arrayState: next
    }
  ];
};

const buildStackPushFrames = (nodes: string[], value: string): VisualizationFrame[] => {
  const insertIndex = resolveStackTopValueIndex(nodes);
  const next = [...nodes];
  next.splice(insertIndex, 0, value);

  return [
    {
      label: 'Locate stack top position',
      activeIndices: [Math.max(0, insertIndex - 1)],
      arrayState: [...nodes]
    },
    {
      label: `Push ${value} onto stack`,
      activeIndices: [insertIndex],
      visitedIndices: [insertIndex],
      arrayState: next
    }
  ];
};

const buildStackPopFrames = (nodes: string[]): VisualizationFrame[] => {
  const deleteIndex = resolveStackTopValueIndex(nodes);
  if (deleteIndex >= nodes.length || isLinkedMarkerNode(nodes[deleteIndex])) {
    return [
      {
        label: 'Stack is empty, nothing to pop',
        activeIndices: [Math.max(0, deleteIndex - 1)],
        arrayState: [...nodes]
      }
    ];
  }

  const next = [...nodes];
  const removed = next[deleteIndex];
  next.splice(deleteIndex, 1);

  return [
    {
      label: 'Locate stack top value',
      activeIndices: [deleteIndex],
      arrayState: [...nodes]
    },
    {
      label: `Pop ${removed} from stack`,
      activeIndices: [Math.max(0, deleteIndex - 1)],
      visitedIndices: [deleteIndex],
      arrayState: next
    }
  ];
};

const buildQueueEnqueueFrames = (nodes: string[], value: string): VisualizationFrame[] => {
  const insertIndex = resolveQueueRearInsertIndex(nodes);
  const anchorIndex = Math.max(0, insertIndex - 1);
  const next = [...nodes];
  next.splice(insertIndex, 0, value);

  return [
    {
      label: 'Locate queue rear position',
      activeIndices: [anchorIndex],
      arrayState: [...nodes]
    },
    {
      label: `Enqueue ${value} at rear`,
      activeIndices: [insertIndex],
      visitedIndices: [insertIndex],
      arrayState: next
    }
  ];
};

const buildQueueDequeueFrames = (nodes: string[]): VisualizationFrame[] => {
  const deleteIndex = resolveQueueFrontValueIndex(nodes);
  if (deleteIndex >= nodes.length || isLinkedMarkerNode(nodes[deleteIndex])) {
    return [
      {
        label: 'Queue is empty, nothing to dequeue',
        activeIndices: [Math.max(0, deleteIndex - 1)],
        arrayState: [...nodes]
      }
    ];
  }

  const next = [...nodes];
  const removed = next[deleteIndex];
  next.splice(deleteIndex, 1);

  return [
    {
      label: 'Locate queue front value',
      activeIndices: [deleteIndex],
      arrayState: [...nodes]
    },
    {
      label: `Dequeue ${removed} from front`,
      activeIndices: [Math.max(0, deleteIndex - 1)],
      visitedIndices: [deleteIndex],
      arrayState: next
    }
  ];
};

const parseNumericValues = (nodes: string[]): number[] => {
  const values: number[] = [];
  nodes.forEach((node) => {
    const matches = String(node).match(/-?\d+/g);
    if (!matches) return;
    matches.forEach((part) => {
      const num = Number(part);
      if (Number.isFinite(num)) {
        values.push(Math.trunc(num));
      }
    });
  });
  return values;
};

const getStableHashBucketCount = (nodeCount: number): number => {
  return Math.max(5, Math.min(8, Math.ceil(Math.sqrt(Math.max(nodeCount, 1))) + 2));
};

const normalizedModulo = (value: number, mod: number): number => {
  const r = value % mod;
  return r < 0 ? r + mod : r;
};

const buildLinearSearchByValueFrames = (nodes: string[], target: number): VisualizationFrame[] => {
  if (nodes.length === 0) return [];

  const arr = nodes.map((item) => String(item));
  const frames: VisualizationFrame[] = [
    {
      label: `Target = ${target}`,
      activeIndices: [0],
      arrayState: [...arr]
    }
  ];

  for (let i = 0; i < arr.length; i += 1) {
    const current = Number(arr[i]);
    frames.push({
      label: `Compare a[${i}] = ${arr[i]} with ${target}`,
      compareIndices: [i],
      activeIndices: [i],
      arrayState: [...arr]
    });

    if (Number.isFinite(current) && current === target) {
      frames.push({
        label: `Found ${target} at index ${i}`,
        activeIndices: [i],
        visitedIndices: [i],
        arrayState: [...arr]
      });
      return frames;
    }
  }

  frames.push({
    label: `Not found: ${target}`,
    arrayState: [...arr]
  });

  return frames;
};

const buildBinarySearchByValueFrames = (nodes: string[], target: number): VisualizationFrame[] => {
  const nums = parseNumericValues(nodes).sort((a, b) => a - b);
  if (nums.length === 0) return [];

  const arr = nums.map(String);
  const frames: VisualizationFrame[] = [
    {
      label: `Sorted array, target=${target}`,
      arrayState: [...arr],
      activeIndices: [0]
    }
  ];

  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = Number(arr[mid]);
    frames.push({
      label: `Check mid=${mid}, value=${arr[mid]}`,
      compareIndices: [mid],
      activeIndices: [mid],
      arrayState: [...arr]
    });

    if (midValue === target) {
      frames.push({
        label: `Found ${target} at index ${mid}`,
        activeIndices: [mid],
        visitedIndices: [mid],
        arrayState: [...arr]
      });
      return frames;
    }

    if (midValue < target) {
      left = mid + 1;
      frames.push({
        label: `Move left boundary to ${left}`,
        activeIndices: [Math.min(arr.length - 1, left)],
        arrayState: [...arr]
      });
    } else {
      right = mid - 1;
      frames.push({
        label: `Move right boundary to ${right}`,
        activeIndices: [Math.max(0, right)],
        arrayState: [...arr]
      });
    }
  }

  frames.push({
    label: `Not found: ${target}`,
    arrayState: [...arr]
  });

  return frames;
};

const buildHashQueryInsertFrames = (nodes: string[], target: number, bucketCount: number): VisualizationFrame[] => {
  const arr = nodes.map((item) => String(item));
  const bucketIndex = normalizedModulo(target, bucketCount);
  const chainIndices = arr
    .map((item, index) => ({ value: Number(item), index }))
    .filter((item) => Number.isFinite(item.value) && normalizedModulo(item.value, bucketCount) === bucketIndex)
    .map((item) => item.index);

  const frames: VisualizationFrame[] = [
    {
      label: `Hash(${target}) mod ${bucketCount} = ${bucketIndex}`,
      activeIndices: chainIndices.length > 0 ? [chainIndices[0]] : [],
      arrayState: [...arr]
    }
  ];

  for (const index of chainIndices) {
    frames.push({
      label: `Scan chain node ${arr[index]}`,
      activeIndices: [index],
      visitedIndices: [index],
      arrayState: [...arr]
    });
    if (Number(arr[index]) === target) {
      frames.push({
        label: `Found ${target}, no insertion`,
        activeIndices: [index],
        visitedIndices: [index],
        arrayState: [...arr]
      });
      return frames;
    }
  }

  const next = [...arr, String(target)];
  frames.push({
    label: `Not found, append ${target} to bucket ${bucketIndex} tail`,
    activeIndices: [next.length - 1],
    visitedIndices: [next.length - 1],
    arrayState: next
  });

  return frames;
};

const buildHashQueryDeleteFrames = (nodes: string[], target: number, bucketCount: number): VisualizationFrame[] => {
  const arr = nodes.map((item) => String(item));
  const bucketIndex = normalizedModulo(target, bucketCount);
  const chainIndices = arr
    .map((item, index) => ({ value: Number(item), index }))
    .filter((item) => Number.isFinite(item.value) && normalizedModulo(item.value, bucketCount) === bucketIndex)
    .map((item) => item.index);

  const frames: VisualizationFrame[] = [
    {
      label: `Hash(${target}) mod ${bucketCount} = ${bucketIndex}`,
      activeIndices: chainIndices.length > 0 ? [chainIndices[0]] : [],
      arrayState: [...arr]
    }
  ];

  for (const index of chainIndices) {
    frames.push({
      label: `Scan chain node ${arr[index]}`,
      activeIndices: [index],
      visitedIndices: [index],
      arrayState: [...arr]
    });
    if (Number(arr[index]) === target) {
      const next = [...arr];
      next.splice(index, 1);
      frames.push({
        label: `Delete ${target} from bucket ${bucketIndex}`,
        activeIndices: [bucketIndex],
        visitedIndices: [index],
        arrayState: next
      });
      return frames;
    }
  }

  frames.push({
    label: `Not found: ${target}, no deletion`,
    arrayState: [...arr]
  });

  return frames;
};

type TreeState = {
  rootKeys: number[];
  leaves: number[][];
};

const insertSortedUnique = (arr: number[], value: number): boolean => {
  if (arr.includes(value)) return false;
  arr.push(value);
  arr.sort((a, b) => a - b);
  return true;
};

const normalizeTreeValues = (nodes: string[]): number[] => {
  return Array.from(new Set(parseNumericValues(nodes))).sort((a, b) => a - b);
};

const buildBalancedLeaves = (values: number[], minSize: number, maxSize: number): number[][] => {
  if (values.length === 0) return [];

  let leafCount = Math.ceil(values.length / maxSize);
  while (leafCount > 1 && values.length < leafCount * minSize) {
    leafCount -= 1;
  }

  const baseSize = Math.floor(values.length / leafCount);
  let remainder = values.length % leafCount;
  const sizes: number[] = [];

  for (let i = 0; i < leafCount; i += 1) {
    const size = baseSize + (remainder > 0 ? 1 : 0);
    sizes.push(size);
    if (remainder > 0) remainder -= 1;
  }

  const leaves: number[][] = [];
  let cursor = 0;
  sizes.forEach((size) => {
    leaves.push(values.slice(cursor, cursor + size));
    cursor += size;
  });
  return leaves;
};

const buildBTreeState = (values: number[]): TreeState => {
  if (values.length <= 3) {
    return { rootKeys: [...values], leaves: [] };
  }

  let childCount = 2;
  for (let c = 2; c <= 4; c += 1) {
    const childTotal = values.length - (c - 1);
    if (childTotal >= c && childTotal <= c * 3) {
      childCount = c;
      break;
    }
  }

  const childTotal = values.length - (childCount - 1);
  const baseSize = Math.floor(childTotal / childCount);
  let remainder = childTotal % childCount;
  const childSizes: number[] = [];

  for (let i = 0; i < childCount; i += 1) {
    const size = baseSize + (remainder > 0 ? 1 : 0);
    childSizes.push(size);
    if (remainder > 0) remainder -= 1;
  }

  const leaves: number[][] = [];
  const rootKeys: number[] = [];
  let cursor = 0;

  for (let i = 0; i < childCount; i += 1) {
    const child = values.slice(cursor, cursor + childSizes[i]);
    cursor += childSizes[i];
    leaves.push(child);

    if (i < childCount - 1 && cursor < values.length) {
      rootKeys.push(values[cursor]);
      cursor += 1;
    }
  }

  return { rootKeys, leaves };
};

const buildBPlusState = (values: number[]): TreeState => {
  if (values.length <= 3) {
    return { rootKeys: [...values], leaves: [] };
  }

  const leaves = buildBalancedLeaves(values, 2, 3);
  const rootKeys = leaves.slice(1).map((leaf) => leaf[0]);
  return { rootKeys, leaves };
};

const toTreeSnapshot = (state: TreeState, isBPlus: boolean): string[] => {
  if (state.leaves.length === 0) {
    return [isBPlus ? `I:[${state.rootKeys.join('|')}]` : `[${state.rootKeys.join('|')}]`];
  }

  const rootLabel = isBPlus ? `I:[${state.rootKeys.join('|')}]` : `[${state.rootKeys.join('|')}]`;
  const leafLabels = state.leaves.map((leaf) => `${isBPlus ? 'L:' : ''}[${leaf.join('|')}]`);
  return [rootLabel, ...leafLabels];
};

const locateLeafIndex = (state: TreeState, target: number, isBPlus: boolean): number => {
  if (state.leaves.length === 0) {
    return 0;
  }

  if (isBPlus) {
    let idx = 0;
    while (idx < state.rootKeys.length && target >= state.rootKeys[idx]) {
      idx += 1;
    }
    return idx;
  }

  let idx = 0;
  while (idx < state.rootKeys.length && target > state.rootKeys[idx]) {
    idx += 1;
  }
  return idx;
};

const refreshSeparators = (state: TreeState, isBPlus: boolean): void => {
  if (state.leaves.length === 0) {
    return;
  }

  state.rootKeys = isBPlus
    ? state.leaves.slice(1).map((leaf) => leaf[0])
    : state.leaves.slice(0, -1).map((leaf) => leaf[leaf.length - 1]);
};

const ensureRootCollapse = (state: TreeState): void => {
  if (state.leaves.length === 1) {
    state.rootKeys = [...state.leaves[0]];
    state.leaves = [];
  }
};

const flattenTreeValues = (state: TreeState, isBPlus: boolean): number[] => {
  const values = state.leaves.length === 0
    ? [...state.rootKeys]
    : isBPlus
    ? state.leaves.flat()
    : [...state.rootKeys, ...state.leaves.flat()];

  return Array.from(new Set(values)).sort((a, b) => a - b);
};

const applyTreeInsert = (state: TreeState, target: number, isBPlus: boolean): { inserted: boolean; split: boolean; leafIndex: number } => {
  if (!isBPlus) {
    const beforeValues = flattenTreeValues(state, false);
    if (beforeValues.includes(target)) {
      const index = state.leaves.length === 0 ? 0 : locateLeafIndex(state, target, false) + 1;
      return { inserted: false, split: false, leafIndex: index };
    }

    const beforeChildren = state.leaves.length === 0 ? 1 : state.leaves.length;
    const nextValues = [...beforeValues, target].sort((a, b) => a - b);
    const nextState = buildBTreeState(nextValues);
    const afterChildren = nextState.leaves.length === 0 ? 1 : nextState.leaves.length;

    state.rootKeys = [...nextState.rootKeys];
    state.leaves = nextState.leaves.map((leaf) => [...leaf]);

    const split = afterChildren > beforeChildren;
    const leafIndex = state.leaves.length === 0 ? 0 : locateLeafIndex(state, target, false) + 1;
    return { inserted: true, split, leafIndex };
  }

  if (state.leaves.length === 0) {
    const inserted = insertSortedUnique(state.rootKeys, target);
    const split = inserted && state.rootKeys.length > 3;
    if (split) {
      const all = [...state.rootKeys].sort((a, b) => a - b);
      state.leaves = isBPlus ? [[all[0], all[1]], [all[2], all[3]]] : [[all[0], all[1]], [all[2], all[3]]];
      refreshSeparators(state, isBPlus);
    }
    return { inserted, split, leafIndex: split ? 1 : 0 };
  }

  const leafIndex = locateLeafIndex(state, target, isBPlus);
  const leaf = state.leaves[leafIndex];
  const inserted = insertSortedUnique(leaf, target);
  if (!inserted) {
    return { inserted: false, split: false, leafIndex: leafIndex + 1 };
  }

  let split = false;
  if (leaf.length > 3) {
    split = true;
    const mid = Math.ceil(leaf.length / 2);
    const left = leaf.slice(0, mid);
    const right = leaf.slice(mid);
    state.leaves.splice(leafIndex, 1, left, right);
  }

  refreshSeparators(state, isBPlus);
  return { inserted: true, split, leafIndex: leafIndex + 1 };
};

const applyTreeDelete = (state: TreeState, target: number, isBPlus: boolean): { deleted: boolean; rebalanced: boolean; merged: boolean; leafIndex: number } => {
  if (!isBPlus) {
    const beforeValues = flattenTreeValues(state, false);
    if (!beforeValues.includes(target)) {
      const index = state.leaves.length === 0 ? 0 : locateLeafIndex(state, target, false) + 1;
      return { deleted: false, rebalanced: false, merged: false, leafIndex: index };
    }

    const beforeLeafSizes = state.leaves.map((leaf) => leaf.length);
    const beforeChildren = state.leaves.length === 0 ? 1 : state.leaves.length;
    const nextValues = beforeValues.filter((value) => value !== target);
    const nextState = buildBTreeState(nextValues);
    const afterChildren = nextState.leaves.length === 0 ? 1 : nextState.leaves.length;
    const afterLeafSizes = nextState.leaves.map((leaf) => leaf.length);

    state.rootKeys = [...nextState.rootKeys];
    state.leaves = nextState.leaves.map((leaf) => [...leaf]);

    const merged = afterChildren < beforeChildren;
    const redistributed = !merged
      && beforeLeafSizes.length === afterLeafSizes.length
      && beforeLeafSizes.some((size, index) => size !== afterLeafSizes[index]);
    const rebalanced = merged || redistributed;
    const leafIndex = state.leaves.length === 0 ? 0 : locateLeafIndex(state, target, false) + 1;

    return { deleted: true, rebalanced, merged, leafIndex };
  }

  if (state.leaves.length === 0) {
    const index = state.rootKeys.indexOf(target);
    if (index === -1) {
      return { deleted: false, rebalanced: false, merged: false, leafIndex: 0 };
    }
    state.rootKeys.splice(index, 1);
    return { deleted: true, rebalanced: false, merged: false, leafIndex: 0 };
  }

  const minLeafSize = isBPlus ? 2 : 1;
  const leafIndex = locateLeafIndex(state, target, isBPlus);
  const leaf = state.leaves[leafIndex];
  const targetPos = leaf.indexOf(target);
  if (targetPos === -1) {
    return { deleted: false, rebalanced: false, merged: false, leafIndex: leafIndex + 1 };
  }

  leaf.splice(targetPos, 1);

  if (leaf.length >= minLeafSize || state.leaves.length === 1) {
    refreshSeparators(state, isBPlus);
    ensureRootCollapse(state);
    return { deleted: true, rebalanced: false, merged: false, leafIndex: leafIndex + 1 };
  }

  let rebalanced = false;
  let merged = false;
  const leftSibling = leafIndex > 0 ? state.leaves[leafIndex - 1] : null;
  const rightSibling = leafIndex < state.leaves.length - 1 ? state.leaves[leafIndex + 1] : null;

  if (leftSibling && leftSibling.length > minLeafSize) {
    const borrowed = leftSibling.pop() as number;
    leaf.unshift(borrowed);
    leaf.sort((a, b) => a - b);
    rebalanced = true;
  } else if (rightSibling && rightSibling.length > minLeafSize) {
    const borrowed = rightSibling.shift() as number;
    leaf.push(borrowed);
    leaf.sort((a, b) => a - b);
    rebalanced = true;
  } else if (leftSibling) {
    leftSibling.push(...leaf);
    leftSibling.sort((a, b) => a - b);
    state.leaves.splice(leafIndex, 1);
    merged = true;
    rebalanced = true;
  } else if (rightSibling) {
    leaf.push(...rightSibling);
    leaf.sort((a, b) => a - b);
    state.leaves.splice(leafIndex + 1, 1);
    merged = true;
    rebalanced = true;
  }

  refreshSeparators(state, isBPlus);
  ensureRootCollapse(state);
  return { deleted: true, rebalanced, merged, leafIndex: Math.max(1, leafIndex + 1) };
};

const buildTreeQueryInsertFrames = (nodes: string[], target: number, isBPlus: boolean): VisualizationFrame[] => {
  const values = normalizeTreeValues(nodes);
  const state = isBPlus ? buildBPlusState(values) : buildBTreeState(values);
  const beforeSnapshot = toTreeSnapshot(state, isBPlus);
  const leafIndex = state.leaves.length === 0 ? 0 : locateLeafIndex(state, target, isBPlus) + 1;

  const frames: VisualizationFrame[] = [
    {
      label: `Query ${target} from root`,
      activeIndices: [0],
      arrayState: beforeSnapshot
    },
    {
      label: `Descend to target ${isBPlus ? 'leaf' : 'node'} path`,
      activeIndices: [leafIndex],
      arrayState: beforeSnapshot
    }
  ];

  const result = applyTreeInsert(state, target, isBPlus);
  if (!result.inserted) {
    frames.push({
      label: `Found ${target}, no insertion`,
      activeIndices: [result.leafIndex],
      arrayState: beforeSnapshot
    });
    return frames;
  }

  const afterSnapshot = toTreeSnapshot(state, isBPlus);
  frames.push({
    label: `Insert ${target} into target ${isBPlus ? 'leaf' : 'node'}`,
    activeIndices: [result.leafIndex],
    arrayState: beforeSnapshot
  });
  frames.push({
    label: result.split
      ? `Overflow detected: split node${isBPlus ? ' and update separator keys' : ' and promote median key'}`
      : 'No split required',
    activeIndices: result.split ? [0, result.leafIndex] : [result.leafIndex],
    visitedIndices: result.split ? [0] : undefined,
    arrayState: afterSnapshot
  });

  return frames;
};

const buildTreeQueryDeleteFrames = (nodes: string[], target: number, isBPlus: boolean): VisualizationFrame[] => {
  const values = normalizeTreeValues(nodes);
  const state = isBPlus ? buildBPlusState(values) : buildBTreeState(values);
  const beforeSnapshot = toTreeSnapshot(state, isBPlus);
  const leafIndex = state.leaves.length === 0 ? 0 : locateLeafIndex(state, target, isBPlus) + 1;

  const frames: VisualizationFrame[] = [
    {
      label: `Query ${target} from root`,
      activeIndices: [0],
      arrayState: beforeSnapshot
    },
    {
      label: `Descend to target ${isBPlus ? 'leaf' : 'node'} path`,
      activeIndices: [leafIndex],
      arrayState: beforeSnapshot
    }
  ];

  const result = applyTreeDelete(state, target, isBPlus);
  if (!result.deleted) {
    frames.push({
      label: `Not found: ${target}, no deletion`,
      activeIndices: [result.leafIndex],
      arrayState: beforeSnapshot
    });
    return frames;
  }

  const afterSnapshot = toTreeSnapshot(state, isBPlus);
  frames.push({
    label: `Delete ${target} from target ${isBPlus ? 'leaf' : 'node'}`,
    activeIndices: [result.leafIndex],
    arrayState: beforeSnapshot
  });
  frames.push({
    label: result.rebalanced
      ? result.merged
        ? `Underflow detected: merge nodes${isBPlus ? ' and refresh separators' : ' and pull parent separator'}`
        : 'Underflow detected: redistribute with sibling'
      : 'No merge required',
    activeIndices: result.rebalanced ? [0, result.leafIndex] : [result.leafIndex],
    visitedIndices: result.rebalanced ? [0] : undefined,
    arrayState: afterSnapshot
  });

  return frames;
};

const toVisibleNumericValues = (nodes: string[]): number[] => nodes
  .filter((item) => !isHiddenTreeLabel(item))
  .map((item) => Number(item))
  .filter((item) => Number.isFinite(item))
  .map((item) => Math.trunc(item));

const createSimpleNode = (value: number): SimpleTreeNode => ({ value, left: null, right: null, height: 1 });

const nodeHeight = (node: SimpleTreeNode | null): number => (node ? node.height : 0);

const refreshHeight = (node: SimpleTreeNode | null): void => {
  if (!node) return;
  node.height = Math.max(nodeHeight(node.left), nodeHeight(node.right)) + 1;
};

const rotateLeftSimple = (node: SimpleTreeNode): SimpleTreeNode => {
  const right = node.right as SimpleTreeNode;
  const moved = right.left;
  right.left = node;
  node.right = moved;
  refreshHeight(node);
  refreshHeight(right);
  return right;
};

const rotateRightSimple = (node: SimpleTreeNode): SimpleTreeNode => {
  const left = node.left as SimpleTreeNode;
  const moved = left.right;
  left.right = node;
  node.left = moved;
  refreshHeight(node);
  refreshHeight(left);
  return left;
};

const bstInsert = (root: SimpleTreeNode | null, value: number): SimpleTreeNode => {
  if (!root) return createSimpleNode(value);
  if (value < root.value) root.left = bstInsert(root.left, value);
  else if (value > root.value) root.right = bstInsert(root.right, value);
  refreshHeight(root);
  return root;
};

const maxNode = (root: SimpleTreeNode): SimpleTreeNode => {
  let current: SimpleTreeNode = root;
  while (current.right) current = current.right;
  return current;
};

const minNode = (root: SimpleTreeNode): SimpleTreeNode => {
  let current: SimpleTreeNode = root;
  while (current.left) current = current.left;
  return current;
};

const bstDeletePreferPred = (root: SimpleTreeNode | null, value: number): SimpleTreeNode | null => {
  if (!root) return null;
  if (value < root.value) {
    root.left = bstDeletePreferPred(root.left, value);
    refreshHeight(root);
    return root;
  }
  if (value > root.value) {
    root.right = bstDeletePreferPred(root.right, value);
    refreshHeight(root);
    return root;
  }

  if (!root.left && !root.right) return null;
  if (root.left) {
    const pred = maxNode(root.left);
    root.value = pred.value;
    root.left = bstDeletePreferPred(root.left, pred.value);
    refreshHeight(root);
    return root;
  }
  if (root.right) {
    const succ = minNode(root.right);
    root.value = succ.value;
    root.right = bstDeletePreferPred(root.right, succ.value);
    refreshHeight(root);
    return root;
  }

  return null;
};

const avlRebalance = (node: SimpleTreeNode): SimpleTreeNode => {
  refreshHeight(node);
  const balance = nodeHeight(node.left) - nodeHeight(node.right);
  if (balance > 1) {
    if (node.left && nodeHeight(node.left.left) < nodeHeight(node.left.right)) {
      node.left = rotateLeftSimple(node.left);
    }
    return rotateRightSimple(node);
  }
  if (balance < -1) {
    if (node.right && nodeHeight(node.right.right) < nodeHeight(node.right.left)) {
      node.right = rotateRightSimple(node.right);
    }
    return rotateLeftSimple(node);
  }
  return node;
};

const avlInsert = (root: SimpleTreeNode | null, value: number): SimpleTreeNode => {
  if (!root) return createSimpleNode(value);
  if (value < root.value) root.left = avlInsert(root.left, value);
  else if (value > root.value) root.right = avlInsert(root.right, value);
  return avlRebalance(root);
};

const avlDelete = (root: SimpleTreeNode | null, value: number): SimpleTreeNode | null => {
  if (!root) return null;
  if (value < root.value) root.left = avlDelete(root.left, value);
  else if (value > root.value) root.right = avlDelete(root.right, value);
  else {
    if (!root.left && !root.right) return null;
    if (root.left) {
      const pred = maxNode(root.left);
      root.value = pred.value;
      root.left = avlDelete(root.left, pred.value);
    } else if (root.right) {
      const succ = minNode(root.right);
      root.value = succ.value;
      root.right = avlDelete(root.right, succ.value);
    }
  }
  return avlRebalance(root);
};

const findPath = (root: SimpleTreeNode | null, target: number): number[] => {
  const path: number[] = [];
  let current = root;
  while (current) {
    path.push(current.value);
    if (target === current.value) break;
    current = target < current.value ? current.left : current.right;
  }
  return path;
};

const treeToArrayState = (root: SimpleTreeNode | null): string[] => {
  if (!root) return [];
  const state: string[] = [];
  const queue: Array<{ node: SimpleTreeNode; index: number }> = [{ node: root, index: 0 }];
  let maxIndex = 0;
  while (queue.length > 0) {
    const current = queue.shift() as { node: SimpleTreeNode; index: number };
    maxIndex = Math.max(maxIndex, current.index);
    state[current.index] = String(current.node.value);
    if (current.node.left) queue.push({ node: current.node.left, index: current.index * 2 + 1 });
    if (current.node.right) queue.push({ node: current.node.right, index: current.index * 2 + 2 });
  }
  for (let i = 0; i <= maxIndex; i += 1) {
    if (!state[i]) state[i] = 'null';
  }
  return state;
};

type RbColor = 'red' | 'black';

type RbNode = {
  value: number;
  color: RbColor;
  left: RbNode;
  right: RbNode;
  parent: RbNode;
};

const createRbNil = (): RbNode => {
  const nil = {} as RbNode;
  nil.value = 0;
  nil.color = 'black';
  nil.left = nil;
  nil.right = nil;
  nil.parent = nil;
  return nil;
};

const createRbNode = (value: number, nil: RbNode): RbNode => ({
  value,
  color: 'red',
  left: nil,
  right: nil,
  parent: nil
});

const rbRotateLeft = (root: RbNode, nil: RbNode, node: RbNode): RbNode => {
  const pivot = node.right;
  node.right = pivot.left;
  if (pivot.left !== nil) {
    pivot.left.parent = node;
  }
  pivot.parent = node.parent;
  if (node.parent === nil) {
    root = pivot;
  } else if (node === node.parent.left) {
    node.parent.left = pivot;
  } else {
    node.parent.right = pivot;
  }
  pivot.left = node;
  node.parent = pivot;
  return root;
};

const rbRotateRight = (root: RbNode, nil: RbNode, node: RbNode): RbNode => {
  const pivot = node.left;
  node.left = pivot.right;
  if (pivot.right !== nil) {
    pivot.right.parent = node;
  }
  pivot.parent = node.parent;
  if (node.parent === nil) {
    root = pivot;
  } else if (node === node.parent.right) {
    node.parent.right = pivot;
  } else {
    node.parent.left = pivot;
  }
  pivot.right = node;
  node.parent = pivot;
  return root;
};

const rbInsert = (root: RbNode, nil: RbNode, value: number): RbNode => {
  let parent = nil;
  let cursor = root;
  while (cursor !== nil) {
    parent = cursor;
    if (value === cursor.value) {
      return root;
    }
    cursor = value < cursor.value ? cursor.left : cursor.right;
  }

  const node = createRbNode(value, nil);
  node.parent = parent;
  if (parent === nil) {
    root = node;
  } else if (value < parent.value) {
    parent.left = node;
  } else {
    parent.right = node;
  }

  let current = node;
  while (current.parent.color === 'red') {
    if (current.parent === current.parent.parent.left) {
      const uncle = current.parent.parent.right;
      if (uncle.color === 'red') {
        current.parent.color = 'black';
        uncle.color = 'black';
        current.parent.parent.color = 'red';
        current = current.parent.parent;
      } else {
        if (current === current.parent.right) {
          current = current.parent;
          root = rbRotateLeft(root, nil, current);
        }
        current.parent.color = 'black';
        current.parent.parent.color = 'red';
        root = rbRotateRight(root, nil, current.parent.parent);
      }
    } else {
      const uncle = current.parent.parent.left;
      if (uncle.color === 'red') {
        current.parent.color = 'black';
        uncle.color = 'black';
        current.parent.parent.color = 'red';
        current = current.parent.parent;
      } else {
        if (current === current.parent.left) {
          current = current.parent;
          root = rbRotateRight(root, nil, current);
        }
        current.parent.color = 'black';
        current.parent.parent.color = 'red';
        root = rbRotateLeft(root, nil, current.parent.parent);
      }
    }
  }

  root.color = 'black';
  return root;
};

const rbMinimum = (node: RbNode, nil: RbNode): RbNode => {
  let cursor = node;
  while (cursor.left !== nil) {
    cursor = cursor.left;
  }
  return cursor;
};

const rbTransplant = (root: RbNode, nil: RbNode, from: RbNode, to: RbNode): RbNode => {
  if (from.parent === nil) {
    root = to;
  } else if (from === from.parent.left) {
    from.parent.left = to;
  } else {
    from.parent.right = to;
  }
  to.parent = from.parent;
  return root;
};

const rbFindNode = (root: RbNode, nil: RbNode, value: number): RbNode => {
  let cursor = root;
  while (cursor !== nil) {
    if (value === cursor.value) {
      return cursor;
    }
    cursor = value < cursor.value ? cursor.left : cursor.right;
  }
  return nil;
};

const rbDeleteFixup = (root: RbNode, nil: RbNode, start: RbNode): RbNode => {
  let node = start;
  while (node !== root && node.color === 'black') {
    if (node === node.parent.left) {
      let sibling = node.parent.right;
      if (sibling.color === 'red') {
        sibling.color = 'black';
        node.parent.color = 'red';
        root = rbRotateLeft(root, nil, node.parent);
        sibling = node.parent.right;
      }
      if (sibling.left.color === 'black' && sibling.right.color === 'black') {
        sibling.color = 'red';
        node = node.parent;
      } else {
        if (sibling.right.color === 'black') {
          sibling.left.color = 'black';
          sibling.color = 'red';
          root = rbRotateRight(root, nil, sibling);
          sibling = node.parent.right;
        }
        sibling.color = node.parent.color;
        node.parent.color = 'black';
        sibling.right.color = 'black';
        root = rbRotateLeft(root, nil, node.parent);
        node = root;
      }
    } else {
      let sibling = node.parent.left;
      if (sibling.color === 'red') {
        sibling.color = 'black';
        node.parent.color = 'red';
        root = rbRotateRight(root, nil, node.parent);
        sibling = node.parent.left;
      }
      if (sibling.left.color === 'black' && sibling.right.color === 'black') {
        sibling.color = 'red';
        node = node.parent;
      } else {
        if (sibling.left.color === 'black') {
          sibling.right.color = 'black';
          sibling.color = 'red';
          root = rbRotateLeft(root, nil, sibling);
          sibling = node.parent.left;
        }
        sibling.color = node.parent.color;
        node.parent.color = 'black';
        sibling.left.color = 'black';
        root = rbRotateRight(root, nil, node.parent);
        node = root;
      }
    }
  }
  node.color = 'black';
  return root;
};

const rbDelete = (root: RbNode, nil: RbNode, value: number): RbNode => {
  const target = rbFindNode(root, nil, value);
  if (target === nil) {
    return root;
  }

  let removed = target;
  let removedOriginalColor: RbColor = removed.color;
  let fixupStart: RbNode;

  if (target.left === nil) {
    fixupStart = target.right;
    root = rbTransplant(root, nil, target, target.right);
  } else if (target.right === nil) {
    fixupStart = target.left;
    root = rbTransplant(root, nil, target, target.left);
  } else {
    removed = rbMinimum(target.right, nil);
    removedOriginalColor = removed.color;
    fixupStart = removed.right;

    if (removed.parent === target) {
      fixupStart.parent = removed;
    } else {
      root = rbTransplant(root, nil, removed, removed.right);
      removed.right = target.right;
      removed.right.parent = removed;
    }

    root = rbTransplant(root, nil, target, removed);
    removed.left = target.left;
    removed.left.parent = removed;
    removed.color = target.color;
  }

  if (removedOriginalColor === 'black') {
    root = rbDeleteFixup(root, nil, fixupStart);
  }

  if (root !== nil) {
    root.color = 'black';
  }
  return root;
};

const buildRbTreeFromValues = (values: number[]): { root: RbNode; nil: RbNode } => {
  const nil = createRbNil();
  let root = nil;
  values.forEach((value) => {
    root = rbInsert(root, nil, value);
  });
  return { root, nil };
};

const rbFindPath = (root: RbNode, nil: RbNode, target: number): number[] => {
  const path: number[] = [];
  let cursor = root;
  while (cursor !== nil) {
    path.push(cursor.value);
    if (target === cursor.value) {
      break;
    }
    cursor = target < cursor.value ? cursor.left : cursor.right;
  }
  return path;
};

const rbToArrayAndColors = (root: RbNode, nil: RbNode): { array: string[]; colors: string[] } => {
  if (root === nil) {
    return { array: [], colors: [] };
  }

  const array: string[] = [];
  const colors: string[] = [];
  const queue: Array<{ node: RbNode; index: number }> = [{ node: root, index: 0 }];
  let maxIndex = 0;

  while (queue.length > 0) {
    const current = queue.shift() as { node: RbNode; index: number };
    maxIndex = Math.max(maxIndex, current.index);
    array[current.index] = String(current.node.value);
    colors[current.index] = current.node.color;

    if (current.node.left !== nil) {
      queue.push({ node: current.node.left, index: current.index * 2 + 1 });
    }
    if (current.node.right !== nil) {
      queue.push({ node: current.node.right, index: current.index * 2 + 2 });
    }
  }

  for (let i = 0; i <= maxIndex; i += 1) {
    if (!array[i]) {
      array[i] = 'null';
      colors[i] = '';
    }
  }

  return { array, colors };
};

const buildPseudoRbColorChain = (nodes: string[]): string[] => {
  const values = toVisibleNumericValues(nodes);
  if (values.length === 0) {
    return nodes.map(() => '');
  }
  const uniqueValues = Array.from(new Set(values));
  const { root, nil } = buildRbTreeFromValues(uniqueValues);
  const state = rbToArrayAndColors(root, nil);
  const colors = [...state.colors];
  while (colors.length < nodes.length) {
    colors.push('');
  }
  return colors.slice(0, nodes.length);
};

const buildBstLikeQueryFrames = (
  nodes: string[],
  target: number,
  mode: 'bst' | 'avl' | 'rb',
  deleteMode: boolean
): VisualizationFrame[] => {
  if (mode === 'rb') {
    const source = Array.from(new Set(toVisibleNumericValues(nodes)));
    const { nil } = buildRbTreeFromValues([]);
    let root = nil;
    source.forEach((item) => {
      root = rbInsert(root, nil, item);
    });

    const beforeState = rbToArrayAndColors(root, nil);
    const pathValues = rbFindPath(root, nil, target);
    const frames: VisualizationFrame[] = [];
    pathValues.forEach((value, step) => {
      const index = beforeState.array.findIndex((item) => Number(item) === value);
      frames.push({
        label: `Query step ${step + 1}: visit ${value}`,
        arrayState: beforeState.array,
        runChains: [[], beforeState.colors],
        activeIndices: index >= 0 ? [index] : undefined
      });
    });

    if (!deleteMode) {
      if (!source.includes(target)) {
        root = rbInsert(root, nil, target);
      }
    } else {
      root = rbDelete(root, nil, target);
    }

    const afterState = rbToArrayAndColors(root, nil);
    frames.push({
      label: deleteMode ? 'RB delete completed' : 'RB insert completed',
      arrayState: afterState.array,
      runChains: [[], afterState.colors],
      activeIndices: [0]
    });

    return frames;
  }

  const source = toVisibleNumericValues(nodes);
  let root: SimpleTreeNode | null = null;
  source.forEach((item) => {
    if (mode === 'avl') root = avlInsert(root, item);
    else root = bstInsert(root, item);
  });

  const frames: VisualizationFrame[] = [];
  const before = treeToArrayState(root);
  const pathValues = findPath(root, target);
  pathValues.forEach((value, step) => {
    const index = before.findIndex((item) => Number(item) === value);
    frames.push({
      label: `Query step ${step + 1}: visit ${value}`,
      arrayState: before,
      activeIndices: index >= 0 ? [index] : undefined
    });
  });

  if (!deleteMode) {
    if (!source.includes(target)) {
      if (mode === 'avl') root = avlInsert(root, target);
      else root = bstInsert(root, target);
    }
  } else {
    if (mode === 'avl') root = avlDelete(root, target);
    else root = bstDeletePreferPred(root, target);
  }

  const after = treeToArrayState(root);
  const colorChain: string[] = [];

  frames.push({
    label: deleteMode
      ? `${mode.toUpperCase()} delete completed`
      : `${mode.toUpperCase()} insert completed`,
    arrayState: after,
    runChains: colorChain.length > 0 ? [[], colorChain] : undefined,
    activeIndices: [0]
  });

  return frames;
};

const buildHeapifyFrames = (nodes: string[]): VisualizationFrame[] => {
  const arr = toVisibleNumericValues(nodes);
  if (arr.length === 0) return [];
  const frames: VisualizationFrame[] = [{ label: 'Start heapify build', arrayState: arr.map(String), activeIndices: [0] }];

  const siftDown = (start: number) => {
    let index = start;
    while (true) {
      let candidate = index;
      const left = index * 2 + 1;
      const right = index * 2 + 2;
      frames.push({ label: `heapify at index ${index}`, arrayState: arr.map(String), activeIndices: [index] });
      if (left < arr.length && arr[left] > arr[candidate]) candidate = left;
      if (right < arr.length && arr[right] > arr[candidate]) candidate = right;
      if (candidate === index) break;
      [arr[index], arr[candidate]] = [arr[candidate], arr[index]];
      frames.push({
        label: `swap index ${index} and ${candidate}`,
        arrayState: arr.map(String),
        activeIndices: [index, candidate],
        swapIndices: [index, candidate]
      });
      index = candidate;
    }
  };

  for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i -= 1) {
    siftDown(i);
  }

  frames.push({ label: 'Heapify completed', arrayState: arr.map(String), activeIndices: [0] });
  return frames;
};

const buildDefaultGeneralTreeParents = (nodes: string[], useBinaryLayout = false): number[] => nodes.map((_, index) => {
  if (index === 0) return -1;
  if (useBinaryLayout) return Math.floor((index - 1) / 2);
  if (index <= 3) return 0;
  if (index <= 5) return 1;
  return 2;
});

const normalizeGeneralTreeParents = (labels: string[], sourceParents: number[]): number[] => {
  const normalized = [...sourceParents];
  const visibleIndices = labels
    .map((label, index) => ({ label, index }))
    .filter((item) => !isHiddenTreeLabel(item.label))
    .map((item) => item.index);

  if (visibleIndices.length === 0) {
    return normalized;
  }

  const visibleSet = new Set(visibleIndices);
  const rootCandidate = visibleIndices.find((index) => normalized[index] === -1) ?? visibleIndices[0];

  visibleIndices.forEach((index) => {
    if (index === rootCandidate) return;
    const parent = normalized[index];
    if (!visibleSet.has(parent) || parent === index || parent < -1) {
      normalized[index] = rootCandidate;
    }
  });
  normalized[rootCandidate] = -1;

  visibleIndices.forEach((index) => {
    if (index === rootCandidate) return;
    const seen = new Set<number>([index]);
    let cursor = normalized[index];
    while (cursor !== -1 && visibleSet.has(cursor)) {
      if (seen.has(cursor)) {
        normalized[index] = rootCandidate;
        break;
      }
      seen.add(cursor);
      cursor = normalized[cursor];
    }
  });

  visibleIndices.forEach((index) => {
    if (index !== rootCandidate && normalized[index] === -1) {
      normalized[index] = rootCandidate;
    }
  });

  return normalized;
};

const parseGeneralTreeState = (
  nodes: string[],
  frame: VisualizationFrame | null,
  persistentParents?: number[]
): { labels: string[]; parents: number[] } => {
  if (frame?.runChains && frame.runChains.length > 0 && frame.runChains[0].length === nodes.length) {
    const parsed = frame.runChains[0].map((item) => Number(item));
    if (parsed.every((item) => Number.isInteger(item))) {
      return { labels: [...nodes], parents: normalizeGeneralTreeParents(nodes, parsed) };
    }
  }

  if (persistentParents && persistentParents.length === nodes.length) {
    return { labels: [...nodes], parents: normalizeGeneralTreeParents(nodes, [...persistentParents]) };
  }

  const parents = normalizeGeneralTreeParents(nodes, buildDefaultGeneralTreeParents(nodes));
  return { labels: [...nodes], parents };
};

const ensureBinaryArrayIndex = (labels: string[], index: number): void => {
  while (labels.length <= index) {
    labels.push('null');
  }
};

const isBinaryNodeVisible = (labels: string[], index: number): boolean => {
  return index >= 0 && index < labels.length && !isHiddenTreeLabel(labels[index]);
};

type BinaryTreeNodeState = {
  value: string;
  left: BinaryTreeNodeState | null;
  right: BinaryTreeNodeState | null;
};

const readBinarySubtree = (labels: string[], index: number): BinaryTreeNodeState | null => {
  if (!isBinaryNodeVisible(labels, index)) {
    return null;
  }
  return {
    value: labels[index],
    left: readBinarySubtree(labels, index * 2 + 1),
    right: readBinarySubtree(labels, index * 2 + 2)
  };
};

const collectBinarySubtreeIndices = (labels: string[], index: number, bucket: number[]): void => {
  if (!isBinaryNodeVisible(labels, index)) {
    return;
  }
  bucket.push(index);
  collectBinarySubtreeIndices(labels, index * 2 + 1, bucket);
  collectBinarySubtreeIndices(labels, index * 2 + 2, bucket);
};

const writeBinarySubtree = (labels: string[], index: number, node: BinaryTreeNodeState | null): void => {
  if (!node) {
    return;
  }
  ensureBinaryArrayIndex(labels, index);
  labels[index] = node.value;
  writeBinarySubtree(labels, index * 2 + 1, node.left);
  writeBinarySubtree(labels, index * 2 + 2, node.right);
};

const attachRightmost = (root: BinaryTreeNodeState, node: BinaryTreeNodeState): void => {
  let cursor = root;
  while (cursor.right) {
    cursor = cursor.right;
  }
  cursor.right = node;
};

const deleteBinaryRootWithPromotion = (node: BinaryTreeNodeState | null): BinaryTreeNodeState | null => {
  if (!node) {
    return null;
  }
  if (!node.left && !node.right) {
    return null;
  }
  if (!node.left) {
    return node.right;
  }
  if (!node.right) {
    return node.left;
  }

  const promoted = node.left;
  attachRightmost(promoted, node.right);
  return promoted;
};

const buildBinaryTreeCrudFrames = (
  nodes: string[],
  operation: 'insert' | 'delete' | 'modify',
  targetIndex: number,
  value: string
): VisualizationFrame[] => {
  const labels = [...nodes];
  const targetValid = isBinaryNodeVisible(labels, targetIndex);

  if (!targetValid) {
    return [{
      label: 'Invalid selected node',
      arrayState: labels,
      activeIndices: [0]
    }];
  }

  const frames: VisualizationFrame[] = [{
    label: `Select node index ${targetIndex} (value ${labels[targetIndex]})`,
    arrayState: [...labels],
    activeIndices: [targetIndex]
  }];

  if (operation === 'modify') {
    labels[targetIndex] = value;
    frames.push({
      label: `Modify node ${targetIndex} to ${value}`,
      arrayState: [...labels],
      activeIndices: [targetIndex]
    });
    return frames;
  }

  if (operation === 'insert') {
    const left = targetIndex * 2 + 1;
    const right = targetIndex * 2 + 2;
    const leftFree = !isBinaryNodeVisible(labels, left);
    const rightFree = !isBinaryNodeVisible(labels, right);

    if (!leftFree && !rightFree) {
      frames.push({
        label: `Insert blocked: node ${targetIndex} already has two children`,
        arrayState: [...labels],
        activeIndices: [targetIndex]
      });
      return frames;
    }

    const insertIndex = leftFree ? left : right;
    ensureBinaryArrayIndex(labels, insertIndex);
    labels[insertIndex] = value;

    frames.push({
      label: `Insert ${value} as ${leftFree ? 'left' : 'right'} child of node ${targetIndex}`,
      arrayState: [...labels],
      activeIndices: [insertIndex],
      visitedIndices: [targetIndex]
    });
    return frames;
  }

  const beforeSubtree = readBinarySubtree(labels, targetIndex);
  const afterSubtree = deleteBinaryRootWithPromotion(beforeSubtree);
  const occupiedIndices: number[] = [];
  collectBinarySubtreeIndices(labels, targetIndex, occupiedIndices);
  occupiedIndices.forEach((index) => {
    labels[index] = 'null';
  });
  writeBinarySubtree(labels, targetIndex, afterSubtree);

  frames.push({
    label: `Delete node ${targetIndex}: promote left subtree and reconnect right subtree`,
    arrayState: [...labels],
    activeIndices: [targetIndex]
  });
  return frames;
};

const initializeGeneralTreePositions = (
  labels: string[],
  parents: number[],
  width: number,
  height: number,
  reservedBottom: number
): Map<number, NodePoint> => {
  const visible = labels
    .map((label, index) => ({ index, label }))
    .filter((item) => !isHiddenTreeLabel(item.label));
  const result = new Map<number, NodePoint>();
  if (visible.length === 0) {
    return result;
  }

  const childrenMap = new Map<number, number[]>();
  visible.forEach((item) => {
    childrenMap.set(item.index, []);
  });
  visible.forEach((item) => {
    const parent = parents[item.index];
    if (parent >= 0 && childrenMap.has(parent)) {
      const bucket = childrenMap.get(parent) ?? [];
      bucket.push(item.index);
      childrenMap.set(parent, bucket);
    }
  });

  const root = visible.find((item) => parents[item.index] === -1)?.index ?? visible[0].index;
  const levels = new Map<number, number>();
  const queue: number[] = [root];
  levels.set(root, 0);
  while (queue.length > 0) {
    const current = queue.shift() as number;
    const currentLevel = levels.get(current) ?? 0;
    (childrenMap.get(current) ?? []).forEach((child) => {
      if (!levels.has(child)) {
        levels.set(child, currentLevel + 1);
        queue.push(child);
      }
    });
  }

  const levelMap = new Map<number, number[]>();
  visible.forEach((item) => {
    const level = levels.get(item.index) ?? 0;
    const bucket = levelMap.get(level) ?? [];
    bucket.push(item.index);
    levelMap.set(level, bucket);
  });

  const maxLevel = Math.max(...Array.from(levelMap.keys()));
  const levelGap = Math.max(72, Math.min(104, (height - 124 - reservedBottom) / Math.max(1, maxLevel + 1)));

  Array.from(levelMap.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([level, ids]) => {
      const sortedIds = [...ids].sort((a, b) => a - b);
      sortedIds.forEach((id, order) => {
        const x = 60 + ((width - 120) * (order + 0.5)) / sortedIds.length;
        const y = 52 + level * levelGap;
        result.set(id, { x, y });
      });
    });

  return result;
};

const updateGeneralTreeStablePositions = (
  labels: string[],
  parents: number[],
  previous: Map<number, NodePoint>,
  width: number,
  height: number,
  reservedBottom: number
): Map<number, NodePoint> => {
  const visible = labels
    .map((label, index) => ({ index, label }))
    .filter((item) => !isHiddenTreeLabel(item.label))
    .map((item) => item.index);

  if (visible.length === 0) {
    return new Map<number, NodePoint>();
  }

  if (previous.size === 0) {
    return initializeGeneralTreePositions(labels, parents, width, height, reservedBottom);
  }

  const next = new Map<number, NodePoint>();
  visible.forEach((id) => {
    const old = previous.get(id);
    if (old) {
      next.set(id, old);
    }
  });

  const childrenMap = new Map<number, number[]>();
  visible.forEach((id) => childrenMap.set(id, []));
  visible.forEach((id) => {
    const parent = parents[id];
    if (parent >= 0 && childrenMap.has(parent)) {
      const bucket = childrenMap.get(parent) ?? [];
      bucket.push(id);
      childrenMap.set(parent, bucket);
    }
  });

  const root = visible.find((id) => parents[id] === -1) ?? visible[0];
  if (!next.has(root)) {
    next.set(root, { x: width / 2, y: 52 });
  }

  const levelGap = Math.max(72, Math.min(104, (height - 124 - reservedBottom) / 4));
  const unresolved = visible.filter((id) => !next.has(id));
  const maxX = width - 60;
  const minX = 60;
  const maxY = height - reservedBottom - 28;

  let guard = 0;
  while (unresolved.length > 0 && guard < 1000) {
    guard += 1;
    const id = unresolved.shift() as number;
    const parent = parents[id];
    const parentPos = parent >= 0 ? next.get(parent) : next.get(root);
    if (!parentPos) {
      unresolved.push(id);
      continue;
    }

    const siblings = (childrenMap.get(parent) ?? []).filter((s) => s !== id);
    const placedSiblings = siblings.map((s) => next.get(s)).filter((item): item is NodePoint => Boolean(item));
    const siblingGap = 62;

    const candidateX = placedSiblings.length > 0
      ? Math.max(...placedSiblings.map((item) => item.x)) + siblingGap
      : parentPos.x;
    const candidateY = parentPos.y + levelGap;

    next.set(id, {
      x: Math.max(minX, Math.min(maxX, candidateX)),
      y: Math.max(52, Math.min(maxY, candidateY))
    });
  }

  return next;
};

const buildStableBinaryPositions = (
  nodes: string[],
  width: number,
  height: number,
  reservedBottom: number
): Map<number, NodePoint> => {
  const visible = nodes
    .map((value, index) => ({ value, index }))
    .filter((item) => !isHiddenTreeLabel(item.value));

  const positions = new Map<number, NodePoint>();
  if (visible.length === 0) {
    return positions;
  }

  const maxIndex = Math.max(...visible.map((item) => item.index));
  const maxLevel = Math.floor(Math.log2(maxIndex + 1));
  const levelGap = Math.max(72, Math.min(104, (height - 124 - reservedBottom) / Math.max(1, maxLevel + 1)));

  visible.forEach((item) => {
    const level = Math.floor(Math.log2(item.index + 1));
    const firstAtLevel = (1 << level) - 1;
    const positionInLevel = item.index - firstAtLevel;
    const nodesInLevel = 1 << level;
    const x = 60 + ((width - 120) * (positionInLevel + 0.5)) / nodesInLevel;
    const y = 52 + level * levelGap;
    positions.set(item.index, { x, y });
  });

  return positions;
};

const buildGeneralTreeCrudFrames = (
  nodes: string[],
  frame: VisualizationFrame | null,
  persistentParents: number[] | undefined,
  operation: 'insert' | 'delete' | 'modify',
  targetIndex: number,
  value: string,
  maxChildren?: number
): VisualizationFrame[] => {
  const state = parseGeneralTreeState(nodes, frame, persistentParents);
  const labels = [...state.labels];
  const parents = [...state.parents];
  const active = targetIndex >= 0 && targetIndex < labels.length && !isHiddenTreeLabel(labels[targetIndex]);
  if (!active) {
    return [{ label: 'Invalid selected node', arrayState: labels, runChains: [parents.map(String)], activeIndices: [0] }];
  }

  const frames: VisualizationFrame[] = [{
    label: `Select node index ${targetIndex} (value ${labels[targetIndex]})`,
    arrayState: labels,
    runChains: [parents.map(String)],
    activeIndices: [targetIndex]
  }];

  if (operation === 'modify') {
    labels[targetIndex] = value;
    frames.push({
      label: `Modify node ${targetIndex} to ${value}`,
      arrayState: labels,
      runChains: [parents.map(String)],
      activeIndices: [targetIndex]
    });
    return frames;
  }

  const children = parents
    .map((parent, index) => ({ parent, index }))
    .filter((item) => item.parent === targetIndex && !isHiddenTreeLabel(labels[item.index]))
    .map((item) => item.index);

  if (operation === 'insert') {
    if (typeof maxChildren === 'number' && children.length >= maxChildren) {
      frames.push({
        label: `Insert blocked: node ${targetIndex} already has ${maxChildren} children`,
        arrayState: labels,
        runChains: [parents.map(String)],
        activeIndices: [targetIndex]
      });
      return frames;
    }

    const newIndex = labels.length;
    labels.push(value);
    parents.push(targetIndex);
    frames.push({
      label: `Insert node ${value} as a new child of node ${targetIndex}`,
      arrayState: labels,
      runChains: [parents.map(String)],
      activeIndices: [newIndex]
    });
    return frames;
  }

  if (children.length === 0) {
    labels[targetIndex] = '__deleted__';
    parents[targetIndex] = -2;
    frames.push({
      label: `Delete leaf node ${targetIndex}`,
      arrayState: labels,
      runChains: [parents.map(String)],
      activeIndices: [0]
    });
    return frames;
  }

  const promoted = children[0];
  const parentOfTarget = parents[targetIndex];
  parents[promoted] = parentOfTarget;

  const remainingSubtreeRoots = children.slice(1);
  for (const subtreeRoot of remainingSubtreeRoots) {
    parents[subtreeRoot] = promoted;
  }

  labels[targetIndex] = '__deleted__';
  parents[targetIndex] = -2;

  frames.push({
    label: `Delete node ${targetIndex}: promote ${promoted}, then attach remaining sibling subtrees under ${promoted} in order`,
    arrayState: labels,
    runChains: [parents.map(String)],
    activeIndices: [promoted]
  });
  return frames;
};

const buildGeneralTreeTraversalFrames = (
  nodes: string[],
  frame: VisualizationFrame | null,
  persistentParents: number[] | undefined,
  mode: 'general-preorder' | 'general-postorder'
): VisualizationFrame[] => {
  const { labels, parents } = parseGeneralTreeState(nodes, frame, persistentParents);
  const childrenMap = new Map<number, number[]>();
  labels.forEach((_, index) => {
    if (!childrenMap.has(index)) childrenMap.set(index, []);
  });
  parents.forEach((parent, index) => {
    if (parent >= 0 && !isHiddenTreeLabel(labels[index])) {
      const bucket = childrenMap.get(parent) ?? [];
      bucket.push(index);
      childrenMap.set(parent, bucket);
    }
  });

  const order: number[] = [];
  const preorder = (index: number) => {
    if (isHiddenTreeLabel(labels[index])) return;
    order.push(index);
    (childrenMap.get(index) ?? []).forEach((child) => preorder(child));
  };
  const postorder = (index: number) => {
    if (isHiddenTreeLabel(labels[index])) return;
    const children = [...(childrenMap.get(index) ?? [])].reverse();
    children.forEach((child) => postorder(child));
    order.push(index);
  };

  if (mode === 'general-preorder') preorder(0);
  else postorder(0);

  const output: string[] = [];
  const frames: VisualizationFrame[] = [];
  order.forEach((index, step) => {
    output.push(labels[index]);
    frames.push({
      label: `Traversal step ${step + 1}: visit ${labels[index]}`,
      arrayState: labels,
      runChains: [parents.map(String)],
      activeIndices: [index],
      visitedIndices: [...order.slice(0, step + 1)],
      outputList: [...output]
    });
  });
  return frames;
};

const buildBinaryTraversalFrames = (
  nodes: string[],
  mode: 'preorder' | 'inorder' | 'postorder'
): VisualizationFrame[] => {
  const order: number[] = [];

  const walk = (index: number) => {
    if (index >= nodes.length || isHiddenTreeLabel(nodes[index] ?? '')) return;
    if (mode === 'preorder') order.push(index);
    walk(index * 2 + 1);
    if (mode === 'inorder') order.push(index);
    walk(index * 2 + 2);
    if (mode === 'postorder') order.push(index);
  };

  walk(0);
  const output: string[] = [];
  return order.map((index, step) => {
    output.push(nodes[index]);
    return {
      label: `Traversal step ${step + 1}: visit ${nodes[index]}`,
      arrayState: [...nodes],
      activeIndices: [index],
      visitedIndices: [...order.slice(0, step + 1)],
      outputList: [...output]
    };
  });
};

const buildHuffmanBuildFrames = (nodes: string[]): VisualizationFrame[] => {
  const weights = toVisibleNumericValues(nodes);
  if (weights.length < 2) return [];

  type Item = { id: string; weight: number };
  const queue: Item[] = weights.map((weight, index) => ({ id: `n${index}`, weight }));
  const frames: VisualizationFrame[] = [{
    label: 'Initialize min set from frequency array',
    arrayState: weights.map(String),
    outputList: queue.map((item) => `${item.id}:${item.weight}`)
  }];

  while (queue.length > 1) {
    queue.sort((a, b) => a.weight - b.weight);
    const left = queue.shift() as Item;
    const right = queue.shift() as Item;
    const merged: Item = { id: `(${left.id}+${right.id})`, weight: left.weight + right.weight };
    queue.push(merged);
    frames.push({
      label: `Merge ${left.id}:${left.weight} and ${right.id}:${right.weight} -> ${merged.weight}`,
      arrayState: weights.map(String),
      outputList: queue.map((item) => `${item.id}:${item.weight}`)
    });
  }

  frames.push({
    label: `Huffman tree completed, root weight=${queue[0].weight}`,
    arrayState: weights.map(String),
    outputList: [queue[0].id]
  });
  return frames;
};

const normalizePatternText = (value: string): string => value.replace(/\r?\n/g, '');

const buildBfPatternMatchFrames = (text: string, pattern: string): VisualizationFrame[] => {
  const main = normalizePatternText(text);
  const sub = normalizePatternText(pattern);
  if (!main || !sub || sub.length > main.length) {
    return [];
  }

  const textChars = [...main];
  const patternChars = [...sub];
  const matches: string[] = [];
  const frames: VisualizationFrame[] = [
    {
      label: `BF init: text length=${main.length}, pattern length=${sub.length}`,
      arrayState: textChars,
      runChains: [patternChars],
      visitedIndices: [0],
      outputList: [...matches]
    }
  ];

  for (let start = 0; start <= main.length - sub.length; start += 1) {
    let matched = true;

    for (let j = 0; j < sub.length; j += 1) {
      const i = start + j;
      frames.push({
        label: `Compare T[${i}]='${main[i]}' with P[${j}]='${sub[j]}'`,
        arrayState: textChars,
        runChains: [patternChars],
        activeIndices: [i],
        compareIndices: [j],
        visitedIndices: [start],
        outputList: [...matches]
      });

      if (main[i] !== sub[j]) {
        matched = false;
        frames.push({
          label: `Mismatch: shift pattern right to start ${start + 1}`,
          arrayState: textChars,
          runChains: [patternChars],
          activeIndices: [i],
          compareIndices: [j],
          visitedIndices: [start + 1],
          outputList: [...matches]
        });
        break;
      }
    }

    if (matched) {
      matches.push(String(start));
      frames.push({
        label: `Match found at index ${start}, continue shifting pattern`,
        arrayState: textChars,
        runChains: [patternChars],
        activeIndices: [start],
        compareIndices: [sub.length - 1],
        visitedIndices: [start],
        outputList: [...matches]
      });
    }
  }

  frames.push({
    label: matches.length > 0 ? 'BF matching completed' : 'BF matching completed: no match',
    arrayState: textChars,
    runChains: [patternChars],
    visitedIndices: [Math.max(0, main.length - sub.length)],
    outputList: [...matches]
  });

  return frames;
};

const buildKmpPatternMatchFrames = (text: string, pattern: string): VisualizationFrame[] => {
  const main = normalizePatternText(text);
  const sub = normalizePatternText(pattern);
  if (!main || !sub || sub.length > main.length) {
    return [];
  }

  const textChars = [...main];
  const patternChars = [...sub];
  const next = new Array(sub.length).fill(0);
  const matches: string[] = [];
  const frames: VisualizationFrame[] = [
    {
      label: `KMP init: text length=${main.length}, pattern length=${sub.length}`,
      arrayState: textChars,
      runChains: [patternChars, next.map(String)],
      visitedIndices: [0],
      outputList: [...matches]
    }
  ];

  for (let i = 1, len = 0; i < sub.length;) {
    frames.push({
      label: `Build next: compare P[${i}]='${sub[i]}' with P[${len}]='${sub[len]}'`,
      arrayState: textChars,
      runChains: [patternChars, next.map(String)],
      compareIndices: [i],
      activeIndices: [],
      visitedIndices: [0],
      outputList: [...matches]
    });

    if (sub[i] === sub[len]) {
      len += 1;
      next[i] = len;
      frames.push({
        label: `next[${i}] = ${len}`,
        arrayState: textChars,
        runChains: [patternChars, next.map(String)],
        compareIndices: [i],
        activeIndices: [],
        visitedIndices: [0],
        outputList: [...matches]
      });
      i += 1;
    } else if (len > 0) {
      frames.push({
        label: `Mismatch fallback: len from ${len} to ${next[len - 1]}`,
        arrayState: textChars,
        runChains: [patternChars, next.map(String)],
        compareIndices: [len - 1],
        activeIndices: [],
        visitedIndices: [0],
        outputList: [...matches]
      });
      len = next[len - 1];
    } else {
      next[i] = 0;
      frames.push({
        label: `next[${i}] = 0`,
        arrayState: textChars,
        runChains: [patternChars, next.map(String)],
        compareIndices: [i],
        activeIndices: [],
        visitedIndices: [0],
        outputList: [...matches]
      });
      i += 1;
    }
  }

  for (let i = 0, j = 0; i < main.length;) {
    const align = i - j;
    frames.push({
      label: `Compare T[${i}]='${main[i]}' with P[${j}]='${sub[j]}'`,
      arrayState: textChars,
      runChains: [patternChars, next.map(String)],
      activeIndices: [i],
      compareIndices: [j],
      visitedIndices: [Math.max(0, align)],
      outputList: [...matches]
    });

    if (main[i] === sub[j]) {
      i += 1;
      j += 1;

      if (j === sub.length) {
        const matchIndex = i - j;
        matches.push(String(matchIndex));
        frames.push({
          label: `Match found at index ${matchIndex}`,
          arrayState: textChars,
          runChains: [patternChars, next.map(String)],
          activeIndices: [matchIndex],
          compareIndices: [sub.length - 1],
          visitedIndices: [matchIndex],
          outputList: [...matches]
        });
        j = next[j - 1];
      }
    } else if (j > 0) {
      frames.push({
        label: `Mismatch fallback: j from ${j} to ${next[j - 1]}`,
        arrayState: textChars,
        runChains: [patternChars, next.map(String)],
        activeIndices: [i],
        compareIndices: [j - 1],
        visitedIndices: [Math.max(0, align)],
        outputList: [...matches]
      });
      j = next[j - 1];
    } else {
      i += 1;
    }
  }

  frames.push({
    label: matches.length > 0 ? 'KMP matching completed' : 'KMP matching completed: no match',
    arrayState: textChars,
    runChains: [patternChars, next.map(String)],
    visitedIndices: [Math.max(0, main.length - sub.length)],
    outputList: [...matches]
  });

  return frames;
};

const formatDistance = (value: number): string => (Number.isFinite(value) ? String(value) : 'x');

const buildGraphDfsFrames = (nodes: string[], start: number): VisualizationFrame[] => {
  const adjacency = buildGraphAdjacency(nodes.length);
  const visited = new Set<number>();
  const edgeTrace: string[] = [];
  const order: string[] = [];
  const frames: VisualizationFrame[] = [];
  const stack: Array<{ node: number; nextIndex: number }> = [{ node: start, nextIndex: 0 }];

  visited.add(start);
  order.push(nodes[start]);
  frames.push({
    label: `DFS start at ${nodes[start]}`,
    arrayState: [...nodes],
    activeIndices: [start],
    visitedIndices: [...visited],
    outputList: [...order],
    runChains: [[], []]
  });

  while (stack.length > 0) {
    const top = stack[stack.length - 1];
    const neighbors = adjacency[top.node];
    let advanced = false;

    while (top.nextIndex < neighbors.length) {
      const next = neighbors[top.nextIndex];
      top.nextIndex += 1;
      if (visited.has(next.to)) continue;

      visited.add(next.to);
      stack.push({ node: next.to, nextIndex: 0 });
      edgeTrace.push(graphEdgeKey(top.node, next.to));
      order.push(nodes[next.to]);
      frames.push({
        label: `DFS visit ${nodes[next.to]} from ${nodes[top.node]}`,
        arrayState: [...nodes],
        activeIndices: [next.to],
        visitedIndices: [...visited],
        outputList: [...order],
        runChains: [[...edgeTrace], []]
      });
      advanced = true;
      break;
    }

    if (!advanced) {
      stack.pop();
    }
  }

  return frames;
};

const buildGraphBfsFrames = (nodes: string[], start: number): VisualizationFrame[] => {
  const adjacency = buildGraphAdjacency(nodes.length);
  const visited = new Set<number>([start]);
  const queue: number[] = [start];
  const edgeTrace: string[] = [];
  const order: string[] = [nodes[start]];
  const frames: VisualizationFrame[] = [{
    label: `BFS start at ${nodes[start]}`,
    arrayState: [...nodes],
    activeIndices: [start],
    visitedIndices: [...visited],
    outputList: [...order],
    runChains: [[], []]
  }];

  while (queue.length > 0) {
    const current = queue.shift() as number;
    adjacency[current].forEach((edge) => {
      if (visited.has(edge.to)) return;
      visited.add(edge.to);
      queue.push(edge.to);
      edgeTrace.push(graphEdgeKey(current, edge.to));
      order.push(nodes[edge.to]);
      frames.push({
        label: `BFS enqueue ${nodes[edge.to]} from ${nodes[current]}`,
        arrayState: [...nodes],
        activeIndices: [edge.to],
        visitedIndices: [...visited],
        outputList: [...order],
        runChains: [[...edgeTrace], []]
      });
    });
  }

  return frames;
};

const buildGraphAdjListFrames = (nodes: string[], start: number): VisualizationFrame[] => {
  const traversalFrames = buildGraphBfsFrames(nodes, start);
  const adjacency = buildGraphAdjacency(nodes.length);
  const rows: string[] = [];
  const frames: VisualizationFrame[] = [];

  traversalFrames.forEach((frame) => {
    const active = frame.activeIndices?.[0] ?? -1;
    if (active >= 0 && active < adjacency.length && !rows.some((row) => row.startsWith(`${nodes[active]}:`))) {
      const row = `${nodes[active]}: ${adjacency[active].map((item) => `${nodes[item.to]}(${item.weight})`).join(' , ')}`;
      rows.push(row);
    }

    frames.push({
      ...frame,
      label: frame.label.replace(/^BFS/, 'AdjList'),
      runChains: [frame.runChains?.[0] ?? [], [...rows]]
    });
  });

  return frames;
};

const buildGraphAdjMatrixFrames = (nodes: string[], start: number): VisualizationFrame[] => {
  const traversalFrames = buildGraphBfsFrames(nodes, start);
  const adjacency = buildGraphAdjacency(nodes.length);
  const matrix = Array.from({ length: nodes.length }, () => Array.from({ length: nodes.length }, () => 'x'));
  const frames: VisualizationFrame[] = [];
  traversalFrames.forEach((frame) => {
    const active = frame.activeIndices?.[0] ?? -1;
    if (active >= 0 && active < adjacency.length) {
      matrix[active][active] = '0';
      adjacency[active].forEach((edge) => {
        matrix[active][edge.to] = String(edge.weight);
      });
    }

    frames.push({
      ...frame,
      label: frame.label.replace(/^BFS/, 'AdjMatrix'),
      runChains: [frame.runChains?.[0] ?? [], ...matrix.map((row) => [...row])]
    });
  });
  return frames;
};

const buildGraphDijkstraFrames = (nodes: string[], start: number): VisualizationFrame[] => {
  const adjacency = buildGraphAdjacency(nodes.length);
  const dist = Array.from({ length: nodes.length }, () => Number.POSITIVE_INFINITY);
  const visited = new Set<number>();
  const edgeTrace: string[] = [];
  dist[start] = 0;
  const frames: VisualizationFrame[] = [];

  for (let step = 0; step < nodes.length; step += 1) {
    let current = -1;
    let best = Number.POSITIVE_INFINITY;
    for (let i = 0; i < nodes.length; i += 1) {
      if (!visited.has(i) && dist[i] < best) {
        best = dist[i];
        current = i;
      }
    }

    if (current === -1) break;
    visited.add(current);
    frames.push({
      label: `Dijkstra settle ${nodes[current]}`,
      arrayState: [...nodes],
      activeIndices: [current],
      visitedIndices: [...visited],
      runChains: [[...edgeTrace], dist.map(formatDistance)]
    });

    adjacency[current].forEach((edge) => {
      if (dist[current] + edge.weight < dist[edge.to]) {
        dist[edge.to] = dist[current] + edge.weight;
        edgeTrace.push(graphEdgeKey(current, edge.to));
        frames.push({
          label: `Relax ${nodes[current]} -> ${nodes[edge.to]} (${edge.weight})`,
          arrayState: [...nodes],
          activeIndices: [edge.to],
          visitedIndices: [...visited],
          runChains: [[...edgeTrace], dist.map(formatDistance)]
        });
      }
    });
  }

  return frames;
};

const buildGraphBellmanFordFrames = (nodes: string[], start: number): VisualizationFrame[] => {
  const edges = buildDirectedWeightedEdges(nodes.length);
  const dist = Array.from({ length: nodes.length }, () => Number.POSITIVE_INFINITY);
  dist[start] = 0;
  const edgeTrace: string[] = [];
  const frames: VisualizationFrame[] = [{
    label: `Bellman-Ford init at ${nodes[start]}`,
    arrayState: [...nodes],
    activeIndices: [start],
    runChains: [[], dist.map(formatDistance)]
  }];

  for (let round = 1; round <= nodes.length - 1; round += 1) {
    let changed = false;
    edges.forEach((edge) => {
      if (!Number.isFinite(dist[edge.from])) return;
      const candidate = dist[edge.from] + edge.weight;
      if (candidate < dist[edge.to]) {
        dist[edge.to] = candidate;
        edgeTrace.push(graphEdgeKey(edge.from, edge.to));
        changed = true;
      }
    });
    frames.push({
      label: `Round ${round} completed`,
      arrayState: [...nodes],
      runChains: [[...edgeTrace], dist.map(formatDistance)]
    });
    if (!changed) break;
  }

  return frames;
};

const buildGraphFloydFrames = (nodes: string[]): VisualizationFrame[] => {
  const n = nodes.length;
  const dist = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Number.POSITIVE_INFINITY)));
  buildDirectedWeightedEdges(n).forEach((edge) => {
    dist[edge.from][edge.to] = Math.min(dist[edge.from][edge.to], edge.weight);
  });

  const frames: VisualizationFrame[] = [{
    label: 'Floyd init matrix',
    arrayState: [...nodes],
    runChains: [[], ...dist.map((row) => row.map(formatDistance))]
  }];

  for (let k = 0; k < n; k += 1) {
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
    frames.push({
      label: `Floyd intermediate k=${nodes[k]}`,
      arrayState: [...nodes],
      activeIndices: [k],
      runChains: [[], ...dist.map((row) => row.map(formatDistance))]
    });
  }

  return frames;
};

const buildUndirectedEdgeSet = (nodeCount: number): Array<{ u: number; v: number; weight: number; directedKey: string }> => {
  const pairMap = new Map<string, { u: number; v: number; weight: number; directedKey: string }>();
  buildDirectedWeightedEdges(nodeCount).forEach((edge) => {
    const u = Math.min(edge.from, edge.to);
    const v = Math.max(edge.from, edge.to);
    const key = `${u}-${v}`;
    const candidate = { u, v, weight: edge.weight, directedKey: graphEdgeKey(edge.from, edge.to) };
    const existing = pairMap.get(key);
    if (!existing || candidate.weight < existing.weight) {
      pairMap.set(key, candidate);
    }
  });
  return Array.from(pairMap.values()).sort((a, b) => a.weight - b.weight);
};

const buildGraphPrimFrames = (nodes: string[], start: number): VisualizationFrame[] => {
  const edges = buildUndirectedEdgeSet(nodes.length);
  const adjacency = Array.from({ length: nodes.length }, () => [] as Array<{ to: number; weight: number; key: string }>);
  edges.forEach((edge) => {
    adjacency[edge.u].push({ to: edge.v, weight: edge.weight, key: edge.directedKey });
    adjacency[edge.v].push({ to: edge.u, weight: edge.weight, key: edge.directedKey });
  });

  const inTree = new Set<number>([start]);
  const selectedEdges: string[] = [];
  const selectedEdgeLabels: string[] = [];
  let total = 0;
  type PrimCandidate = { from: number; to: number; weight: number; key: string };
  const frames: VisualizationFrame[] = [{
    label: `Prim start at ${nodes[start]}`,
    arrayState: [...nodes],
    activeIndices: [start],
    visitedIndices: [...inTree],
    runChains: [[], [], ['0']]
  }];

  while (inTree.size < nodes.length) {
    let best: PrimCandidate | undefined;
    inTree.forEach((from) => {
      adjacency[from].forEach((edge) => {
        if (inTree.has(edge.to)) return;
        if (!best || edge.weight < best.weight) {
          best = { from, to: edge.to, weight: edge.weight, key: edge.key };
        }
      });
    });

    if (!best) break;
    const selected = best;
    inTree.add(selected.to);
    selectedEdges.push(selected.key);
    selectedEdgeLabels.push(`${selected.from} -> ${selected.to} (w=${selected.weight})`);
    total += selected.weight;
    frames.push({
      label: `Prim choose ${nodes[selected.from]}-${nodes[selected.to]} (${selected.weight})`,
      arrayState: [...nodes],
      activeIndices: [selected.to],
      visitedIndices: [...inTree],
      runChains: [[...selectedEdges], [...selectedEdgeLabels], [String(total)]]
    });
  }

  return frames;
};

const buildGraphKruskalFrames = (nodes: string[]): VisualizationFrame[] => {
  const edges = buildUndirectedEdgeSet(nodes.length);
  const parent = Array.from({ length: nodes.length }, (_, i) => i);
  const find = (x: number): number => {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  };

  const selectedEdges: string[] = [];
  const selectedEdgeLabels: string[] = [];
  let total = 0;
  const frames: VisualizationFrame[] = [];

  edges.forEach((edge) => {
    const ru = find(edge.u);
    const rv = find(edge.v);
    if (ru === rv) {
      return;
    }
    parent[ru] = rv;
    selectedEdges.push(edge.directedKey);
    selectedEdgeLabels.push(`${edge.u} -> ${edge.v} (w=${edge.weight})`);
    total += edge.weight;
    frames.push({
      label: `Kruskal accept ${nodes[edge.u]}-${nodes[edge.v]} (${edge.weight})`,
      arrayState: [...nodes],
      activeIndices: [edge.u, edge.v],
      runChains: [[...selectedEdges], [...selectedEdgeLabels], [String(total)]]
    });
  });

  return frames;
};

const SectionVisualizationModule: React.FC<SectionVisualizationModuleProps> = ({ data }) => {
  const defaultUseBinaryTreeParents = data.form === 'tree'
    && !/general tree structure|tree \(general\)|multiple children/.test(String(data.caption).toLowerCase());
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(55);
  const [operationIndex, setOperationIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [displayNodes, setDisplayNodes] = useState<string[]>(data.nodes);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);
  const [indexInput, setIndexInput] = useState<string>('');
  const [valueInput, setValueInput] = useState<string>('');
  const [patternMainInput, setPatternMainInput] = useState<string>('ababcabcacbab');
  const [patternSubInput, setPatternSubInput] = useState<string>('abcac');
  const [runtimeFrames, setRuntimeFrames] = useState<VisualizationFrame[] | null>(null);
  const [generalTreeParents, setGeneralTreeParents] = useState<number[]>(
    buildDefaultGeneralTreeParents(data.nodes, defaultUseBinaryTreeParents)
  );
  const [phase, setPhase] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 860, height: 360 });
  const [viewportWidth, setViewportWidth] = useState(860);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitRegionsRef = useRef<HitRegion[]>([]);
  const generalTreePositionRef = useRef<Map<number, NodePoint>>(new Map());
  const binaryTreePositionRef = useRef<Map<number, NodePoint>>(new Map());
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const operations = data.operations;
  const currentOperation = operations[operationIndex];
  const currentSteps = currentOperation?.steps ?? [];
  const scriptedFrames = currentOperation?.script?.frames ?? [];
  const currentFrames: VisualizationFrame[] = (runtimeFrames && runtimeFrames.length > 0)
    ? runtimeFrames
    : scriptedFrames.length > 0
    ? scriptedFrames
    : currentSteps.map((step, index) => ({
      label: step,
      activeIndices: displayNodes.length > 0 ? [index % displayNodes.length] : []
    }));
  const currentFrame = currentFrames[stepIndex] ?? null;
  const currentOperationName = (currentOperation?.name ?? '').toLowerCase();
  const isAccessOperation = /access|read|get/.test(currentOperationName);
  const isModifyOperation = /modify|update|set/.test(currentOperationName);
  const isInsertOperation = /insert|enqueue|push/.test(currentOperationName);
  const isDeleteOperation = /delete|remove|dequeue|pop/.test(currentOperationName);
  const isLinkedForm = data.form === 'linked';
  const isExternalSortOperation = /external\s*sort|external\s*merge|外部排序/.test(currentOperationName);
  const isInteractiveArrayRuntimeForm = data.form === 'sequential' || data.form === 'hash';
  const isInsertAtHeadOperation = /insert\s*at\s*head|head\s*insert|头插|插入头/.test(currentOperationName);
  const isDeleteFromHeadOperation = /delete\s*from\s*head|head\s*delete|头删|删头/.test(currentOperationName);
  const isDeleteCurrentOperation = /delete\s*current|current\s*delete|删除当前|删除选中/.test(currentOperationName);
  const isStackInsertOperation = /push|入栈/.test(currentOperationName);
  const isStackDeleteOperation = /pop|出栈/.test(currentOperationName);
  const isQueueInsertOperation = /enqueue|入队/.test(currentOperationName);
  const isQueueDeleteOperation = /dequeue|出队/.test(currentOperationName);
  const isFixedInsertOperation = isLinkedForm && (isInsertAtHeadOperation || isStackInsertOperation || isQueueInsertOperation);
  const isFixedDeleteOperation = isLinkedForm && (isDeleteFromHeadOperation || isStackDeleteOperation || isQueueDeleteOperation);
  const isSearchOperation = /search|查找|查询/.test(currentOperationName);
  const isPatternMatchOperation = /pattern\s*match|patternmatch|模式匹配|bf\s*match|kmp\s*match|字符串匹配/.test(currentOperationName);
  const isKmpPatternMatchOperation = isPatternMatchOperation && /kmp/.test(currentOperationName);
  const isTreeCrudOperation = data.form === 'tree' && /insert\s*node|delete\s*node|modify\s*node/.test(currentOperationName);
  const isTreeTraversalOperation = data.form === 'tree' && /preorder|inorder|postorder|thread\s*traversal|traversal/.test(currentOperationName);
  const isGeneralTreeContext = data.form === 'tree' && /general tree structure|tree \(general\)|multiple children/.test(String(data.caption).toLowerCase());
  const isGeneralTreeTraversalOperation = isTreeTraversalOperation && /general tree/.test(currentOperationName);
  const isHeapifyOperation = data.form === 'tree' && /heapify|build heap/.test(currentOperationName);
  const isHuffmanBuildOperation = data.form === 'tree' && /build huffman tree/.test(currentOperationName);
  const isGraphForm = data.form === 'graph';
  const isGraphAdjListOperation = isGraphForm && /adjacency\s*list|邻接表/.test(currentOperationName);
  const isGraphAdjMatrixOperation = isGraphForm && /adjacency\s*matrix|邻接矩阵/.test(currentOperationName);
  const isGraphDfsOperation = isGraphForm && /\bdfs\b|depth\s*first|深度优先/.test(currentOperationName);
  const isGraphBfsOperation = isGraphForm && /\bbfs\b|breadth\s*first|广度优先/.test(currentOperationName);
  const isGraphTraversalOverviewOperation = isGraphForm
    && (/overview|总览|综合/.test(currentOperationName) && /traversal|遍历/.test(currentOperationName));
  const isGraphDijkstraOperation = isGraphForm && /dijkstra/.test(currentOperationName);
  const isGraphBellmanFordOperation = isGraphForm && /bellman/.test(currentOperationName);
  const isGraphFloydOperation = isGraphForm && /floyd|warshall/.test(currentOperationName);
  const isGraphShortestPathOverviewOperation = isGraphForm
    && (/overview|总览|综合/.test(currentOperationName) && /shortest\s*path|最短路/.test(currentOperationName));
  const isGraphPrimOperation = isGraphForm && /prim/.test(currentOperationName);
  const isGraphKruskalOperation = isGraphForm && /kruskal/.test(currentOperationName);
  const isGraphMstOverviewOperation = isGraphForm
    && (/overview|总览|综合/.test(currentOperationName) && /mst|min(imum)?\s*spanning\s*tree|最小生成树/.test(currentOperationName));
  const isGraphStartIndexRequired = isGraphForm && !isGraphFloydOperation;
  const isGraphOperation = isGraphForm && (
    isGraphAdjListOperation
    || isGraphAdjMatrixOperation
    || isGraphDfsOperation
    || isGraphBfsOperation
    || isGraphTraversalOverviewOperation
    || isGraphDijkstraOperation
    || isGraphBellmanFordOperation
    || isGraphFloydOperation
    || isGraphShortestPathOverviewOperation
    || isGraphPrimOperation
    || isGraphKruskalOperation
    || isGraphMstOverviewOperation
  );
  const isBstLikeContext = data.form === 'tree'
    && /bst|binary search tree|二叉搜索树|二叉查找树|avl|red-black|红黑/.test(`${String(data.caption).toLowerCase()} ${currentOperationName}`);
  const isAvlContext = /avl/.test(String(data.caption).toLowerCase());
  const isRedBlackContext = /red-black/.test(String(data.caption).toLowerCase());
  const isBinarySearchOperation = /binary|二分/.test(currentOperationName);
  const isQueryInsertOperation = /(query|search|查询|查找).*(insert|add|插入)|query\s*\/\s*insert|查询\s*\/\s*插入|查找\s*\/\s*插入/.test(currentOperationName);
  const isQueryDeleteOperation = /(query|search|查询|查找).*(delete|remove|删除)|query\s*\/\s*delete|查询\s*\/\s*删除|查找\s*\/\s*删除/.test(currentOperationName);
  const isValueDrivenSearchOperation = data.form === 'algorithm' && isSearchOperation;
  const isHashQueryOperation = data.form === 'hash' && (isQueryInsertOperation || isQueryDeleteOperation);
  const isTreeQueryOperation = data.form === 'tree' && (isQueryInsertOperation || isQueryDeleteOperation);
  const isBPlusTreeVisualization = data.form === 'tree' && /b\+|bplus|leaf/.test(String(data.caption).toLowerCase());
  const lockIndexInput = (isLinkedForm && isDeleteCurrentOperation)
    || isPatternMatchOperation
    || (isTreeTraversalOperation && !isTreeQueryOperation && !isTreeCrudOperation)
    || isHeapifyOperation
    || isHuffmanBuildOperation
    || isGraphFloydOperation
    || isFixedInsertOperation
    || isFixedDeleteOperation
    || isValueDrivenSearchOperation
    || isHashQueryOperation
    || isTreeQueryOperation;
  const lockValueInput = isFixedDeleteOperation
    || (isTreeTraversalOperation && !isTreeQueryOperation && !isTreeCrudOperation)
    || isHeapifyOperation
    || isHuffmanBuildOperation
    || isGraphOperation
    || (isTreeCrudOperation && /delete\s*node/.test(currentOperationName));
  const hashBucketCount = useMemo(() => {
    if (data.form !== 'hash') {
      return 0;
    }
    return getStableHashBucketCount(data.nodes.length);
  }, [data.form, data.nodes.length]);

  const externalSortRequiredWidth = useMemo(() => {
    if (!isExternalSortOperation) {
      return 0;
    }

    const maxOutputLength = currentFrames.reduce((maxLen, frame) => {
      const length = Array.isArray(frame.outputList)
        ? frame.outputList.length
        : Array.isArray(frame.arrayState)
        ? frame.arrayState.length
        : 0;
      return Math.max(maxLen, length);
    }, 0);

    const visibleCount = Math.max(maxOutputLength, 12);
    const outputRowWidth = visibleCount > 0
      ? 26 + visibleCount * 52 + Math.max(0, visibleCount - 1) * 10 + 26
      : 860;

    return Math.max(860, outputRowWidth);
  }, [currentFrames, isExternalSortOperation]);

  useEffect(() => {
    setDisplayNodes(data.nodes);
    setGeneralTreeParents(buildDefaultGeneralTreeParents(data.nodes, defaultUseBinaryTreeParents));
    generalTreePositionRef.current = new Map();
    binaryTreePositionRef.current = new Map();
    setSelectedNodeIndex(null);
    setRuntimeFrames(null);
    setIndexInput('');
    setValueInput('');
    setPatternMainInput('ababcabcacbab');
    setPatternSubInput('abcac');
    setStepIndex(0);
    setPlaying(false);
  }, [data.nodes, defaultUseBinaryTreeParents]);

  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
    setRuntimeFrames(null);
    generalTreePositionRef.current = new Map();
    binaryTreePositionRef.current = new Map();
  }, [operationIndex]);

  useEffect(() => {
    if (selectedNodeIndex === null) {
      return;
    }

    setIndexInput(String(selectedNodeIndex));
    if (selectedNodeIndex >= 0 && selectedNodeIndex < displayNodes.length) {
      setValueInput(displayNodes[selectedNodeIndex]);
    }
  }, [displayNodes, selectedNodeIndex]);

  useEffect(() => {
    const host = viewportRef.current;
    if (!host) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const hostWidth = Math.max(560, Math.floor(entry.contentRect.width - 2));
      const width = Math.max(hostWidth, externalSortRequiredWidth);
      const height = isTreeTraversalOperation ? 440 : 360;
      setViewportWidth(hostWidth);
      setCanvasSize({ width, height });
    });

    observer.observe(host);
    return () => observer.disconnect();
  }, [externalSortRequiredWidth, isTreeTraversalOperation]);

  useEffect(() => {
    const tick = (timestamp: number) => {
      const durationScale = d3.scaleLinear().domain([0, 100]).range([1650, 240]).clamp(true);
      const stepDuration = durationScale(speed);

      if (lastTickRef.current === 0) {
        lastTickRef.current = timestamp;
      }

      const elapsed = timestamp - lastTickRef.current;
      setPhase((timestamp % 1000) / 1000);

      if (playing && currentFrames.length > 0 && elapsed >= stepDuration) {
        setStepIndex((prev) => {
          const loopPlayback = runtimeFrames ? false : (currentOperation?.script?.loop ?? true);
          if (prev >= currentFrames.length - 1) {
            if (!loopPlayback) {
              const finalState = currentFrames[currentFrames.length - 1]?.arrayState;
              if (Array.isArray(finalState)) {
                setDisplayNodes(finalState);
              }
              setPlaying(false);
              return currentFrames.length - 1;
            }

            return 0;
          }

          return prev + 1;
        });
        lastTickRef.current = timestamp;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
      lastTickRef.current = 0;
    };
  }, [currentFrames, currentOperation?.script?.loop, playing, runtimeFrames, speed]);

  useEffect(() => {
    if (selectedNodeIndex === null) {
      return;
    }

    if (selectedNodeIndex >= displayNodes.length) {
      setSelectedNodeIndex(displayNodes.length > 0 ? displayNodes.length - 1 : null);
    }
  }, [displayNodes, selectedNodeIndex]);

  const frameNodes = useMemo(() => {
    const shouldUseScriptedArrayState = data.form === 'algorithm';

    if (
      (runtimeFrames || shouldUseScriptedArrayState)
      && Array.isArray(currentFrame?.arrayState)
      && currentFrame.arrayState.length > 0
    ) {
      return currentFrame.arrayState;
    }
    return displayNodes;
  }, [currentFrame?.arrayState, data.form, displayNodes, runtimeFrames]);

  const linkedDeleteCurrentTargetIndex = selectedNodeIndex;
  const linkedDeleteCurrentInvalid = isLinkedForm
    && isDeleteCurrentOperation
    && (
      linkedDeleteCurrentTargetIndex === null
      || linkedDeleteCurrentTargetIndex <= 0
      || linkedDeleteCurrentTargetIndex >= frameNodes.length
      || isNullLikeNode(frameNodes[linkedDeleteCurrentTargetIndex])
    );

  const fixedInsertValueInvalid = isFixedInsertOperation && toFiniteNumberOrNull(valueInput) === null;
  const valueDrivenNumericInvalid = (isValueDrivenSearchOperation || isHashQueryOperation || isTreeQueryOperation)
    && toFiniteNumberOrNull(valueInput) === null;
  const patternInputInvalid = isPatternMatchOperation
    && (
      normalizePatternText(patternMainInput).length === 0
      || normalizePatternText(patternSubInput).length === 0
      || normalizePatternText(patternSubInput).length > normalizePatternText(patternMainInput).length
    );

  const isGraphRuntimeActive = data.form === 'graph' && (playing || Boolean(runtimeFrames));

  const activeIndexSet = useMemo(() => {
    if (data.form === 'graph' && !isGraphRuntimeActive) {
      return selectedNodeIndex !== null ? new Set([selectedNodeIndex]) : new Set<number>();
    }

    const fromFrame = currentFrame?.activeIndices ?? [];
    if (fromFrame.length > 0) {
      return new Set(fromFrame);
    }

    if (displayNodes.length === 0) {
      return new Set<number>();
    }

    if (playing && currentFrames.length > 0) {
      return new Set([stepIndex % displayNodes.length]);
    }

    return selectedNodeIndex !== null ? new Set([selectedNodeIndex]) : new Set<number>();
  }, [
    currentFrame?.activeIndices,
    currentFrames.length,
    data.form,
    displayNodes.length,
    isGraphRuntimeActive,
    playing,
    runtimeFrames,
    selectedNodeIndex,
    stepIndex
  ]);

  const visitedIndexSet = useMemo(() => {
    if (data.form === 'graph' && !isGraphRuntimeActive) {
      return new Set<number>();
    }
    return new Set(currentFrame?.visitedIndices ?? []);
  }, [currentFrame?.visitedIndices, data.form, isGraphRuntimeActive]);

  const compareIndexSet = useMemo(
    () => new Set(currentFrame?.compareIndices ?? []),
    [currentFrame?.compareIndices]
  );

  const swapIndexSet = useMemo(() => {
    const pair = currentFrame?.swapIndices;
    return pair ? new Set(pair) : new Set<number>();
  }, [currentFrame?.swapIndices]);

  const graphLayout = useMemo(
    () => (data.form === 'graph' ? buildGraphLayout(frameNodes, canvasSize.width, canvasSize.height) : null),
    [canvasSize.height, canvasSize.width, data.form, frameNodes]
  );

  const resolveTargetIndex = (): number | null => {
    const parsed = Number(indexInput);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed < frameNodes.length) {
      return parsed;
    }

    if (selectedNodeIndex !== null && selectedNodeIndex >= 0 && selectedNodeIndex < frameNodes.length) {
      return selectedNodeIndex;
    }

    return null;
  };

  const treeCrudInsertPlayInvalid = useMemo(() => {
    if (!isTreeCrudOperation || !/insert\s*node/.test(currentOperationName)) {
      return false;
    }

    const targetIndex = resolveTargetIndex();
    if (targetIndex === null) {
      return true;
    }

    if (!valueInput.trim()) {
      return true;
    }

    const useGeneralTree = isGeneralTreeContext || isGeneralTreeTraversalOperation;
    if (useGeneralTree) {
      return false;
    }

    if (
      targetIndex < 0
      || targetIndex >= frameNodes.length
      || isHiddenTreeLabel(frameNodes[targetIndex])
    ) {
      return true;
    }

    const left = targetIndex * 2 + 1;
    const right = targetIndex * 2 + 2;
    const leftBusy = left < frameNodes.length && !isHiddenTreeLabel(frameNodes[left]);
    const rightBusy = right < frameNodes.length && !isHiddenTreeLabel(frameNodes[right]);
    return leftBusy && rightBusy;
  }, [
    currentFrame,
    currentOperationName,
    frameNodes,
    generalTreeParents,
    indexInput,
    isGeneralTreeContext,
    isGeneralTreeTraversalOperation,
    isTreeCrudOperation,
    selectedNodeIndex,
    valueInput
  ]);

  const graphStartIndexInvalid = useMemo(() => {
    if (!isGraphStartIndexRequired || !isGraphOperation) {
      return false;
    }
    if (indexInput.trim() === '') {
      return false;
    }
    const parsed = Number(indexInput);
    return !Number.isInteger(parsed) || parsed < 0 || parsed >= frameNodes.length;
  }, [frameNodes.length, indexInput, isGraphOperation, isGraphStartIndexRequired]);

  const graphResultSummary = useMemo(() => {
    if (!isGraphOperation || !Array.isArray(currentFrame?.runChains) || currentFrame.runChains.length === 0) {
      return null;
    }

    if (isGraphAdjListOperation) {
      const rows = currentFrame.runChains[1] ?? [];
      return rows.length > 0 ? `Adjacency List: ${rows.join(' | ')}` : null;
    }

    if (isGraphAdjMatrixOperation || isGraphFloydOperation) {
      const matrixRows = currentFrame.runChains.slice(1);
      if (matrixRows.length === 0) {
        return null;
      }
      return `Matrix: ${matrixRows.map((row) => `[${row.join(', ')}]`).join(' ')}`;
    }

    if (isGraphDijkstraOperation || isGraphBellmanFordOperation || isGraphShortestPathOverviewOperation) {
      const dist = currentFrame.runChains[1] ?? [];
      return dist.length > 0 ? `Distance Array: [${dist.join(', ')}]` : null;
    }

    if (isGraphPrimOperation || isGraphKruskalOperation || isGraphMstOverviewOperation) {
      const mstEdges = currentFrame.runChains[1] ?? [];
      const total = currentFrame.runChains[2]?.[0];
      const edgesText = mstEdges.length > 0 ? mstEdges.join(', ') : 'none';
      return `MST Edges: ${edgesText}${total ? ` | Total Weight: ${total}` : ''}`;
    }

    return null;
  }, [
    currentFrame?.runChains,
    isGraphAdjListOperation,
    isGraphAdjMatrixOperation,
    isGraphBellmanFordOperation,
    isGraphDijkstraOperation,
    isGraphFloydOperation,
    isGraphKruskalOperation,
    isGraphMstOverviewOperation,
    isGraphOperation,
    isGraphPrimOperation,
    isGraphShortestPathOverviewOperation
  ]);

  const executeOperation = () => {
    const targetIndex = resolveTargetIndex();

    if (isPatternMatchOperation) {
      const main = normalizePatternText(patternMainInput);
      const sub = normalizePatternText(patternSubInput);
      if (!main || !sub || sub.length > main.length) {
        return;
      }

      const frames = isKmpPatternMatchOperation
        ? buildKmpPatternMatchFrames(main, sub)
        : buildBfPatternMatchFrames(main, sub);
      if (frames.length === 0) {
        return;
      }

      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isHeapifyOperation) {
      const frames = buildHeapifyFrames(frameNodes);
      if (frames.length === 0) return;
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isHuffmanBuildOperation) {
      const frames = buildHuffmanBuildFrames(frameNodes);
      if (frames.length === 0) return;
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isTreeTraversalOperation && !isTreeQueryOperation && !isTreeCrudOperation) {
      let frames: VisualizationFrame[] = [];
      if (isGeneralTreeTraversalOperation) {
        frames = buildGeneralTreeTraversalFrames(
          frameNodes,
          currentFrame,
          generalTreeParents,
          /postorder/.test(currentOperationName) ? 'general-postorder' : 'general-preorder'
        );
      } else if (/preorder/.test(currentOperationName)) {
        frames = buildBinaryTraversalFrames(frameNodes, 'preorder');
      } else if (/inorder|thread/.test(currentOperationName)) {
        frames = buildBinaryTraversalFrames(frameNodes, 'inorder');
      } else if (/postorder/.test(currentOperationName)) {
        frames = buildBinaryTraversalFrames(frameNodes, 'postorder');
      }

      if (frames.length === 0) return;
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isTreeCrudOperation) {
      if (targetIndex === null) return;
      const op: 'insert' | 'delete' | 'modify' = /insert\s*node/.test(currentOperationName)
        ? 'insert'
        : /delete\s*node/.test(currentOperationName)
        ? 'delete'
        : 'modify';

      const parsedIndex = Number(indexInput);
      const hasExplicitIndexInput = indexInput.trim() !== '';
      const strictTreeTargetIndex = hasExplicitIndexInput
        ? (Number.isInteger(parsedIndex) && parsedIndex >= 0 && parsedIndex < frameNodes.length ? parsedIndex : null)
        : targetIndex;

      const value = valueInput.trim();
      if ((op === 'insert' || op === 'modify') && !value) return;
      if (strictTreeTargetIndex === null) return;

      const useGeneralTree = isGeneralTreeContext || isGeneralTreeTraversalOperation;
      const frames = useGeneralTree
        ? buildGeneralTreeCrudFrames(frameNodes, currentFrame, generalTreeParents, op, strictTreeTargetIndex, value)
        : buildBinaryTreeCrudFrames(frameNodes, op, strictTreeTargetIndex, value);

      if (frames.length === 0) return;
      const lastFrame = frames[frames.length - 1];
      if (Array.isArray(lastFrame.arrayState) && lastFrame.arrayState.length > 0) {
        setDisplayNodes([...lastFrame.arrayState]);
      }
      if (useGeneralTree) {
        const parentChain = lastFrame.runChains?.[0]?.map((item) => Number(item));
        if (Array.isArray(parentChain) && parentChain.length === (lastFrame.arrayState?.length ?? frameNodes.length)) {
          setGeneralTreeParents(parentChain);
        }
      }
      setSelectedNodeIndex(strictTreeTargetIndex);
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isGraphOperation) {
      const startNode = (() => {
        if (!isGraphStartIndexRequired) {
          return 0;
        }
        if (indexInput.trim() === '') {
          return 0;
        }
        const parsed = Number(indexInput);
        if (!Number.isInteger(parsed) || parsed < 0 || parsed >= frameNodes.length) {
          return null;
        }
        return parsed;
      })();

      if (startNode === null) {
        return;
      }

      let frames: VisualizationFrame[] = [];
      if (isGraphAdjListOperation) {
        frames = buildGraphAdjListFrames(frameNodes, startNode);
      } else if (isGraphAdjMatrixOperation) {
        frames = buildGraphAdjMatrixFrames(frameNodes, startNode);
      } else if (isGraphTraversalOverviewOperation) {
        frames = [...buildGraphDfsFrames(frameNodes, startNode), ...buildGraphBfsFrames(frameNodes, startNode)];
      } else if (isGraphDfsOperation) {
        frames = buildGraphDfsFrames(frameNodes, startNode);
      } else if (isGraphBfsOperation) {
        frames = buildGraphBfsFrames(frameNodes, startNode);
      } else if (isGraphShortestPathOverviewOperation) {
        frames = [
          ...buildGraphDijkstraFrames(frameNodes, startNode),
          ...buildGraphBellmanFordFrames(frameNodes, startNode),
          ...buildGraphFloydFrames(frameNodes)
        ];
      } else if (isGraphDijkstraOperation) {
        frames = buildGraphDijkstraFrames(frameNodes, startNode);
      } else if (isGraphBellmanFordOperation) {
        frames = buildGraphBellmanFordFrames(frameNodes, startNode);
      } else if (isGraphFloydOperation) {
        frames = buildGraphFloydFrames(frameNodes);
      } else if (isGraphMstOverviewOperation) {
        frames = [...buildGraphPrimFrames(frameNodes, startNode), ...buildGraphKruskalFrames(frameNodes)];
      } else if (isGraphPrimOperation) {
        frames = buildGraphPrimFrames(frameNodes, startNode);
      } else if (isGraphKruskalOperation) {
        frames = buildGraphKruskalFrames(frameNodes);
      }

      if (frames.length === 0) {
        return;
      }
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isLinkedForm && isInsertAtHeadOperation) {
      const numeric = toFiniteNumberOrNull(valueInput);
      if (numeric === null) {
        return;
      }

      const frames = buildLinkedInsertAfterHeadFrames(frameNodes, String(numeric));
      if (frames.length === 0) return;
      setSelectedNodeIndex(1);
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isLinkedForm && isStackInsertOperation) {
      const numeric = toFiniteNumberOrNull(valueInput);
      if (numeric === null) {
        return;
      }

      const targetIndex = resolveStackTopValueIndex(frameNodes);
      const frames = buildStackPushFrames(frameNodes, String(numeric));
      if (frames.length === 0) return;
      setSelectedNodeIndex(targetIndex);
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isLinkedForm && isQueueInsertOperation) {
      const numeric = toFiniteNumberOrNull(valueInput);
      if (numeric === null) {
        return;
      }

      const targetIndex = resolveQueueRearInsertIndex(frameNodes);
      const frames = buildQueueEnqueueFrames(frameNodes, String(numeric));
      if (frames.length === 0) return;
      setSelectedNodeIndex(targetIndex);
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isLinkedForm && isDeleteFromHeadOperation) {
      const frames = buildLinkedDeleteFromHeadFrames(frameNodes);
      if (frames.length === 0) return;
      setSelectedNodeIndex(1);
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isLinkedForm && isStackDeleteOperation) {
      const targetIndex = resolveStackTopValueIndex(frameNodes);
      const frames = buildStackPopFrames(frameNodes);
      if (frames.length === 0) return;
      setSelectedNodeIndex(targetIndex);
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isLinkedForm && isQueueDeleteOperation) {
      const targetIndex = resolveQueueFrontValueIndex(frameNodes);
      const frames = buildQueueDequeueFrames(frameNodes);
      if (frames.length === 0) return;
      setSelectedNodeIndex(targetIndex);
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isLinkedForm && isDeleteCurrentOperation) {
      if (targetIndex === null) {
        return;
      }

      const frames = buildLinkedDeleteCurrentFrames(frameNodes, targetIndex);
      if (frames.length === 0) return;
      setSelectedNodeIndex(targetIndex);
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isLinkedForm && isModifyOperation) {
      if (targetIndex === null) {
        return;
      }

      const value = valueInput.trim();
      if (!value) {
        return;
      }

      const frames = buildLinkedModifyFrames(frameNodes, targetIndex, value);
      if (frames.length === 0) return;
      setSelectedNodeIndex(targetIndex);
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isInteractiveArrayRuntimeForm && isModifyOperation) {
      if (targetIndex === null) {
        return;
      }

      const value = valueInput.trim();
      if (!value) {
        return;
      }

      const frames = buildModifyRuntimeFrames(frameNodes, targetIndex, value);
      if (frames.length === 0) return;
      setSelectedNodeIndex(targetIndex);
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isValueDrivenSearchOperation) {
      const numeric = toFiniteNumberOrNull(valueInput);
      if (numeric === null) {
        return;
      }

      const frames = isBinarySearchOperation
        ? buildBinarySearchByValueFrames(frameNodes, numeric)
        : buildLinearSearchByValueFrames(frameNodes, numeric);
      if (frames.length === 0) return;
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isHashQueryOperation) {
      const numeric = toFiniteNumberOrNull(valueInput);
      if (numeric === null) {
        return;
      }

      const frames = isQueryDeleteOperation
        ? buildHashQueryDeleteFrames(frameNodes, numeric, hashBucketCount)
        : buildHashQueryInsertFrames(frameNodes, numeric, hashBucketCount);
      if (frames.length === 0) return;
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isTreeQueryOperation) {
      const numeric = toFiniteNumberOrNull(valueInput);
      if (numeric === null) {
        return;
      }

      const frames = isBstLikeContext
        ? buildBstLikeQueryFrames(
          frameNodes,
          numeric,
          isRedBlackContext ? 'rb' : isAvlContext ? 'avl' : 'bst',
          isQueryDeleteOperation
        )
        : (isQueryDeleteOperation
        ? buildTreeQueryDeleteFrames(frameNodes, numeric, isBPlusTreeVisualization)
        : buildTreeQueryInsertFrames(frameNodes, numeric, isBPlusTreeVisualization));
      if (frames.length === 0) return;
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isInteractiveArrayRuntimeForm && isAccessOperation) {
      if (targetIndex === null) {
        return;
      }

      const frames = buildAccessRuntimeFrames(frameNodes, targetIndex);
      if (frames.length === 0) return;
      setSelectedNodeIndex(targetIndex);
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isInteractiveArrayRuntimeForm && isInsertOperation) {
      if (targetIndex === null) {
        return;
      }

      const value = valueInput.trim();
      if (!value) {
        return;
      }

      const frames = buildInsertRuntimeFrames(frameNodes, targetIndex, value);
      if (frames.length === 0) return;
      setSelectedNodeIndex(targetIndex);
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    if (isInteractiveArrayRuntimeForm && isDeleteOperation) {
      if (targetIndex === null) {
        return;
      }

      const frames = buildDeleteRuntimeFrames(frameNodes, targetIndex);
      if (frames.length === 0) return;
      setSelectedNodeIndex(targetIndex);
      setRuntimeFrames(frames);
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    setPlaying(true);
  };

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }

    executeOperation();
  };

  const handleReset = () => {
    setPlaying(false);
    setStepIndex(0);
    setRuntimeFrames(null);
    setDisplayNodes([...data.nodes]);
    setGeneralTreeParents(buildDefaultGeneralTreeParents(data.nodes, defaultUseBinaryTreeParents));
    generalTreePositionRef.current = new Map();
    binaryTreePositionRef.current = new Map();
    setSelectedNodeIndex(null);
    setIndexInput('');
    setValueInput('');
    setPatternMainInput('ababcabcacbab');
    setPatternSubInput('abcac');
    setPhase(0);
    lastTickRef.current = 0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const width = canvasSize.width;
    const height = canvasSize.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    hitRegionsRef.current = [];

    const pulse = 0.82 + 0.25 * Math.sin(phase * Math.PI * 2);
    const isHighlighted = (index: number) => activeIndexSet.has(index);
    const traversalOutputVisible = isTreeTraversalOperation && Array.isArray(currentFrame?.outputList) && currentFrame.outputList.length > 0;
    const traversalReservedBottom = traversalOutputVisible ? 120 : 16;

    const drawNodeBox = (x: number, y: number, w: number, h: number, label: string, index: number, pointer = false) => {
      const highlighted = isHighlighted(index);
      const visited = visitedIndexSet.has(index);
      const compared = compareIndexSet.has(index);
      const swapped = swapIndexSet.has(index);
      const selected = selectedNodeIndex === index;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      if (compared) {
        ctx.fillStyle = `rgba(245, 158, 11, ${0.2 * pulse})`;
      } else if (highlighted) {
        ctx.fillStyle = `rgba(22, 119, 255, ${0.18 * pulse})`;
      } else if (visited) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
      } else {
        ctx.fillStyle = '#f8fafc';
      }
      ctx.fill();
      ctx.lineWidth = selected || swapped ? 2.4 : 1.2;
      ctx.strokeStyle = selected ? '#1677ff' : swapped ? '#7c3aed' : '#c7d2fe';
      ctx.stroke();

      ctx.fillStyle = '#111827';
      ctx.font = '600 14px Microsoft YaHei, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + w / 2, y + h / 2);

      if (pointer) {
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.68, y + 4);
        ctx.lineTo(x + w * 0.68, y + h - 4);
        ctx.stroke();
      }
      ctx.restore();

      hitRegionsRef.current.push({ index, x, y, w, h, type: 'rect' });
    };

    const drawArrow = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      options?: { dashed?: boolean; color?: string; lineWidth?: number; headLength?: number; padding?: number }
    ) => {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLength = options?.headLength ?? 9;
      const padding = options?.padding ?? 18;
      const startX = x1 + Math.cos(angle) * padding;
      const startY = y1 + Math.sin(angle) * padding;
      const endX = x2 - Math.cos(angle) * padding;
      const endY = y2 - Math.sin(angle) * padding;

      ctx.save();
      ctx.strokeStyle = options?.color ?? '#64748b';
      ctx.lineWidth = options?.lineWidth ?? 1.6;
      if (options?.dashed) {
        ctx.setLineDash([6, 5]);
      }
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
      ctx.restore();
    };

    if (data.form === 'algorithm' && isPatternMatchOperation) {
      const fallbackMainChars = [...normalizePatternText(patternMainInput)];
      const textChars = (runtimeFrames && frameNodes.length > 0)
        ? frameNodes
        : (fallbackMainChars.length > 0 ? fallbackMainChars : frameNodes);
      const patternChars = currentFrame?.runChains?.[0] ?? [...normalizePatternText(patternSubInput)];
      const nextValues = isKmpPatternMatchOperation
        ? (currentFrame?.runChains?.[1] ?? Array.from({ length: patternChars.length }, () => '0'))
        : [];
      const matchedPositions = currentFrame?.outputList ?? [];
      const alignOffset = Math.max(0, currentFrame?.visitedIndices?.[0] ?? 0);
      const textActiveIndex = currentFrame?.activeIndices?.[0] ?? -1;
      const patternActiveIndex = currentFrame?.compareIndices?.[0] ?? -1;

      const maxLen = Math.max(textChars.length, patternChars.length + alignOffset, 1);
      const cellWidth = Math.max(30, Math.min(44, 620 / maxLen));
      const cellHeight = 42;
      const gap = 8;
      const rowWidth = maxLen * cellWidth + Math.max(0, maxLen - 1) * gap;
      const startX = Math.max(24, (width - rowWidth) / 2);
      const textRowY = 86;
      const patternRowY = 166;
      const nextRowY = 246;

      const drawCell = (x: number, y: number, label: string, highlighted: boolean, compared: boolean) => {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, cellWidth, cellHeight, 8);
        ctx.fillStyle = compared
          ? `rgba(245, 158, 11, ${0.2 * pulse})`
          : highlighted
          ? `rgba(22, 119, 255, ${0.2 * pulse})`
          : '#f8fafc';
        ctx.fill();
        ctx.lineWidth = highlighted || compared ? 2.2 : 1.1;
        ctx.strokeStyle = compared ? '#f59e0b' : highlighted ? '#1677ff' : '#cbd5e1';
        ctx.stroke();

        ctx.fillStyle = '#111827';
        ctx.font = '600 14px Microsoft YaHei, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + cellWidth / 2, y + cellHeight / 2);
        ctx.restore();
      };

      ctx.fillStyle = '#334155';
      ctx.font = '600 13px Microsoft YaHei, Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Text T', 24, textRowY - 12);
      ctx.fillText('Pattern P', 24, patternRowY - 12);

      textChars.forEach((ch, idx) => {
        const x = startX + idx * (cellWidth + gap);
        drawCell(x, textRowY, ch, idx === textActiveIndex, idx === textActiveIndex);

        ctx.fillStyle = '#64748b';
        ctx.font = '11px Microsoft YaHei, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`T[${idx}]`, x + cellWidth / 2, textRowY + cellHeight + 12);
      });

      patternChars.forEach((ch, idx) => {
        const column = alignOffset + idx;
        const x = startX + column * (cellWidth + gap);
        drawCell(x, patternRowY, ch, idx === patternActiveIndex, idx === patternActiveIndex);

        ctx.fillStyle = '#64748b';
        ctx.font = '11px Microsoft YaHei, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`P[${idx}]`, x + cellWidth / 2, patternRowY + cellHeight + 12);
      });

      if (isKmpPatternMatchOperation) {
        ctx.fillStyle = '#334155';
        ctx.font = '600 13px Microsoft YaHei, Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('next array', 24, nextRowY - 12);

        nextValues.forEach((value, idx) => {
          const x = startX + idx * (cellWidth + gap);
          drawCell(x, nextRowY, value, idx === patternActiveIndex, false);

          ctx.fillStyle = '#64748b';
          ctx.font = '11px Microsoft YaHei, Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`next[${idx}]`, x + cellWidth / 2, nextRowY + cellHeight + 12);
        });
      }

      ctx.fillStyle = '#334155';
      ctx.font = '600 12px Microsoft YaHei, Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Match indices: ${matchedPositions.length > 0 ? matchedPositions.join(', ') : 'none'}`, 24, height - 24);
    } else if (data.form === 'algorithm' && isExternalSortOperation) {
      const runChains = Array.isArray(currentFrame?.runChains) && currentFrame.runChains.length > 0
        ? currentFrame.runChains
        : [
          ['3', '9', '18', '27'],
          ['1', '7', '15', '24'],
          ['2', '8', '16', '25'],
          ['4', '10', '19', '28']
        ];
      const outputList = Array.isArray(currentFrame?.outputList)
        ? currentFrame.outputList
        : (Array.isArray(currentFrame?.arrayState) ? currentFrame.arrayState : []);
      const runLabels = (data.nodes.length >= runChains.length ? data.nodes.slice(0, runChains.length) : runChains.map((_, i) => `Run${i + 1}`));

      const runCount = runChains.length;
      const runBoxW = 74;
      const runBoxH = 40;
      const runGapX = 18;
      const runGapY = 12;
      const totalRunWidth = runCount * runBoxW + Math.max(0, runCount - 1) * runGapX;
      const startX = Math.max(20, (width - totalRunWidth) / 2);
      const topLabelY = 24;
      const headY = 52;

      runChains.forEach((chain, runIndex) => {
        const x = startX + runIndex * (runBoxW + runGapX);
        const highlightedRun = activeIndexSet.has(runIndex);

        ctx.fillStyle = '#334155';
        ctx.font = '600 12px Microsoft YaHei, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(runLabels[runIndex] ?? `Run${runIndex + 1}`, x + runBoxW / 2, topLabelY);

        chain.forEach((value, chainIndex) => {
          const y = headY + chainIndex * (runBoxH + runGapY);
          const isHead = chainIndex === 0;

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(x, y, runBoxW, runBoxH, 8);
          ctx.fillStyle = highlightedRun && isHead ? `rgba(22, 119, 255, ${0.18 * pulse})` : '#f8fafc';
          ctx.fill();
          ctx.lineWidth = highlightedRun && isHead ? 2.2 : 1.2;
          ctx.strokeStyle = highlightedRun && isHead ? '#1677ff' : '#cbd5e1';
          ctx.stroke();

          ctx.fillStyle = '#111827';
          ctx.font = '600 14px Microsoft YaHei, Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(value), x + runBoxW / 2, y + runBoxH / 2);
          ctx.restore();

          if (chainIndex < chain.length - 1) {
            ctx.save();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(x + runBoxW / 2, y + runBoxH + 2);
            ctx.lineTo(x + runBoxW / 2, y + runBoxH + runGapY - 2);
            ctx.stroke();
            ctx.restore();
          }
        });
      });

      const outputY = Math.max(238, headY + 4 * (runBoxH + runGapY) + 24);
      ctx.fillStyle = '#334155';
      ctx.font = '600 12px Microsoft YaHei, Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Merged Output (current round):', 26, outputY - 12);

      const outBoxW = 52;
      const outBoxH = 36;
      const outGap = 10;
      const outStartX = 26;
      outputList.forEach((value, idx) => {
        const x = outStartX + idx * (outBoxW + outGap);
        const highlighted = idx === outputList.length - 1;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, outputY, outBoxW, outBoxH, 7);
        ctx.fillStyle = highlighted ? `rgba(16, 185, 129, ${0.18 * pulse})` : '#f8fafc';
        ctx.fill();
        ctx.lineWidth = highlighted ? 2 : 1.2;
        ctx.strokeStyle = highlighted ? '#10b981' : '#cbd5e1';
        ctx.stroke();

        ctx.fillStyle = '#111827';
        ctx.font = '600 13px Microsoft YaHei, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(value), x + outBoxW / 2, outputY + outBoxH / 2);
        ctx.restore();
      });
    } else if (data.form === 'sequential' || data.form === 'algorithm') {
      const sizeScale = d3.scaleLinear().domain([1, 16]).range([70, 42]).clamp(true);
      const cellWidth = sizeScale(frameNodes.length || 1);
      const gap = 12;
      const cellHeight = 52;
      const totalWidth = frameNodes.length * cellWidth + Math.max(0, frameNodes.length - 1) * gap;
      const startX = Math.max(24, (width - totalWidth) / 2);
      const y = height / 2 - cellHeight / 2;

      frameNodes.forEach((node, index) => {
        const x = startX + index * (cellWidth + gap);
        drawNodeBox(x, y, cellWidth, cellHeight, node, index);

        ctx.fillStyle = '#64748b';
        ctx.font = '11px Microsoft YaHei, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`a[${index}]`, x + cellWidth / 2, y - 8);
      });
    } else if (data.form === 'hash') {
      const bucketCount = hashBucketCount || getStableHashBucketCount(frameNodes.length);
      const buckets: string[][] = Array.from({ length: bucketCount }, () => []);

      frameNodes.forEach((value) => {
        const numeric = Number(value);
        const hashValue = Number.isFinite(numeric)
          ? Math.abs(Math.trunc(numeric))
          : Array.from(String(value)).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        buckets[hashValue % bucketCount].push(String(value));
      });

      const bucketWidth = 78;
      const bucketHeight = 40;
      const bucketGap = 12;
      const chainNodeHeight = 34;
      const chainGap = 10;
      const totalWidth = bucketCount * bucketWidth + Math.max(0, bucketCount - 1) * bucketGap;
      const startX = Math.max(20, (width - totalWidth) / 2);
      const topY = 42;

      buckets.forEach((chain, bucketIndex) => {
        const x = startX + bucketIndex * (bucketWidth + bucketGap);

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, topY, bucketWidth, bucketHeight, 8);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.font = '600 12px Microsoft YaHei, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`bucket ${bucketIndex}`, x + bucketWidth / 2, topY + bucketHeight / 2);
        ctx.restore();

        let prevX = x + bucketWidth / 2;
        let prevY = topY + bucketHeight;

        chain.forEach((value, chainIndex) => {
          const nodeY = topY + bucketHeight + 18 + chainIndex * (chainNodeHeight + chainGap);
          const nodeX = x + 8;
          const nodeW = bucketWidth - 16;
          const globalIndex = frameNodes.findIndex((item) => item === value);
          const isActive = globalIndex >= 0 && activeIndexSet.has(globalIndex);
          const isVisited = globalIndex >= 0 && visitedIndexSet.has(globalIndex);

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(nodeX, nodeY, nodeW, chainNodeHeight, 7);
          ctx.fillStyle = isActive
            ? `rgba(22, 119, 255, ${0.2 * pulse})`
            : isVisited
            ? 'rgba(16, 185, 129, 0.14)'
            : '#eef2ff';
          ctx.fill();
          ctx.lineWidth = isActive ? 2.2 : 1.1;
          ctx.strokeStyle = isActive ? '#1677ff' : '#a5b4fc';
          ctx.stroke();

          ctx.fillStyle = '#0f172a';
          ctx.font = '600 13px Microsoft YaHei, Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(value, nodeX + nodeW / 2, nodeY + chainNodeHeight / 2);
          ctx.restore();

          drawArrow(prevX, prevY + 2, nodeX + nodeW / 2, nodeY - 4);
          prevX = nodeX + nodeW / 2;
          prevY = nodeY + chainNodeHeight;
        });
      });
    } else if (data.form === 'linked') {
      const nodeW = 88;
      const nodeH = 44;
      const gap = 26;
      const totalWidth = frameNodes.length * nodeW + Math.max(0, frameNodes.length - 1) * gap;
      const startX = Math.max(24, (width - totalWidth) / 2);
      const y = height / 2 - nodeH / 2;

      frameNodes.forEach((node, index) => {
        const x = startX + index * (nodeW + gap);
        drawNodeBox(x, y, nodeW, nodeH, node, index, true);

        if (index < frameNodes.length - 1) {
          drawArrow(x + nodeW + 4, y + nodeH / 2, x + nodeW + gap - 6, y + nodeH / 2);
        }
      });
    } else if (data.form === 'tree') {
      if (isHuffmanBuildOperation) {
        const sourceValues = (Array.isArray(currentFrame?.arrayState) && currentFrame.arrayState.length > 0
          ? currentFrame.arrayState
          : frameNodes).map((item) => String(item));
        const queueValues = Array.isArray(currentFrame?.outputList)
          ? currentFrame.outputList.map((item) => String(item))
          : [];

        const cellW = 62;
        const cellH = 38;
        const gap = 10;
        const totalInputW = sourceValues.length * cellW + Math.max(0, sourceValues.length - 1) * gap;
        const inputStartX = Math.max(24, (width - totalInputW) / 2);
        const inputY = 76;

        ctx.fillStyle = '#334155';
        ctx.font = '600 13px Microsoft YaHei, Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('Input frequency row', 24, inputY - 20);

        sourceValues.forEach((value, index) => {
          const x = inputStartX + index * (cellW + gap);
          const highlighted = activeIndexSet.has(index) || visitedIndexSet.has(index);

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(x, inputY, cellW, cellH, 8);
          ctx.fillStyle = highlighted ? `rgba(22, 119, 255, ${0.2 * pulse})` : '#f8fafc';
          ctx.fill();
          ctx.lineWidth = highlighted ? 2.2 : 1.2;
          ctx.strokeStyle = highlighted ? '#1677ff' : '#cbd5e1';
          ctx.stroke();

          ctx.fillStyle = '#111827';
          ctx.font = '600 14px Microsoft YaHei, Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(value, x + cellW / 2, inputY + cellH / 2);
          ctx.restore();
        });

        const queueY = inputY + 102;
        ctx.fillStyle = '#334155';
        ctx.font = '600 13px Microsoft YaHei, Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('Current merge tree', 24, queueY - 20);

        type HuffExprNode = { token: string; left?: HuffExprNode; right?: HuffExprNode; weight?: number };

        const leafWeightMap = new Map<string, number>();
        sourceValues.forEach((value, index) => {
          const numeric = Number(value);
          if (Number.isFinite(numeric)) {
            leafWeightMap.set(`n${index}`, numeric);
          }
        });

        const extractExprToken = (raw: string): string => {
          const trimmed = raw.trim();
          const colonPos = trimmed.indexOf(':');
          return colonPos >= 0 ? trimmed.slice(0, colonPos).trim() : trimmed;
        };

        const parseHuffExpr = (expr: string): HuffExprNode | null => {
          const source = expr.replace(/\s+/g, '');
          if (!source) {
            return null;
          }

          let cursor = 0;
          const parseNode = (): HuffExprNode | null => {
            if (cursor >= source.length) {
              return null;
            }

            if (source[cursor] === 'n') {
              let end = cursor + 1;
              while (end < source.length && /\d/.test(source[end])) {
                end += 1;
              }
              const token = source.slice(cursor, end);
              cursor = end;
              return { token };
            }

            if (source[cursor] === '(') {
              cursor += 1;
              const left = parseNode();
              if (!left || source[cursor] !== '+') {
                return null;
              }
              cursor += 1;
              const right = parseNode();
              if (!right || source[cursor] !== ')') {
                return null;
              }
              cursor += 1;
              return { token: '+', left, right };
            }

            return null;
          };

          const rootExpr = parseNode();
          if (!rootExpr || cursor !== source.length) {
            return null;
          }
          return rootExpr;
        };

        const computeWeight = (node: HuffExprNode): number => {
          if (!node.left && !node.right) {
            const leafWeight = leafWeightMap.get(node.token) ?? Number.NaN;
            node.weight = Number.isFinite(leafWeight) ? leafWeight : 0;
            return node.weight;
          }

          const leftWeight = node.left ? computeWeight(node.left) : 0;
          const rightWeight = node.right ? computeWeight(node.right) : 0;
          node.weight = leftWeight + rightWeight;
          return node.weight;
        };

        const countLeaves = (node: HuffExprNode | null): number => {
          if (!node) return 0;
          if (!node.left && !node.right) return 1;
          return countLeaves(node.left ?? null) + countLeaves(node.right ?? null);
        };

        const candidateExprNodes = queueValues
          .map(extractExprToken)
          .map((token) => parseHuffExpr(token))
          .filter((node): node is HuffExprNode => node !== null);

        const treeRoot = candidateExprNodes.length > 0
          ? candidateExprNodes.reduce((best, current) => (countLeaves(current) > countLeaves(best) ? current : best))
          : null;

        if (!treeRoot) {
          ctx.fillStyle = '#64748b';
          ctx.font = '12px Microsoft YaHei, Arial';
          ctx.fillText('No merge tree available in this frame.', 24, queueY + 6);
        } else {
          computeWeight(treeRoot);
          const d3Root = d3.hierarchy(treeRoot, (node) => {
            const children: HuffExprNode[] = [];
            if (node.left) children.push(node.left);
            if (node.right) children.push(node.right);
            return children.length > 0 ? children : null;
          });

          const treeHeight = Math.max(130, height - queueY - 72);
          const treeLayout = d3.tree<HuffExprNode>().size([width - 120, treeHeight]);
          treeLayout(d3Root);

          d3Root.links().forEach((link) => {
            drawArrow(
              (link.source.x ?? 0) + 60,
              (link.source.y ?? 0) + queueY + 14,
              (link.target.x ?? 0) + 60,
              (link.target.y ?? 0) + queueY + 14
            );
          });

          d3Root.descendants().forEach((node) => {
            const x = (node.x ?? 0) + 60;
            const y = (node.y ?? 0) + queueY + 14;
            const isLeaf = !node.data.left && !node.data.right;
            const label = isLeaf
              ? `${Math.trunc(node.data.weight ?? 0)}`
              : `${Math.trunc(node.data.weight ?? 0)}`;

            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, isLeaf ? 18 : 20, 0, Math.PI * 2);
            ctx.fillStyle = isLeaf ? '#dbeafe' : `rgba(16, 185, 129, ${0.22 * pulse})`;
            ctx.fill();
            ctx.lineWidth = 1.6;
            ctx.strokeStyle = isLeaf ? '#6366f1' : '#059669';
            ctx.stroke();

            ctx.fillStyle = '#1f2937';
            ctx.font = '600 13px Microsoft YaHei, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x, y);
            ctx.restore();
          });
        }

        // const footerY = height - 26;
        ctx.fillStyle = '#334155';
        ctx.font = '600 12px Microsoft YaHei, Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        // ctx.fillText('Huffman tree is built by repeatedly merging two minimum weights from the row.', 24, footerY);
      } else {
      const hasGeneralTreeState = Boolean(
        currentFrame?.runChains
        && currentFrame.runChains.length > 0
        && currentFrame.runChains[0].length === frameNodes.length
      );
      if (isGeneralTreeContext || isGeneralTreeTraversalOperation || hasGeneralTreeState) {
        const { labels, parents } = parseGeneralTreeState(frameNodes, currentFrame, generalTreeParents);
        const entries = labels
          .map((label, index) => ({ id: String(index), label, parent: parents[index], index }))
          .filter((item) => !isHiddenTreeLabel(item.label) && item.parent >= -1);

        const visibleIdSet = new Set(entries.map((item) => item.id));
        const sanitizedEntries = entries.map((item) => {
          if (item.parent === -1) return item;
          return visibleIdSet.has(String(item.parent))
            ? item
            : { ...item, parent: -1 };
        });

        if (sanitizedEntries.length === 0) {
          ctx.fillStyle = '#6b7280';
          ctx.font = '14px Microsoft YaHei, Arial';
          ctx.textAlign = 'center';
          ctx.fillText('No nodes available in current general tree state.', width / 2, height / 2);
          return;
        }

        const stratify = d3
          .stratify<{ id: string; parentId?: string; label: string; index: number }>()
          .id((d) => d.id)
          .parentId((d) => d.parentId);

        const stratifyData = sanitizedEntries.map((item) => ({
          id: item.id,
          label: item.label,
          index: item.index,
          parentId: item.parent === -1 ? undefined : String(item.parent)
        }));

        try {
          const root = stratify(stratifyData);
          const visibleIds = root.descendants().map((node) => Number(node.data.index));
          const stablePositions = updateGeneralTreeStablePositions(
            labels,
            parents,
            generalTreePositionRef.current,
            width,
            height,
            traversalReservedBottom
          );
          generalTreePositionRef.current = stablePositions;

          root.links().forEach((link) => {
            const sourceIndex = Number(link.source.data.index);
            const targetIndex = Number(link.target.data.index);
            const sourcePos = stablePositions.get(sourceIndex);
            const targetPos = stablePositions.get(targetIndex);
            if (!sourcePos || !targetPos) {
              return;
            }

            drawArrow(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y);
          });

          visibleIds.forEach((originalIndex) => {
            const nodePos = stablePositions.get(originalIndex);
            if (!nodePos) {
              return;
            }
            const { x, y } = nodePos;
            const highlighted = isHighlighted(originalIndex);
            const visited = visitedIndexSet.has(originalIndex);
            const selected = selectedNodeIndex === originalIndex;
            const emphasizeTraversal = isTreeTraversalOperation && highlighted;

            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, emphasizeTraversal ? 22 : 20, 0, Math.PI * 2);
            if (emphasizeTraversal) {
              ctx.fillStyle = '#2563eb';
            } else if (selected) {
              ctx.fillStyle = '#bfdbfe';
            } else if (visited) {
              ctx.fillStyle = '#dbeafe';
            } else if (highlighted) {
              ctx.fillStyle = `rgba(22, 119, 255, ${0.3 * pulse})`;
            } else {
              ctx.fillStyle = '#dbeafe';
            }
            ctx.fill();
            ctx.lineWidth = emphasizeTraversal ? 3.2 : (selected ? 3.8 : 1.6);
            ctx.strokeStyle = emphasizeTraversal ? '#f59e0b' : (selected ? '#1d4ed8' : '#4f46e5');
            ctx.stroke();

            ctx.fillStyle = emphasizeTraversal ? '#ffffff' : '#1f2937';
            ctx.font = '600 13px Microsoft YaHei, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labels[originalIndex], x, y);
            ctx.restore();

            hitRegionsRef.current.push({ index: originalIndex, x, y, w: 0, h: 0, type: 'circle', r: 20 });
          });
        } catch (error) {
          ctx.fillStyle = '#6b7280';
          ctx.font = '14px Microsoft YaHei, Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Tree layout fallback: invalid relation graph was auto-recovered.', width / 2, height / 2);
          console.warn('[SectionVisualizationModule] General tree layout fallback triggered.', error);
        }
      } else {
      const isMultiwayTreeContext = /b\+|b-?tree|多键|leaf|separator/.test(`${data.caption} ${currentOperationName}`.toLowerCase())
        || (isTreeQueryOperation && !isBstLikeContext);
      const hasBracketSnapshotNodes = frameNodes.some((node) => /\[.*\]/.test(String(node)));
      const isMultiwayTreeView = isMultiwayTreeContext;

      if (isMultiwayTreeView) {
        const renderNodes = hasBracketSnapshotNodes
          ? frameNodes
          : toTreeSnapshot(
            isBPlusTreeVisualization
              ? buildBPlusState(normalizeTreeValues(frameNodes))
              : buildBTreeState(normalizeTreeValues(frameNodes)),
            isBPlusTreeVisualization
          );
        const normalizedLabels = renderNodes.map((node) => String(node).replace(/^(I:|L:)/, ''));
        const rootLabel = normalizedLabels[0] ?? '[]';
        const childLabels = normalizedLabels.slice(1);

        const rootW = Math.max(66, Math.min(140, 20 + rootLabel.length * 11));
        const rootH = 40;
        const rootX = (width - rootW) / 2;
        const rootY = 52;

        const drawMultiwayNode = (x: number, y: number, label: string, index: number) => {
          const nodeW = Math.max(66, Math.min(150, 20 + label.length * 11));
          const highlighted = isHighlighted(index);
          const selected = selectedNodeIndex === index;

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(x, y, nodeW, 40, 14);
          ctx.fillStyle = selected
            ? '#bfdbfe'
            : highlighted
            ? `rgba(22, 119, 255, ${0.28 * pulse})`
            : '#dbeafe';
          ctx.fill();
          ctx.lineWidth = selected ? 3.4 : 1.7;
          ctx.strokeStyle = selected ? '#1d4ed8' : '#4f46e5';
          ctx.stroke();

          ctx.fillStyle = '#1f2937';
          ctx.font = '600 13px Microsoft YaHei, Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, x + nodeW / 2, y + 20);
          ctx.restore();

          hitRegionsRef.current.push({ index, x, y, w: nodeW, h: 40, type: 'rect' });
          return nodeW;
        };

        const rootRenderedW = drawMultiwayNode(rootX, rootY, rootLabel, 0);

        if (childLabels.length > 0) {
          const childWidths = childLabels.map((label) => Math.max(66, Math.min(150, 20 + label.length * 11)));
          const gap = 26;
          const totalWidth = childWidths.reduce((sum, item) => sum + item, 0) + Math.max(0, childWidths.length - 1) * gap;
          const startX = Math.max(20, (width - totalWidth) / 2);
          const childY = 220;

          let cursorX = startX;
          const childCenters: Array<{ cx: number; cy: number }> = [];

          childLabels.forEach((label, i) => {
            const w = drawMultiwayNode(cursorX, childY, label, i + 1);
            childCenters.push({ cx: cursorX + w / 2, cy: childY + 20 });
            cursorX += w + gap;
          });

          childCenters.forEach(({ cx, cy }) => {
            drawArrow(rootX + rootRenderedW / 2, rootY + rootH + 2, cx, cy - 24);
          });

          if (isBPlusTreeVisualization && childCenters.length > 1) {
            for (let i = 0; i < childCenters.length - 1; i += 1) {
              drawArrow(
                childCenters[i].cx + childWidths[i] / 2 - 10,
                childCenters[i].cy,
                childCenters[i + 1].cx - childWidths[i + 1] / 2 + 10,
                childCenters[i + 1].cy
              );
            }
          }
        }
      } else {
        const visibleIndices = frameNodes
          .map((item, index) => ({ item, index }))
          .filter((item) => !isHiddenTreeLabel(item.item))
          .map((item) => item.index);
        if (visibleIndices.length > 0) {
          const stableBinaryPositions = buildStableBinaryPositions(frameNodes, width, height, traversalReservedBottom);
          binaryTreePositionRef.current = stableBinaryPositions;

          const isThreadedTraversalView = isTreeTraversalOperation && /thread/.test(currentOperationName);
          const nodePositionByIndex = new Map<number, { x: number; y: number }>();

          visibleIndices.forEach((index) => {
            const parent = index === 0 ? -1 : Math.floor((index - 1) / 2);
            if (parent < 0 || !stableBinaryPositions.has(parent)) {
              return;
            }
            const sourcePos = stableBinaryPositions.get(parent);
            const targetPos = stableBinaryPositions.get(index);
            if (!sourcePos || !targetPos) {
              return;
            }
            drawArrow(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y);
          });

          visibleIndices.forEach((originalIndex) => {
            const nodePos = stableBinaryPositions.get(originalIndex);
            if (!nodePos) {
              return;
            }
            const { x, y } = nodePos;
            const highlighted = isHighlighted(originalIndex);
            const visited = visitedIndexSet.has(originalIndex);
            const selected = selectedNodeIndex === originalIndex;
            const emphasizeTraversal = isTreeTraversalOperation && highlighted;
            const nodeColors = currentFrame?.runChains?.[1]
              ?? (isRedBlackContext ? buildPseudoRbColorChain(frameNodes) : []);
            const nodeColor = nodeColors[originalIndex]?.toLowerCase();

            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, emphasizeTraversal ? 22 : 20, 0, Math.PI * 2);
            if (emphasizeTraversal) {
              ctx.fillStyle = '#2563eb';
            } else if (selected) {
              ctx.fillStyle = '#bfdbfe';
            } else if (visited) {
              ctx.fillStyle = '#dbeafe';
            } else if (highlighted) {
              ctx.fillStyle = `rgba(22, 119, 255, ${0.3 * pulse})`;
            } else if (nodeColor === 'red') {
              ctx.fillStyle = '#f87171';
            } else if (nodeColor === 'black') {
              ctx.fillStyle = '#94a3b8';
            } else {
              ctx.fillStyle = '#dbeafe';
            }
            ctx.fill();
            ctx.lineWidth = emphasizeTraversal ? 3.2 : (selected ? 3.8 : 1.6);
            ctx.strokeStyle = emphasizeTraversal ? '#f59e0b' : (selected ? '#1d4ed8' : '#4f46e5');
            ctx.stroke();

            ctx.fillStyle = emphasizeTraversal ? '#ffffff' : '#1f2937';
            ctx.font = '600 13px Microsoft YaHei, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(frameNodes[originalIndex], x, y);
            ctx.restore();

            nodePositionByIndex.set(originalIndex, { x, y });
            hitRegionsRef.current.push({ index: originalIndex, x, y, w: 0, h: 0, type: 'circle', r: 20 });
          });

          if (isThreadedTraversalView && nodePositionByIndex.size > 0) {
            const inorderIndices: number[] = [];
            const inorderWalk = (index: number) => {
              if (index >= frameNodes.length || isHiddenTreeLabel(frameNodes[index] ?? '')) return;
              inorderWalk(index * 2 + 1);
              inorderIndices.push(index);
              inorderWalk(index * 2 + 2);
            };
            inorderWalk(0);

            const isLeafIndex = (index: number) => {
              const left = index * 2 + 1;
              const right = index * 2 + 2;
              const hasLeft = left < frameNodes.length && !isHiddenTreeLabel(frameNodes[left] ?? '');
              const hasRight = right < frameNodes.length && !isHiddenTreeLabel(frameNodes[right] ?? '');
              return !hasLeft && !hasRight;
            };

            const leafInorder = inorderIndices.filter((index) => isLeafIndex(index));
            if (leafInorder.length > 0) {
              const panelTop = height - traversalReservedBottom + 8;
              const maxNodeY = Math.max(...Array.from(nodePositionByIndex.values()).map((p) => p.y));
              const anchorY = Math.min(panelTop - 26, maxNodeY + 52);
              const head = { x: 44, y: anchorY };
              const tail = { x: width - 44, y: anchorY };

              const drawVirtualNode = (x: number, y: number, label: string) => {
                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y, 16, 0, Math.PI * 2);
                ctx.fillStyle = '#f8fafc';
                ctx.fill();
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = '#94a3b8';
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#475569';
                ctx.font = '600 11px Microsoft YaHei, Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, x, y);
                ctx.restore();
              };

              drawVirtualNode(head.x, head.y, 'head');
              drawVirtualNode(tail.x, tail.y, 'tail');

              leafInorder.forEach((leafIndex) => {
                const leafPos = nodePositionByIndex.get(leafIndex);
                if (!leafPos) {
                  return;
                }

                const orderPos = inorderIndices.indexOf(leafIndex);
                if (orderPos < 0) {
                  return;
                }

                const predecessorIndex = orderPos > 0 ? inorderIndices[orderPos - 1] : null;
                const successorIndex = orderPos < inorderIndices.length - 1 ? inorderIndices[orderPos + 1] : null;
                const predecessorPos = predecessorIndex === null ? head : nodePositionByIndex.get(predecessorIndex) ?? head;
                const successorPos = successorIndex === null ? tail : nodePositionByIndex.get(successorIndex) ?? tail;

                drawArrow(leafPos.x - 8, leafPos.y + 12, predecessorPos.x, predecessorPos.y, {
                  dashed: true,
                  color: '#8b5cf6',
                  lineWidth: 1.4,
                  headLength: 7,
                  padding: 20
                });

                drawArrow(leafPos.x + 8, leafPos.y + 12, successorPos.x, successorPos.y, {
                  dashed: true,
                  color: '#0ea5e9',
                  lineWidth: 1.4,
                  headLength: 7,
                  padding: 20
                });
              });

              ctx.save();
              ctx.fillStyle = '#64748b';
              ctx.font = '12px Microsoft YaHei, Arial';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              // ctx.fillText('Dashed pointers = inorder threads (leaf -> predecessor/successor)', 24, anchorY - 24);
              ctx.restore();
            }
          }
        }
      }
      }
      }

      if (isTreeTraversalOperation && Array.isArray(currentFrame?.outputList) && currentFrame.outputList.length > 0) {
        const output = currentFrame.outputList;
        const panelTop = height - traversalReservedBottom + 8;
        const boxW = 38;
        const boxH = 30;
        const gap = 8;
        const total = output.length * boxW + Math.max(0, output.length - 1) * gap;
        const startX = Math.max(24, (width - total) / 2);
        const y = panelTop + 34;

        ctx.save();
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(20, panelTop - 8);
        ctx.lineTo(width - 20, panelTop - 8);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#334155';
        ctx.font = '600 12px Microsoft YaHei, Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('Traversal Output:', 24, y - 12);

        output.forEach((value, idx) => {
          const x = startX + idx * (boxW + gap);
          const isLast = idx === output.length - 1;

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(x, y, boxW, boxH, 7);
          ctx.fillStyle = isLast ? '#2563eb' : '#eef2ff';
          ctx.fill();
          ctx.lineWidth = isLast ? 2.2 : 1.2;
          ctx.strokeStyle = isLast ? '#f59e0b' : '#cbd5e1';
          ctx.stroke();

          ctx.fillStyle = isLast ? '#ffffff' : '#0f172a';
          ctx.font = '600 12px Microsoft YaHei, Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(value), x + boxW / 2, y + boxH / 2);
          ctx.restore();
        });
      }
    } else if (data.form === 'graph' && graphLayout) {
      const nodeById = new Map(graphLayout.nodes.map((node, index) => [node.id, { ...node, index }]));
      const selectedEdgeKeys = new Set((currentFrame?.runChains?.[0] ?? []).map((item) => String(item)));
      const nodeRadius = 18;

      graphLayout.links.forEach((link) => {
        const source = nodeById.get(link.source);
        const target = nodeById.get(link.target);
        if (!source || !target) {
          return;
        }

        const isSelectedEdge = selectedEdgeKeys.has(link.key);
        const isOutgoingFromActive = activeIndexSet.has(link.fromIndex);
        const highlighted = isSelectedEdge || isOutgoingFromActive;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const ux = dx / distance;
        const uy = dy / distance;
        const startX = source.x + ux * nodeRadius;
        const startY = source.y + uy * nodeRadius;
        const endX = target.x - ux * (nodeRadius + 8);
        const endY = target.y - uy * (nodeRadius + 8);
        const edgeColor = highlighted ? '#f59e0b' : '#9ca3af';

        ctx.save();
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = highlighted ? 2.4 : 1.4;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        const arrowLength = 10;
        const arrowAngle = Math.PI / 7;
        ctx.fillStyle = edgeColor;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - arrowLength * Math.cos(Math.atan2(uy, ux) - arrowAngle),
          endY - arrowLength * Math.sin(Math.atan2(uy, ux) - arrowAngle)
        );
        ctx.lineTo(
          endX - arrowLength * Math.cos(Math.atan2(uy, ux) + arrowAngle),
          endY - arrowLength * Math.sin(Math.atan2(uy, ux) + arrowAngle)
        );
        ctx.closePath();
        ctx.fill();

        const mx = startX + (endX - startX) * 0.34;
        const my = startY + (endY - startY) * 0.34;
        ctx.fillStyle = '#111827';
        ctx.font = '600 12px Microsoft YaHei, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(link.weight), mx + (-uy * 10), my + (ux * 10));
        ctx.restore();
      });

      graphLayout.nodes.forEach((node, index) => {
        const highlighted = isHighlighted(index);
        const visited = visitedIndexSet.has(index);
        const compared = compareIndexSet.has(index);
        const swapped = swapIndexSet.has(index);
        const selected = selectedNodeIndex === index;

        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
        if (compared) {
          ctx.fillStyle = `rgba(245, 158, 11, ${0.24 * pulse})`;
        } else if (highlighted) {
          ctx.fillStyle = `rgba(34, 211, 238, ${0.28 * pulse})`;
        } else if (visited) {
          ctx.fillStyle = '#99f6e4';
        } else {
          ctx.fillStyle = '#dbeafe';
        }
        ctx.fill();
        ctx.lineWidth = selected || swapped ? 2.6 : 1.2;
        ctx.strokeStyle = selected ? '#1677ff' : swapped ? '#7c3aed' : '#475569';
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = '600 12px Microsoft YaHei, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y);
        ctx.restore();

        hitRegionsRef.current.push({ index, x: node.x, y: node.y, w: 0, h: 0, type: 'circle', r: nodeRadius });
      });

      if (Array.isArray(currentFrame?.outputList) && currentFrame.outputList.length > 0) {
        const output = currentFrame.outputList;
        const panelTop = height - 74;
        const boxW = 38;
        const boxH = 30;
        const gap = 8;
        const total = output.length * boxW + Math.max(0, output.length - 1) * gap;
        const startX = Math.max(24, (width - total) / 2);
        const y = panelTop + 24;

        ctx.save();
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(20, panelTop - 6);
        ctx.lineTo(width - 20, panelTop - 6);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#334155';
        ctx.font = '600 12px Microsoft YaHei, Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('Traversal Order:', 24, y - 10);

        output.forEach((value, idx) => {
          const x = startX + idx * (boxW + gap);
          const isLast = idx === output.length - 1;

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(x, y, boxW, boxH, 7);
          ctx.fillStyle = isLast ? '#2563eb' : '#eef2ff';
          ctx.fill();
          ctx.lineWidth = isLast ? 2.2 : 1.2;
          ctx.strokeStyle = isLast ? '#f59e0b' : '#cbd5e1';
          ctx.stroke();

          ctx.fillStyle = isLast ? '#ffffff' : '#0f172a';
          ctx.font = '600 12px Microsoft YaHei, Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(value), x + boxW / 2, y + boxH / 2);
          ctx.restore();
        });
      }
    }

    if (frameNodes.length === 0) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px Microsoft YaHei, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No visualization data is available.', width / 2, height / 2);
    }
  }, [
    activeIndexSet,
    canvasSize.height,
    canvasSize.width,
    compareIndexSet,
    data.form,
    frameNodes,
    graphLayout,
    hashBucketCount,
    isKmpPatternMatchOperation,
    isPatternMatchOperation,
    patternSubInput,
    phase,
    selectedNodeIndex,
    swapIndexSet,
    visitedIndexSet,
    currentFrame,
    generalTreeParents
  ]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const target = hitRegionsRef.current.find((region) => {
      if (region.type === 'rect') {
        return x >= region.x && x <= region.x + region.w && y >= region.y && y <= region.y + region.h;
      }

      const radius = region.r ?? 0;
      const dx = x - region.x;
      const dy = y - region.y;
      return dx * dx + dy * dy <= radius * radius;
    });

    if (target) {
      setSelectedNodeIndex(target.index);
      setIndexInput(String(target.index));

      if (isLinkedForm && isDeleteCurrentOperation) {
        setValueInput('');
        return;
      }

      if (target.index >= 0 && target.index < frameNodes.length) {
        const selected = frameNodes[target.index];
        const numeric = toFiniteNumberOrNull(selected);
        setValueInput(numeric === null ? '' : String(numeric));
      }
      return;
    }

    setSelectedNodeIndex(null);
  };

  if (data.source === 'placeholder') {
    return <Alert type="warning" showIcon message={data.placeholderText || 'This section is a placeholder'} />;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap>
        <Tag color={data.source === 'database' ? 'green' : 'orange'}>
          Data Source: {data.source === 'database' ? 'database' : 'local'}
        </Tag>
        <Tag color="blue">Representation: {data.representation}</Tag>
        <Tag color="purple">Renderer: Canvas + D3</Tag>
      </Space>

      <Card size="small" title="Structure View (Canvas + D3)">
        <Paragraph style={{ marginBottom: 12 }}>{data.caption}</Paragraph>

        <div ref={viewportRef} className="svm-canvas-host">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onClick={handleCanvasClick}
            className="svm-canvas"
          />
        </div>
        {canvasSize.width > viewportWidth + 8 ? (
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            You can scroll horizontally to see the full structure when the visualization exceeds the viewport width.
          </Text>
        ) : null}
      </Card>

      {operations.length > 0 ? (
        <Card size="small" title="Algorithm Dynamic Demonstration">
          <div className="svm-op-top">
            <Space wrap style={{ marginBottom: 12 }}>
              {operations.map((op, index) => (
                <Button
                  key={op.name}
                  type={index === operationIndex ? 'primary' : 'default'}
                  onClick={() => {
                    setOperationIndex(index);

                    const opName = (op.name ?? '').toLowerCase();
                    const isHeadInsert = /insert\s*at\s*head|head\s*insert|头插|插入头/.test(opName);
                    const isHeadDelete = /delete\s*from\s*head|head\s*delete|头删|删头/.test(opName);
                    const isCurrentDelete = /delete\s*current|current\s*delete|删除当前|删除选中/.test(opName);
                    const isStackInsert = /push|入栈/.test(opName);
                    const isStackDelete = /pop|出栈/.test(opName);
                    const isQueueInsert = /enqueue|入队/.test(opName);
                    const isQueueDelete = /dequeue|出队/.test(opName);

                    if (isLinkedForm && (isHeadInsert || isHeadDelete)) {
                      const targetIndex = frameNodes.length > 1 ? 1 : 0;
                      setSelectedNodeIndex(targetIndex);
                      setIndexInput(String(targetIndex));
                      if (isHeadInsert) {
                        setValueInput('');
                      } else {
                        const selected = frameNodes[targetIndex] ?? '';
                        const numeric = toFiniteNumberOrNull(selected);
                        setValueInput(numeric === null ? '' : String(numeric));
                      }
                      return;
                    }

                    if (isLinkedForm && (isStackInsert || isStackDelete)) {
                      const targetIndex = resolveStackTopValueIndex(frameNodes);
                      setSelectedNodeIndex(targetIndex);
                      setIndexInput(String(targetIndex));
                      if (isStackInsert) {
                        setValueInput('');
                      } else {
                        const selected = frameNodes[targetIndex] ?? '';
                        const numeric = toFiniteNumberOrNull(selected);
                        setValueInput(numeric === null ? '' : String(numeric));
                      }
                      return;
                    }

                    if (isLinkedForm && (isQueueInsert || isQueueDelete)) {
                      const targetIndex = isQueueInsert
                        ? resolveQueueRearInsertIndex(frameNodes)
                        : resolveQueueFrontValueIndex(frameNodes);
                      setSelectedNodeIndex(targetIndex);
                      setIndexInput(String(targetIndex));
                      if (isQueueInsert) {
                        setValueInput('');
                      } else {
                        const selected = frameNodes[targetIndex] ?? '';
                        const numeric = toFiniteNumberOrNull(selected);
                        setValueInput(numeric === null ? '' : String(numeric));
                      }
                      return;
                    }

                    if (isLinkedForm && isCurrentDelete) {
                      setSelectedNodeIndex(null);
                      setIndexInput('');
                      setValueInput('');
                    }
                  }}
                >
                  {op.name}
                </Button>
              ))}
            </Space>

            <div className="svm-op-inputs">
              {isPatternMatchOperation ? (
                <>
                  <Input
                    className="svm-op-input"
                    value={patternMainInput}
                    placeholder="Text T"
                    onChange={(event) => setPatternMainInput(event.target.value)}
                    onPressEnter={() => {
                      executeOperation();
                    }}
                  />
                  <Input
                    className="svm-op-input"
                    value={patternSubInput}
                    placeholder="Pattern P"
                    onChange={(event) => setPatternSubInput(event.target.value)}
                    onPressEnter={() => {
                      executeOperation();
                    }}
                  />
                </>
              ) : (
                <>
                  <InputNumber
                    className="svm-op-input"
                    value={indexInput === '' ? null : Number(indexInput)}
                    min={0}
                    max={Math.max(0, frameNodes.length - 1)}
                    precision={0}
                    placeholder="A: index"
                    controls={false}
                    disabled={lockIndexInput}
                    onChange={(value) => {
                      const normalized = typeof value === 'number' ? String(value) : '';
                      setIndexInput(normalized);

                      if (typeof value === 'number' && value >= 0 && value < frameNodes.length) {
                        setSelectedNodeIndex(value);
                        if (!isLinkedForm) {
                          setValueInput(frameNodes[value]);
                        }
                      }
                    }}
                  />
                  <InputNumber
                    className="svm-op-input"
                    value={valueInput === '' ? null : toFiniteNumberOrNull(valueInput)}
                    placeholder="B: value"
                    controls={false}
                    disabled={lockValueInput}
                    onChange={(value) => setValueInput(value === null ? '' : String(value))}
                    onPressEnter={() => {
                      executeOperation();
                    }}
                  />
                </>
              )}
            </div>
          </div>

          <Paragraph style={{ marginBottom: 8 }}>
            <Text strong>{currentOperation?.name}</Text>: {currentOperation?.description}
          </Paragraph>
          <Paragraph type="secondary" style={{ marginBottom: 12 }}>
            {Array.isArray(currentOperation?.steps) && currentOperation.steps.length > 0
              ? `Operation flow: ${currentOperation.steps.join(' -> ')}`
              : currentOperation?.dynamicPlan}
          </Paragraph>
          {graphResultSummary && (
            <Paragraph type="secondary" style={{ marginBottom: 12 }}>
              {graphResultSummary}
            </Paragraph>
          )}

          <Space style={{ marginBottom: 12 }} wrap>
            <Button
              icon={playing ? <PauseOutlined /> : <PlayCircleOutlined />}
              onClick={togglePlay}
              disabled={!playing && (
                linkedDeleteCurrentInvalid
                || fixedInsertValueInvalid
                || valueDrivenNumericInvalid
                || patternInputInvalid
                || graphStartIndexInvalid
                || treeCrudInsertPlayInvalid
              )}
            >
              {playing ? 'Pause' : 'Play'}
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              Reset
            </Button>
            <Space align="center">
              <Text type="secondary">Speed</Text>
              <Slider min={0} max={100} value={speed} onChange={setSpeed} style={{ width: 160 }} />
            </Space>
          </Space>
        </Card>
      ) : (
        <Alert type="info" showIcon message="No visualization data is available." />
      )}
    </Space>
  );
};

export default SectionVisualizationModule;
