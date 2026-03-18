// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import DataStructure from '../models/DataStructure';
// import {
//   mockDataStructures,
//   mockCourseCatalog,
//   mockTheoreticalContent,
//   sectionToStructureMap
// } from '../data/minimalData';

// // Load environment variables
// dotenv.config();

// const toArray = <T>(value: Record<string, T>): T[] => Object.values(value);

// const slugify = (value: string): string =>
//   value
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, '-')
//     .replace(/^-+|-+$/g, '');

// const buildVisualizationConfig = (id: string) => {
//   const typeMap: Record<string, 'array' | 'linked-list' | 'tree' | 'graph'> = {
//     array: 'array',
//     linkedlist: 'linked-list',
//     binarytree: 'tree'
//   };

//   return {
//     type: typeMap[id] || 'array',
//     animationSpeed: 1000,
//     nodeColor: '#10B981',
//     linkColor: '#6B7280',
//     highlightColor: '#F59E0B',
//     dimensions: {
//       width: 1000,
//       height: 200
//     }
//   };
// };

// const transformMinimalDataStructures = () =>
//   mockDataStructures.map((ds: any) => ({
//     id: ds.id,
//     name: ds.name,
//     displayName: ds.displayName,
//     category: ds.category,
//     difficulty: ds.difficulty,
//     description: ds.description,
//     concepts: (ds.concepts || []).map((concept: string, index: number) => ({
//       id: `${ds.id}-concept-${index + 1}`,
//       title: concept,
//       content: concept,
//       order: index + 1,
//       examples: [],
//       keyPoints: []
//     })),
//     operations: (ds.operations || []).map((op: any) => ({
//       name: slugify(op.name || 'operation'),
//       displayName: op.name || 'Operation',
//       description: op.description || 'Operation description',
//       timeComplexity: op.timeComplexity || 'O(1)',
//       spaceComplexity: op.spaceComplexity || 'O(1)',
//       codeExamples: [
//         {
//           language: 'javascript',
//           code: op.code || '',
//           explanation: op.description || 'Example implementation.'
//         }
//       ],
//       steps: [],
//       parameters: []
//     })),
//     timeComplexity: ds.timeComplexity,
//     spaceComplexity: ds.spaceComplexity,
//     visualizationConfig: buildVisualizationConfig(ds.id)
//   }));

// const seedFromMinimal = async () => {
//   const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dslp';

//   try {
//     await mongoose.connect(mongoURI);
//     const db = mongoose.connection;

//     const dataStructures = transformMinimalDataStructures();
//     const courseCatalogCollection = db.collection('course_catalog');
//     const theoreticalContentCollection = db.collection('theoretical_content');
//     const sectionMappingCollection = db.collection('section_mapping');

//     await DataStructure.deleteMany({});
//     await courseCatalogCollection.deleteMany({});
//     await theoreticalContentCollection.deleteMany({});
//     await sectionMappingCollection.deleteMany({});

//     if (dataStructures.length > 0) {
//       await DataStructure.insertMany(dataStructures);
//     }

//     if (mockCourseCatalog.length > 0) {
//       await courseCatalogCollection.insertMany(mockCourseCatalog);
//     }

//     const theoryDocs = toArray(mockTheoreticalContent);
//     if (theoryDocs.length > 0) {
//       await theoreticalContentCollection.insertMany(theoryDocs);
//     }

//     await sectionMappingCollection.insertOne({
//       id: 'section-mapping',
//       map: sectionToStructureMap
//     });

//     console.log('Minimal data seeded into MongoDB.');
//     console.log(`datastructures: ${dataStructures.length}`);
//     console.log(`course_catalog: ${mockCourseCatalog.length}`);
//     console.log(`theoretical_content: ${theoryDocs.length}`);
//     console.log('section_mapping: 1');
//   } catch (error) {
//     console.error('Failed to seed minimal data:', error);
//     process.exitCode = 1;
//   } finally {
//     await mongoose.disconnect();
//   }
// };

// seedFromMinimal();
