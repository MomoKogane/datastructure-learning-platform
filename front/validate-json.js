#!/usr/bin/env node

/**
 * 验证JSON数据结构的完整性和格式
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STRUCTURES_DIR = path.join(__dirname, 'src/data/structures');
const REQUIRED_FILES = ['index.json', 'theory.json', 'visualization.json', 'examples.json', 'practice.json'];

async function validateJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(content);
    console.log(`✅ ${filePath} - 有效的JSON`);
    return { valid: true, data: parsed };
  } catch (error) {
    console.error(`❌ ${filePath} - JSON错误: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

async function validateStructure(structureName) {
  console.log(`\n🔍 验证数据结构: ${structureName}`);
  const structureDir = path.join(STRUCTURES_DIR, structureName);
  
  try {
    const files = await fs.readdir(structureDir);
    const results = { valid: true, files: {} };
    
    for (const fileName of REQUIRED_FILES) {
      const filePath = path.join(structureDir, fileName);
      if (files.includes(fileName)) {
        const result = await validateJsonFile(filePath);
        results.files[fileName] = result;
        if (!result.valid) {
          results.valid = false;
        }
      } else {
        console.error(`❌ 缺少必需文件: ${fileName}`);
        results.valid = false;
        results.files[fileName] = { valid: false, error: '文件不存在' };
      }
    }
    
    return results;
  } catch (error) {
    console.error(`❌ 无法读取目录 ${structureDir}: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

async function validateAllStructures() {
  console.log('🚀 开始验证所有数据结构的JSON文件...\n');
  
  try {
    const entries = await fs.readdir(STRUCTURES_DIR, { withFileTypes: true });
    const structures = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    
    console.log(`📁 发现 ${structures.length} 个数据结构: ${structures.join(', ')}`);
    
    const results = {};
    let allValid = true;
    
    for (const structure of structures) {
      const result = await validateStructure(structure);
      results[structure] = result;
      if (!result.valid) {
        allValid = false;
      }
    }
    
    console.log('\n📊 验证总结:');
    console.log('='.repeat(50));
    
    for (const [structure, result] of Object.entries(results)) {
      const status = result.valid ? '✅' : '❌';
      console.log(`${status} ${structure}: ${result.valid ? '所有文件有效' : '存在问题'}`);
      
      if (!result.valid && result.files) {
        for (const [file, fileResult] of Object.entries(result.files)) {
          if (!fileResult.valid) {
            console.log(`   └─ ${file}: ${fileResult.error}`);
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    if (allValid) {
      console.log('🎉 所有数据结构的JSON文件都有效！');
      process.exit(0);
    } else {
      console.log('⚠️  发现一些问题，请检查上述错误');
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ 验证过程出错: ${error.message}`);
    process.exit(1);
  }
}

// 特定验证函数
async function validateArrayStructure() {
  console.log('🔍 详细验证数组结构...\n');
  
  const arrayResult = await validateStructure('array');
  
  if (arrayResult.valid && arrayResult.files['theory.json']?.valid) {
    const theory = arrayResult.files['theory.json'].data;
    console.log(`📖 理论部分包含 ${theory.sections?.length || 0} 个章节`);
    
    if (theory.sections) {
      theory.sections.forEach((section, index) => {
        console.log(`   ${index + 1}. ${section.title} (${section.type})`);
      });
    }
  }
  
  if (arrayResult.valid && arrayResult.files['practice.json']?.valid) {
    const practice = arrayResult.files['practice.json'].data;
    console.log(`🏋️ 练习部分包含 ${practice.problems?.length || 0} 个题目`);
    console.log(`🔗 外部链接: ${practice.externalLinks?.length || 0} 个`);
  }
  
  if (arrayResult.valid && arrayResult.files['examples.json']?.valid) {
    const examples = arrayResult.files['examples.json'].data;
    console.log(`💻 代码示例包含 ${examples.categories?.length || 0} 个类别`);
    
    if (examples.categories && examples.categories.length > 0) {
      const languages = Object.keys(examples.categories[0].examples || {});
      console.log(`   支持语言: ${languages.join(', ')}`);
    }
  }
}

// 主程序
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--array-only')) {
    await validateArrayStructure();
  } else {
    await validateAllStructures();
  }
}

main().catch(console.error);
