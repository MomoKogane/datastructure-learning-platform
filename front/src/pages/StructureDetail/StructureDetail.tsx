import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Card, Typography, Button, Tabs, Space, Tag, Spin, message } from 'antd';
import { PlayCircleOutlined, CodeOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { dataStructures } from '../../data/structures';
import { apiService } from '../../services/api';
import { useLearningStore } from '../../store/learningStore';
import CodeEditor from '../../components/CodeEditor/CodeEditor';
import Visualization from '../../components/Visualization/Visualization';
import ArraySection from '../2.LinearSection/ArraySection/2.1ArraySection.tsx';
import LinkedListSection from '../2.LinearSection/LinkedListSection/2.2LinkedListSection.tsx'; 
import BasicConceptSection from '../1.TheorySection/1.1BasicConceptSection.tsx';
import ComplexityAnalysisSection from '../1.TheorySection/1.2ComplexityAnalysisSection.tsx';
import StringFundamentalSection from '../3.StringSection/3.1StringFundamentalSection.tsx';
import PatternMatchingSection from '../3.StringSection/3.2PatternMatchingSection.tsx';
import PatternMatchingOverviewSection from '../3.StringSection/3.2.1PatternMatchingOverviewSection.tsx';
import BFAlgorithmSection from '../3.StringSection/3.2.2BFAlgorithmSection.tsx';
import KMPAlgorithmSection from '../3.StringSection/3.2.3KMPAlgorithmSection.tsx';
import StackSection from '../2.LinearSection/StackSection/2.3StackSection.tsx';
import QueueSection from '../2.LinearSection/QueueSection/2.4QueueSection.tsx';
import TreeSection from '../4.TreeSection/4.1TreeSection.tsx';
import BinaryTreeSection from '../4.TreeSection/4.3BinaryTreeSection.tsx';
import GraphBasicsSection from '../5.GraphSection/5.1GraphBasicsSection.tsx';
import SearchSection from '../6.SearchSection/6SearchSection.tsx';
import SortingSection from '../7.SortingSection/7SortingSection.tsx';
import BinarySearchTreeSection from '../4.TreeSection/4.5BinarySearchTreeSection.tsx';
import HuffmanTreeSection from '../4.TreeSection/4.9HuffmanTreeSection.tsx';
import BinaryTreeBasicsTraversalSection from '../4.TreeSection/4.2BinaryTreeBasicsTraversalSection.tsx';
import ThreadedBinaryTreeSection from '../4.TreeSection/4.4ThreadedBinaryTreeSection.tsx';
import BSTBasicsSection from '../4.TreeSection/4.5BSTBasicsSection.tsx';
import AVLTreeSection from '../4.TreeSection/4.6AVLTreeSection.tsx';
import RedBlackTreeSection from '../4.TreeSection/4.7RedBlackTreeSection.tsx';
import MultiwayBalancedTreeSection from '../4.TreeSection/4.8MultiwayBalancedTreeSection.tsx';
import HuffmanTreeExtendedSection from '../4.TreeSection/4.9HuffmanTreeExtendedSection.tsx';
import HeapSection from '../4.TreeSection/4.10HeapSection.tsx';
import GraphTraversalSection from '../5.GraphSection/5.2GraphTraversalSection.tsx';
import ShortestPathSection from '../5.GraphSection/5.3ShortestPathSection.tsx';
import MinimumSpanningTreeSection from '../5.GraphSection/5.4MinimumSpanningTreeSection.tsx';
import GraphTraversalOverviewSection from '../5.GraphSection/5.2.1GraphTraversalOverviewSection.tsx';
import GraphDFSSection from '../5.GraphSection/5.2.2GraphDFSSection.tsx';
import GraphBFSSection from '../5.GraphSection/5.2.3GraphBFSSection.tsx';
import ShortestPathOverviewSection from '../5.GraphSection/5.3.1ShortestPathOverviewSection.tsx';
import DijkstraAlgorithmSection from '../5.GraphSection/5.3.2DijkstraAlgorithmSection.tsx';
import BellmanFordAlgorithmSection from '../5.GraphSection/5.3.3BellmanFordAlgorithmSection.tsx';
import FloydAlgorithmSection from '../5.GraphSection/5.3.4FloydAlgorithmSection.tsx';
import MSTOverviewSection from '../5.GraphSection/5.4.1MSTOverviewSection.tsx';
import PrimAlgorithmSection from '../5.GraphSection/5.4.2PrimAlgorithmSection.tsx';
import KruskalAlgorithmSection from '../5.GraphSection/5.4.3KruskalAlgorithmSection.tsx';
import SequentialSearchSection from '../6.SearchSection/6.1SequentialSearchSection.tsx';
import BinarySearchSection from '../6.SearchSection/6.2BinarySearchSection.tsx';
import HashTableSection from '../6.SearchSection/6.3HashTableSection.tsx';
import BTreeSection from '../6.SearchSection/6.4BTreeSection.tsx';
import BPlusTreeSection from '../6.SearchSection/6.5BPlusTreeSection.tsx';
import InsertionSortSection from '../7.SortingSection/7.1InsertionSortSection.tsx';
import BubbleSortSection from '../7.SortingSection/7.2BubbleSortSection.tsx';
import SelectionSortSection from '../7.SortingSection/7.3SelectionSortSection.tsx';
import ShellSortSection from '../7.SortingSection/7.4ShellSortSection.tsx';
import QuickSortSection from '../7.SortingSection/7.5QuickSortSection.tsx';
import MergeSortSection from '../7.SortingSection/7.6MergeSortSection.tsx';
import HeapSortSection from '../7.SortingSection/7.7HeapSortSection.tsx';
import RadixSortSection from '../7.SortingSection/7.8RadixSortSection.tsx';
import BucketSortSection from '../7.SortingSection/7.9BucketSortSection.tsx';
import ExternalSortSection from '../7.SortingSection/7.10ExternalSortSection.tsx';
import SortingAnalysisSection from '../7.SortingSection/7.11SortingAnalysisSection.tsx';
import type { DataStructure, Operation } from '../../types';
import './StructureDetail.css';

const { Title, Paragraph } = Typography;

const sectionIdFallbackMap: Record<string, string> = {
  // Linear structures
  'stacks': 'stack',
  'queues': 'queue',
  'pattern-matching-overview': 'array',
  'bf-algorithm': 'array',
  'kmp-algorithm': 'array',
  // Trees
  'tree-basics': 'tree',
  'tree-traversal': 'binarytree',
  'binary-tree-basics': 'binarytree',
  'binary-tree-basics-traversal': 'binarytree',
  'threaded-binary-tree': 'binarytree',
  'bst-basics': 'binarytree',
  'avl-tree': 'binarytree',
  'red-black-tree': 'binarytree',
  'multiway-balanced-tree': 'binarytree',
  'binary-trees': 'binarytree',
  'search-trees': 'binarytree',
  'huffman-trees': 'binarytree',
  'heap': 'binarytree',
  // Graphs
  'graph-basics': 'graph-fundamental',
  'graph-traversal': 'graph-traversal',
  'graph-traversal-overview': 'graph-traversal',
  'graph-dfs': 'graph-traversal',
  'graph-bfs': 'graph-traversal',
  'shortest-paths': 'shortest-path',
  'shortest-path-overview': 'shortest-path',
  'dijkstra-algorithm': 'shortest-path',
  'bellman-ford-algorithm': 'shortest-path',
  'floyd-algorithm': 'shortest-path',
  'minimum-spanning-trees': 'minimum-spanning-trees',
  'mst-overview': 'minimum-spanning-trees',
  'prim-algorithm': 'minimum-spanning-trees',
  'kruskal-algorithm': 'minimum-spanning-trees'
};

type StaticRouteParams = {
  id?: string;
  chapterId?: string;
  sectionId?: string;
};

const resolveStaticSectionComponent = ({ id, chapterId, sectionId }: StaticRouteParams): React.ComponentType | null => {
  if (chapterId && sectionId && (sectionId === '2.1' || sectionId === 'arrays' || sectionId.includes('array'))) {
    return ArraySection;
  }

  if (chapterId && sectionId && (sectionId === '2.2' || sectionId === 'linked-lists' || sectionId.includes('linkedlist'))) {
    return LinkedListSection;
  }

  if (chapterId && (sectionId === '1.1' || sectionId === 'basic-concepts')) {
    return BasicConceptSection;
  }

  if (chapterId && (sectionId === '1.2' || sectionId === 'complexity-analysis')) {
    return ComplexityAnalysisSection;
  }

  if (chapterId && (sectionId === '3.1' || sectionId === 'string-basics' || sectionId === 'string-fundamentals')) {
    return StringFundamentalSection;
  }

  if (chapterId && (sectionId === '3.2' || sectionId === 'pattern-matching')) {
    return PatternMatchingSection;
  }

  if (chapterId && (sectionId === '3.2.1' || sectionId === 'pattern-matching-overview')) {
    return PatternMatchingOverviewSection;
  }

  if (chapterId && (sectionId === '3.2.2' || sectionId === 'bf-algorithm')) {
    return BFAlgorithmSection;
  }

  if (chapterId && (sectionId === '3.2.3' || sectionId === 'kmp-algorithm')) {
    return KMPAlgorithmSection;
  }

  if (chapterId && (sectionId === '2.3' || sectionId === 'stacks')) {
    return StackSection;
  }

  if (chapterId && (sectionId === '2.4' || sectionId === 'queues')) {
    return QueueSection;
  }

  if (chapterId && (sectionId === '4.1' || sectionId === 'tree-basics')) {
    return TreeSection;
  }

  if (chapterId && (sectionId === '4.2' || sectionId === 'tree-traversal' || sectionId === 'binary-tree-basics-traversal')) {
    return BinaryTreeBasicsTraversalSection;
  }

  if (chapterId && (sectionId === '4.3' || sectionId === 'binary-tree-basics' || sectionId === 'binary-trees')) {
    return BinaryTreeSection;
  }

  if (chapterId && (sectionId === '4.4' || sectionId === 'threaded-binary-tree')) {
    return ThreadedBinaryTreeSection;
  }

  if (chapterId && sectionId === 'search-trees') {
    return BinarySearchTreeSection;
  }

  if (chapterId && (sectionId === '4.5' || sectionId === 'bst-basics')) {
    return BSTBasicsSection;
  }

  if (chapterId && (sectionId === '4.6' || sectionId === 'avl-tree')) {
    return AVLTreeSection;
  }

  if (chapterId && (sectionId === '4.7' || sectionId === 'red-black-tree')) {
    return RedBlackTreeSection;
  }

  if (chapterId && (sectionId === '4.8' || sectionId === 'multiway-balanced-tree')) {
    return MultiwayBalancedTreeSection;
  }

  if (chapterId && (sectionId === '4.9' || sectionId === 'huffman-trees')) {
    return HuffmanTreeExtendedSection;
  }

  if (chapterId && (sectionId === '4.10' || sectionId === 'heap')) {
    return HeapSection;
  }

  if (chapterId && (sectionId === '5.1' || sectionId === 'graph-basics')) {
    return GraphBasicsSection;
  }

  if (chapterId && (sectionId === '5.2' || sectionId === 'graph-traversal')) {
    return GraphTraversalSection;
  }

  if (chapterId && (sectionId === '5.2.1' || sectionId === 'graph-traversal-overview')) {
    return GraphTraversalOverviewSection;
  }

  if (chapterId && (sectionId === '5.2.2' || sectionId === 'graph-dfs')) {
    return GraphDFSSection;
  }

  if (chapterId && (sectionId === '5.2.3' || sectionId === 'graph-bfs')) {
    return GraphBFSSection;
  }

  if (chapterId && (sectionId === '5.3' || sectionId === 'shortest-paths')) {
    return ShortestPathSection;
  }

  if (chapterId && (sectionId === '5.3.1' || sectionId === 'shortest-path-overview')) {
    return ShortestPathOverviewSection;
  }

  if (chapterId && (sectionId === '5.3.2' || sectionId === 'dijkstra-algorithm')) {
    return DijkstraAlgorithmSection;
  }

  if (chapterId && (sectionId === '5.3.3' || sectionId === 'bellman-ford-algorithm')) {
    return BellmanFordAlgorithmSection;
  }

  if (chapterId && (sectionId === '5.3.4' || sectionId === 'floyd-algorithm')) {
    return FloydAlgorithmSection;
  }

  if (chapterId && (sectionId === '5.4' || sectionId === 'minimum-spanning-trees')) {
    return MinimumSpanningTreeSection;
  }

  if (chapterId && (sectionId === '5.4.1' || sectionId === 'mst-overview')) {
    return MSTOverviewSection;
  }

  if (chapterId && (sectionId === '5.4.2' || sectionId === 'prim-algorithm')) {
    return PrimAlgorithmSection;
  }

  if (chapterId && (sectionId === '5.4.3' || sectionId === 'kruskal-algorithm')) {
    return KruskalAlgorithmSection;
  }

  if (chapterId && (sectionId === '6.1' || sectionId === 'linear-search')) {
    return SequentialSearchSection;
  }

  if (chapterId && (sectionId === '6.2' || sectionId === 'binary-search')) {
    return BinarySearchSection;
  }

  if (chapterId && (sectionId === '6.3' || sectionId === 'hash-tables')) {
    return HashTableSection;
  }

  if (chapterId && (sectionId === '6.4' || sectionId === 'advanced-search' || sectionId === 'b-tree-search')) {
    return BTreeSection;
  }

  if (chapterId && (sectionId === '6.5' || sectionId === 'b-plus-tree-search')) {
    return BPlusTreeSection;
  }

  if (chapterId && (sectionId === '7.1' || sectionId === 'simple-sorts' || sectionId === 'insertion-sort')) {
    return InsertionSortSection;
  }

  if (chapterId && (sectionId === '7.2' || sectionId === 'bubble-sort')) {
    return BubbleSortSection;
  }

  if (chapterId && (sectionId === '7.3' || sectionId === 'selection-sort')) {
    return SelectionSortSection;
  }

  if (chapterId && (sectionId === '7.5' || sectionId === 'advanced-sorts' || sectionId === 'quick-sort')) {
    return QuickSortSection;
  }

  if (chapterId && (sectionId === '7.4' || sectionId === 'shell-sort')) {
    return ShellSortSection;
  }

  if (chapterId && (sectionId === '7.6' || sectionId === 'merge-sort')) {
    return MergeSortSection;
  }

  if (chapterId && (sectionId === '7.7' || sectionId === 'heap-sort')) {
    return HeapSortSection;
  }

  if (chapterId && (sectionId === '7.8' || sectionId === 'special-sorts' || sectionId === 'radix-sort')) {
    return RadixSortSection;
  }

  if (chapterId && (sectionId === '7.9' || sectionId === 'bucket-sort')) {
    return BucketSortSection;
  }

  if (chapterId && (sectionId === '7.10' || sectionId === 'external-sort')) {
    return ExternalSortSection;
  }

  if (chapterId && (sectionId === '7.11' || sectionId === 'sorting-analysis')) {
    return SortingAnalysisSection;
  }

  if (id === '2.2' || id === 'linkedlist' || id === 'linked-list') {
    return LinkedListSection;
  }

  if (id === '1.1' || id === 'basic-concepts') {
    return BasicConceptSection;
  }

  if (id === '1.2' || id === 'complexity-analysis') {
    return ComplexityAnalysisSection;
  }

  if (id === '3.1' || id === 'string-basics' || id === 'string-fundamentals') {
    return StringFundamentalSection;
  }

  if (id === '3.2' || id === 'pattern-matching') {
    return PatternMatchingSection;
  }

  if (id === '2.3' || id === 'stack') {
    return StackSection;
  }

  if (id === '2.4' || id === 'queue') {
    return QueueSection;
  }

  if (id === '4.1' || id === 'tree') {
    return TreeSection;
  }

  if (id === '4.2' || id === 'tree-traversal' || id === 'binary-tree-basics-traversal') {
    return BinaryTreeBasicsTraversalSection;
  }

  if (id === '4.3' || id === 'binarytree' || id === 'binary-tree-basics' || id === 'binary-trees') {
    return BinaryTreeSection;
  }

  if (id === '4.4' || id === 'threaded-binary-tree') {
    return ThreadedBinaryTreeSection;
  }

  if (id === '4.5' || id === 'bst-basics') {
    return BSTBasicsSection;
  }

  if (id === 'binary-search-tree') {
    return BinarySearchTreeSection;
  }

  if (id === '4.6' || id === 'avl-tree') {
    return AVLTreeSection;
  }

  if (id === '4.7' || id === 'red-black-tree') {
    return RedBlackTreeSection;
  }

  if (id === '4.8' || id === 'multiway-balanced-tree') {
    return MultiwayBalancedTreeSection;
  }

  if (id === 'binary-search-tree-topic') {
    return BinarySearchTreeSection;
  }

  if (id === '4.9' || id === 'huffman-tree') {
    return HuffmanTreeSection;
  }

  if (id === 'huffman-tree-topic') {
    return HuffmanTreeSection;
  }

  if (id === '4.10' || id === 'heap') {
    return HeapSection;
  }

  if (id === '5.1' || id === 'graph') {
    return GraphBasicsSection;
  }

  if (id === '5.2' || id === 'graph-traversal') {
    return GraphTraversalSection;
  }

  if (id === 'graph-traversal-topic') {
    return GraphTraversalSection;
  }

  if (id === '5.3' || id === 'shortest-path') {
    return ShortestPathSection;
  }

  if (id === 'shortest-path-topic') {
    return ShortestPathSection;
  }

  if (id === '5.4' || id === 'minimum-spanning-tree') {
    return MinimumSpanningTreeSection;
  }

  if (id === 'minimum-spanning-tree-topic') {
    return MinimumSpanningTreeSection;
  }

  if (id === '6' || id === 'search') {
    return SearchSection;
  }

  if (id === '6.1' || id === 'sequential-search') {
    return SequentialSearchSection;
  }

  if (id === 'sequential-search-topic') {
    return SequentialSearchSection;
  }

  if (id === '6.2' || id === 'binary-search-topic') {
    return BinarySearchSection;
  }

  if (id === '6.3' || id === 'hash-table') {
    return HashTableSection;
  }

  if (id === 'hash-table-topic') {
    return HashTableSection;
  }

  if (id === '6.4' || id === 'b-tree') {
    return BTreeSection;
  }

  if (id === 'b-tree-topic') {
    return BTreeSection;
  }

  if (id === '6.5' || id === 'b-plus-tree') {
    return BPlusTreeSection;
  }

  if (id === 'b-plus-tree-topic') {
    return BPlusTreeSection;
  }

  if (id === '7' || id === 'sorting') {
    return SortingSection;
  }

  if (id === '7.1' || id === 'insertion-sort') {
    return InsertionSortSection;
  }

  if (id === 'insertion-sort-topic') {
    return InsertionSortSection;
  }

  if (id === '7.2' || id === 'bubble-sort') {
    return BubbleSortSection;
  }

  if (id === 'bubble-sort-topic') {
    return BubbleSortSection;
  }

  if (id === '7.3' || id === 'selection-sort') {
    return SelectionSortSection;
  }

  if (id === 'selection-sort-topic') {
    return SelectionSortSection;
  }

  if (id === '7.4' || id === 'shell-sort') {
    return ShellSortSection;
  }

  if (id === 'shell-sort-topic') {
    return ShellSortSection;
  }

  if (id === '7.5' || id === 'quick-sort') {
    return QuickSortSection;
  }

  if (id === 'quick-sort-topic') {
    return QuickSortSection;
  }

  if (id === '7.6' || id === 'merge-sort') {
    return MergeSortSection;
  }

  if (id === 'merge-sort-topic') {
    return MergeSortSection;
  }

  if (id === '7.7' || id === 'heap-sort') {
    return HeapSortSection;
  }

  if (id === 'heap-sort-topic') {
    return HeapSortSection;
  }

  if (id === '7.8' || id === 'radix-sort') {
    return RadixSortSection;
  }

  if (id === 'radix-sort-topic') {
    return RadixSortSection;
  }

  if (id === '7.9' || id === 'bucket-sort') {
    return BucketSortSection;
  }

  if (id === 'bucket-sort-topic') {
    return BucketSortSection;
  }

  if (id === '7.10' || id === 'external-sort') {
    return ExternalSortSection;
  }

  if (id === 'external-sort-topic') {
    return ExternalSortSection;
  }

  if (id === '7.11' || id === 'sorting-analysis' || id === 'sorting-analysis-topic') {
    return SortingAnalysisSection;
  }

  return null;
};

const StructureDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id, chapterId, sectionId } = useParams<{ 
    id?: string; 
    chapterId?: string; 
    sectionId?: string; 
  }>();
  const StaticSectionComponent = resolveStaticSectionComponent({ id, chapterId, sectionId });
  
  const [structure, setStructure] = useState<DataStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const { setCurrentStructure, toggleVisualization, isVisualizationActive } = useLearningStore();

  useEffect(() => {
    if (StaticSectionComponent) {
      return;
    }

    const fetchStructure = async () => {
      const rawId = id || sectionId;
      const structureId = rawId ? (sectionIdFallbackMap[rawId] || rawId) : undefined;
      if (!structureId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const sectionResponse = await apiService.getSectionModules(structureId);
        if (sectionResponse.success && sectionResponse.data) {
          const theoryModule = sectionResponse.data.modules.theory as {
            introduction?: string;
            sections?: Array<{ title?: string; content?: string }>;
          } | undefined;
          const examplesModule = sectionResponse.data.modules.examples as
            | Array<{
              name?: string;
              description?: string;
              timeComplexity?: string;
              codeExamples?: Array<{ code?: string }>;
            }>
            | undefined;

          const backendStructure: DataStructure = {
            id: structureId,
            name: structureId,
            description: theoryModule?.introduction ?? '',
            category: 'linear',
            difficulty: 'beginner',
            concepts: Array.isArray(theoryModule?.sections)
              ? theoryModule.sections.map((section) => String(section?.title ?? section?.content ?? ''))
              : [],
            operations: Array.isArray(examplesModule)
              ? examplesModule.map((item, index) => ({
                name: String(item?.name ?? `Operation ${index + 1}`),
                description: String(item?.description ?? ''),
                timeComplexity: String(item?.timeComplexity ?? ''),
                spaceComplexity: '',
                code: String(item?.codeExamples?.[0]?.code ?? '')
              }))
              : []
          };

          const localStructure = dataStructures.find(s => s.id === structureId);

          const mergedStructure = localStructure ? {
            ...backendStructure,
            ...localStructure
          } : backendStructure;

          setStructure(mergedStructure);
          setCurrentStructure(mergedStructure);
          setSelectedOperation(mergedStructure.operations?.[0] || null);
        } else {
          throw new Error('Structure not found in backend');
        }
      } catch (error) {
        console.error('Error fetching structure:', error);
        
        // Fallback to local data
        const found = dataStructures.find(s => s.id === structureId);
        if (found) {
          setStructure(found);
          setCurrentStructure(found);
          setSelectedOperation(found.operations[0] || null);
          message.info('Using offline data - backend connection unavailable');
        } else {
          message.error(`Data structure "${structureId}" not found`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStructure();
  }, [id, sectionId, setCurrentStructure, StaticSectionComponent]);

  if (StaticSectionComponent) {
    return <StaticSectionComponent />;
  }

  if (loading) {
    return (
      <div className="structure-loading-container">
        <Spin size="large" tip="Loading data structure..." />
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="structure-not-found">
        <Title level={3}>Data Structure Not Found</Title>
        <Paragraph>
          The data structure "{id}" could not be found. Please check if the ID is correct or try navigating from the catalog.
        </Paragraph>
        <Button type="primary" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const handleOperationSelect = (operation: Operation) => {
    setSelectedOperation(operation);
  };

  return (
    <div className="structure-detail">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header Information */}
        <Card className="structure-header-card">
          <Row align="middle">
            <Col span={18}>
              <Title level={2} className="structure-title">
                {structure.name}
              </Title>
              <Paragraph className="structure-description">
                {structure.description}
              </Paragraph>
              <Space size="middle">
                <Tag color="blue">
                  {structure.category === 'linear' ? 'Linear Structure' :
                   structure.category === 'tree' ? 'Tree Structure' :
                   structure.category === 'graph' ? 'Graph Structure' : 'Hash Structure'}
                </Tag>
                <Tag color={
                  structure.difficulty === 'beginner' ? 'green' :
                  structure.difficulty === 'intermediate' ? 'orange' : 'red'
                }>
                  {structure.difficulty === 'beginner' ? 'Beginner' :
                   structure.difficulty === 'intermediate' ? 'Intermediate' : 'Advanced'}
                </Tag>
              </Space>
            </Col>
            <Col span={6} className="structure-header-actions">
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={toggleVisualization}
                className="btn-primary btn-large btn-with-icon"
              >
                {isVisualizationActive ? 'Stop Demo' : 'Start Demo'}
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Main Content */}
        <Row gutter={24}>
          <Col span={16}>
            <Tabs 
              defaultActiveKey="concepts" 
              size="large"
              items={[
                {
                  key: 'concepts',
                  label: 'Core Concepts',
                  children: (
                    <Card>
                      <Title level={4}>Key Concepts</Title>
                      <Row gutter={[16, 16]}>
                        {structure.concepts.map((concept, index) => (
                          <Col span={12} key={index}>
                            <Card size="small" hoverable>
                              <CodeOutlined className="concept-icon" />
                              {concept}
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Card>
                  ),
                },
                {
                  key: 'operations',
                  label: 'Operation Demo',
                  children: (
                    <div>
                      <div className="operation-toolbar">
                        <Space wrap>
                          {structure.operations.map((operation) => (
                            <Button
                              key={operation.name}
                              type={selectedOperation?.name === operation.name ? 'primary' : 'default'}
                              onClick={() => handleOperationSelect(operation)}
                            >
                              {operation.name}
                            </Button>
                          ))}
                        </Space>
                      </div>

                      {selectedOperation && (
                        <Card>
                          <Title level={4}>{selectedOperation.name}</Title>
                          <Paragraph>{selectedOperation.description}</Paragraph>
                          
                          <Row gutter={16} className="complexity-row">
                            <Col>
                              <Tag color="blue">
                                Time Complexity: {selectedOperation.timeComplexity}
                              </Tag>
                            </Col>
                            <Col>
                              <Tag color="green">
                                Space Complexity: {selectedOperation.spaceComplexity}
                              </Tag>
                            </Col>
                          </Row>

                          <CodeEditor
                            value={selectedOperation.code}
                            language="typescript"
                            readOnly={true}
                            height="300px"
                          />
                        </Card>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'visualization',
                  label: 'Visualization Demo',
                  children: <Visualization structure={structure} operation={selectedOperation} />,
                },
              ]}
            />
          </Col>

          <Col span={8}>
            <Card title="Learning Progress" className="learning-progress-card">
              <div className="progress-item">
                <span>Concept Understanding</span>
                <div className="progress-bar">
                  <div className="progress-fill progress-fill-75"></div>
                </div>
              </div>
              <div className="progress-item">
                <span>Operation Mastery</span>
                <div className="progress-bar">
                  <div className="progress-fill progress-fill-60"></div>
                </div>
              </div>
              <div className="progress-item">
                <span>Code Implementation</span>
                <div className="progress-bar">
                  <div className="progress-fill progress-fill-40"></div>
                </div>
              </div>
            </Card>

            <Card title="Related Actions">
              <Space direction="vertical" className="related-actions-space">
                <Button type="primary" block onClick={() => navigate(`/practice/${structure.id}`)}>
                  Code Practice
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </motion.div>
    </div>
  );
};

export default StructureDetail;
