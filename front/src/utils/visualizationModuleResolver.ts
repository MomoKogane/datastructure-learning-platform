export type VisualizationForm = 'sequential' | 'linked' | 'tree' | 'graph' | 'hash' | 'algorithm';

export interface VisualizationOperationPlan {
  name: string;
  description: string;
  steps: string[];
  dynamicPlan: string;
  script?: VisualizationAlgorithmScript;
}

export interface VisualizationFrame {
  label: string;
  activeIndices?: number[];
  visitedIndices?: number[];
  compareIndices?: number[];
  swapIndices?: [number, number];
  arrayState?: string[];
  runChains?: string[][];
  outputList?: string[];
}

export interface VisualizationAlgorithmScript {
  kind: 'array' | 'graph' | 'tree' | 'linked' | 'generic';
  frames: VisualizationFrame[];
  loop?: boolean;
  autoGenerate?: boolean;
}

export interface VisualizationModuleData {
  source: 'database' | 'hardcoded' | 'placeholder';
  form: VisualizationForm;
  representation: string;
  caption: string;
  nodes: string[];
  operations: VisualizationOperationPlan[];
  placeholderText?: string;
}

export interface HardcodedVisualizationSeed {
  sectionId: string;
  sectionName: string;
  form?: VisualizationForm;
  caption?: string;
  nodes?: string[];
  operations?: Array<{
    name: string;
    description: string;
    steps?: string[];
    script?: VisualizationAlgorithmScript;
  }>;
}

const PLACEHOLDER_TEXT = 'This is a placeholder visualization for the given section. ';

const representationTextMap: Record<VisualizationForm, string> = {
  sequential: 'sequential steps',
  linked: 'linked list (nodes + pointers)',
  tree: 'tree (nodes + edges)',
  graph: 'graph (nodes + edges)',
  hash: 'hash table (nodes + buckets)',
  algorithm: 'algorithm (steps + states)'
};

const inferFormBySectionSignals = (params: {
  sectionId: string;
  sectionName?: string;
  operations?: HardcodedVisualizationSeed['operations'];
}): VisualizationForm => {
  const normalizedId = params.sectionId.toLowerCase();
  const normalizedName = String(params.sectionName ?? '').toLowerCase();
  const operationText = (Array.isArray(params.operations)
    ? params.operations.map((item) => `${item?.name ?? ''} ${item?.description ?? ''}`).join(' ')
    : '').toLowerCase();
  const combined = `${normalizedId} ${normalizedName} ${operationText}`;

  if (/linked|stack|queue|Á´±í|Õ»|¶ÓÁÐ/.test(combined)) return 'linked';
  if (/tree|bst|avl|huffman|thread|b\+|btree|b-tree|ºìºÚ|ÏßË÷|»ô·òÂü|¶Ñ/.test(combined)) return 'tree';
  if (/graph|dijkstra|bellman|floyd|prim|kruskal|dfs|bfs|Í¼|×î¶ÌÂ·|×îÐ¡Éú³ÉÊ÷/.test(combined)) return 'graph';
  if (/hash|¹þÏ£/.test(combined)) return 'hash';
  if (/sort|search|kmp|bf|pattern|match|ÅÅÐò|²éÕÒ|Æ¥Åä/.test(combined)) return 'algorithm';

  if (/^2\.1(\.|$)/.test(normalizedId)) return 'sequential';
  if (/^2\.(2|3|4)(\.|$)/.test(normalizedId)) return 'linked';
  if (/^3\./.test(normalizedId)) return 'algorithm';
  if (/^4\./.test(normalizedId)) return 'tree';
  if (/^5\./.test(normalizedId)) return 'graph';
  if (/^6\.3(\.|$)/.test(normalizedId)) return 'hash';
  if (/^6\.(4|5)(\.|$)/.test(normalizedId)) return 'tree';
  if (/^6\./.test(normalizedId)) return 'algorithm';
  if (/^7\./.test(normalizedId)) return 'algorithm';

  return 'sequential';
};

const normalizeForm = (raw: unknown, fallback: VisualizationForm): VisualizationForm => {
  const normalized = String(raw ?? '').toLowerCase();
  if (normalized.includes('linked')) return 'linked';
  if (normalized.includes('tree')) return 'tree';
  if (normalized.includes('graph')) return 'graph';
  if (normalized.includes('hash')) return 'hash';
  if (normalized.includes('algo')) return 'algorithm';
  if (normalized.includes('array') || normalized.includes('sequential')) return 'sequential';
  return fallback;
};

const normalizeSteps = (steps: unknown, description: string): string[] => {
  if (Array.isArray(steps) && steps.length > 0) {
    return steps.map((item) => String(item));
  }

  if (description.trim().length > 0) {
    return [
      `Initial ${description}`,
      'Execute: advance the current algorithm state step by step',
      'Finish: output key states and final result for this run'
    ];
  }

  return ['Initialize algorithm state', 'Execute core steps', 'Output stage result'];
};

const normalizeIndexArray = (input: unknown): number[] | undefined => {
  if (!Array.isArray(input)) return undefined;
  const values = input
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 0);
  return values.length > 0 ? values : undefined;
};

const normalizeSwapPair = (input: unknown): [number, number] | undefined => {
  if (!Array.isArray(input) || input.length !== 2) {
    return undefined;
  }

  const left = Number(input[0]);
  const right = Number(input[1]);
  if (!Number.isInteger(left) || !Number.isInteger(right) || left < 0 || right < 0) {
    return undefined;
  }

  return [left, right];
};

const normalizeExplicitScript = (input: unknown): VisualizationAlgorithmScript | undefined => {
  if (!input || typeof input !== 'object') {
    return undefined;
  }

  const raw = input as Record<string, unknown>;
  if (raw.autoGenerate === true) {
    return undefined;
  }
  const rawKind = String(raw.kind ?? '').toLowerCase();
  const allowedKind: VisualizationAlgorithmScript['kind'][] = ['array', 'graph', 'tree', 'linked', 'generic'];
  const kind: VisualizationAlgorithmScript['kind'] = allowedKind.includes(rawKind as VisualizationAlgorithmScript['kind'])
    ? (rawKind as VisualizationAlgorithmScript['kind'])
    : 'generic';

  if (!Array.isArray(raw.frames)) {
    return undefined;
  }

  const frames = raw.frames
    .map((frame) => {
      if (!frame || typeof frame !== 'object') return null;
      const item = frame as Record<string, unknown>;
      const label = String(item.label ?? '').trim();
      if (!label) return null;

      const normalizedFrame: VisualizationFrame = {
        label,
        activeIndices: normalizeIndexArray(item.activeIndices),
        visitedIndices: normalizeIndexArray(item.visitedIndices),
        compareIndices: normalizeIndexArray(item.compareIndices),
        swapIndices: normalizeSwapPair(item.swapIndices),
        arrayState: Array.isArray(item.arrayState) ? item.arrayState.map((v) => String(v)) : undefined,
        runChains: Array.isArray(item.runChains)
          ? item.runChains.map((chain) => (Array.isArray(chain) ? chain.map((v) => String(v)) : [])).filter((chain) => chain.length >= 0)
          : undefined,
        outputList: Array.isArray(item.outputList) ? item.outputList.map((v) => String(v)) : undefined
      };

      return normalizedFrame;
    })
    .filter((frame): frame is VisualizationFrame => frame !== null);

  if (frames.length === 0) {
    return undefined;
  }

  return {
    kind,
    loop: raw.loop === undefined ? true : Boolean(raw.loop),
    frames
  };
};

const toNumericArray = (nodes: string[]): number[] | null => {
  const parsed = nodes.map((item) => Number(item));
  return parsed.every((item) => Number.isFinite(item)) ? parsed : null;
};

const buildInsertionSortFrames = (nodes: string[]): VisualizationFrame[] => {
  const nums = toNumericArray(nodes);
  if (!nums || nums.length < 2) {
    return [];
  }

  const arr = [...nums];
  const frames: VisualizationFrame[] = [
    {
      label: 'Initial array state',
      activeIndices: [0],
      arrayState: arr.map(String)
    }
  ];

  for (let i = 1; i < arr.length; i += 1) {
    const key = arr[i];
    let j = i - 1;

    frames.push({
      label: `Select key=${key} at index ${i}`,
      activeIndices: [i],
      arrayState: arr.map(String)
    });

    while (j >= 0 && arr[j] > key) {
      frames.push({
        label: `Compare a[${j}]=${arr[j]} with key=${key}`,
        compareIndices: [j, j + 1],
        activeIndices: [j],
        arrayState: arr.map(String)
      });

      arr[j + 1] = arr[j];
      frames.push({
        label: `Shift ${arr[j]} from index ${j} to ${j + 1}`,
        swapIndices: [j, j + 1],
        activeIndices: [j + 1],
        arrayState: arr.map(String)
      });
      j -= 1;
    }

    arr[j + 1] = key;
    frames.push({
      label: `Insert key=${key} at index ${j + 1}`,
      activeIndices: [j + 1],
      arrayState: arr.map(String)
    });
  }

  frames.push({
    label: 'Sorting completed',
    activeIndices: [arr.length - 1],
    arrayState: arr.map(String)
  });

  return frames;
};

const buildLinearAdjacency = (nodeCount: number): number[][] => {
  const adjacency: number[][] = Array.from({ length: nodeCount }, () => []);

  for (let i = 0; i < nodeCount; i += 1) {
    if (i + 1 < nodeCount) {
      adjacency[i].push(i + 1);
      adjacency[i + 1].push(i);
    }
    if (i + 2 < nodeCount && i % 2 === 0) {
      adjacency[i].push(i + 2);
      adjacency[i + 2].push(i);
    }
  }

  return adjacency;
};

const buildBfsFrames = (nodes: string[]): VisualizationFrame[] => {
  if (nodes.length === 0) return [];

  const adjacency = buildLinearAdjacency(nodes.length);
  const queue: number[] = [0];
  const visited = new Set<number>([0]);
  const order: number[] = [];
  const frames: VisualizationFrame[] = [
    {
      label: `Enqueue start node ${nodes[0]}`,
      activeIndices: [0],
      visitedIndices: [0]
    }
  ];

  while (queue.length > 0) {
    const node = queue.shift() as number;
    order.push(node);

    frames.push({
      label: `Visit node ${nodes[node]}`,
      activeIndices: [node],
      visitedIndices: [...order]
    });

    adjacency[node].forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
        frames.push({
          label: `Discover ${nodes[neighbor]} from ${nodes[node]}, enqueue`,
          activeIndices: [neighbor],
          visitedIndices: [...order, ...queue]
        });
      }
    });
  }

  frames.push({
    label: 'BFS traversal completed',
    activeIndices: [order[order.length - 1]],
    visitedIndices: [...order]
  });

  return frames;
};

const buildDfsFrames = (nodes: string[]): VisualizationFrame[] => {
  if (nodes.length === 0) return [];

  const adjacency = buildLinearAdjacency(nodes.length);
  const visited = new Set<number>();
  const order: number[] = [];
  const frames: VisualizationFrame[] = [];

  const dfs = (node: number) => {
    visited.add(node);
    order.push(node);
    frames.push({
      label: `Visit node ${nodes[node]} (DFS)` ,
      activeIndices: [node],
      visitedIndices: [...order]
    });

    adjacency[node].forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        frames.push({
          label: `Traverse edge ${nodes[node]} -> ${nodes[neighbor]}`,
          activeIndices: [node, neighbor],
          visitedIndices: [...order]
        });
        dfs(neighbor);
        frames.push({
          label: `Backtrack to ${nodes[node]}`,
          activeIndices: [node],
          visitedIndices: [...order]
        });
      }
    });
  };

  dfs(0);

  frames.push({
    label: 'DFS traversal completed',
    activeIndices: [order[order.length - 1]],
    visitedIndices: [...order]
  });

  return frames;
};

const buildTreeTraversalFrames = (nodes: string[], mode: 'preorder' | 'inorder' | 'postorder'): VisualizationFrame[] => {
  if (nodes.length === 0) return [];
  const frames: VisualizationFrame[] = [];
  const visited: number[] = [];

  const walk = (index: number) => {
    if (index >= nodes.length) {
      return;
    }

    const left = index * 2 + 1;
    const right = index * 2 + 2;

    if (mode === 'preorder') {
      visited.push(index);
      frames.push({
        label: `Visit ${nodes[index]} (preorder)`,
        activeIndices: [index],
        visitedIndices: [...visited]
      });
    }

    walk(left);

    if (mode === 'inorder') {
      visited.push(index);
      frames.push({
        label: `Visit ${nodes[index]} (inorder)`,
        activeIndices: [index],
        visitedIndices: [...visited]
      });
    }

    walk(right);

    if (mode === 'postorder') {
      visited.push(index);
      frames.push({
        label: `Visit ${nodes[index]} (postorder)`,
        activeIndices: [index],
        visitedIndices: [...visited]
      });
    }
  };

  walk(0);
  return frames;
};

const opHas = (operationName: string, keywords: string[]): boolean => {
  const normalized = operationName.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
};

const buildSelectionSortFrames = (nodes: string[]): VisualizationFrame[] => {
  const nums = toNumericArray(nodes);
  if (!nums || nums.length < 2) return [];

  const arr = [...nums];
  const frames: VisualizationFrame[] = [{ label: 'Initial array state', arrayState: arr.map(String), activeIndices: [0] }];

  for (let i = 0; i < arr.length - 1; i += 1) {
    let minIndex = i;
    for (let j = i + 1; j < arr.length; j += 1) {
      frames.push({
        label: `Compare a[${j}]=${arr[j]} with current min a[${minIndex}]=${arr[minIndex]}`,
        compareIndices: [j, minIndex],
        arrayState: arr.map(String)
      });
      if (arr[j] < arr[minIndex]) {
        minIndex = j;
      }
    }

    if (minIndex !== i) {
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
      frames.push({
        label: `Swap min index ${minIndex} into position ${i}`,
        swapIndices: [i, minIndex],
        arrayState: arr.map(String)
      });
    }
  }

  frames.push({ label: 'Selection sort completed', arrayState: arr.map(String), activeIndices: [arr.length - 1] });
  return frames;
};

const buildShellSortFrames = (nodes: string[]): VisualizationFrame[] => {
  const nums = toNumericArray(nodes);
  if (!nums || nums.length < 2) return [];

  const arr = [...nums];
  const frames: VisualizationFrame[] = [{ label: 'Initial array state', arrayState: arr.map(String), activeIndices: [0] }];

  for (let gap = Math.floor(arr.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
    frames.push({ label: `Current gap = ${gap}`, arrayState: arr.map(String) });
    for (let i = gap; i < arr.length; i += 1) {
      const temp = arr[i];
      let j = i;
      while (j >= gap && arr[j - gap] > temp) {
        frames.push({
          label: `Compare and shift: a[${j - gap}] -> a[${j}]`,
          compareIndices: [j - gap, j],
          arrayState: arr.map(String)
        });
        arr[j] = arr[j - gap];
        frames.push({ label: `Shift complete at index ${j}`, swapIndices: [j - gap, j], arrayState: arr.map(String) });
        j -= gap;
      }
      arr[j] = temp;
      frames.push({ label: `Insert ${temp} at index ${j}`, activeIndices: [j], arrayState: arr.map(String) });
    }
  }

  frames.push({ label: 'Shell sort completed', arrayState: arr.map(String), activeIndices: [arr.length - 1] });
  return frames;
};

const buildMergeSortFrames = (nodes: string[]): VisualizationFrame[] => {
  const nums = toNumericArray(nodes);
  if (!nums || nums.length < 2) return [];

  const arr = [...nums];
  const frames: VisualizationFrame[] = [{ label: 'Initial array state', arrayState: arr.map(String), activeIndices: [0] }];

  const merge = (left: number, mid: number, right: number) => {
    const leftPart = arr.slice(left, mid + 1);
    const rightPart = arr.slice(mid + 1, right + 1);
    let i = 0;
    let j = 0;
    let k = left;

    while (i < leftPart.length && j < rightPart.length) {
      frames.push({
        label: `Merge compare ${leftPart[i]} and ${rightPart[j]}`,
        compareIndices: [left + i, mid + 1 + j],
        arrayState: arr.map(String)
      });
      if (leftPart[i] <= rightPart[j]) {
        arr[k] = leftPart[i];
        i += 1;
      } else {
        arr[k] = rightPart[j];
        j += 1;
      }
      frames.push({ label: `Write merged value at index ${k}`, activeIndices: [k], arrayState: arr.map(String) });
      k += 1;
    }

    while (i < leftPart.length) {
      arr[k] = leftPart[i];
      frames.push({ label: `Copy remaining left value to index ${k}`, activeIndices: [k], arrayState: arr.map(String) });
      i += 1;
      k += 1;
    }
    while (j < rightPart.length) {
      arr[k] = rightPart[j];
      frames.push({ label: `Copy remaining right value to index ${k}`, activeIndices: [k], arrayState: arr.map(String) });
      j += 1;
      k += 1;
    }
  };

  const sort = (left: number, right: number) => {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    sort(left, mid);
    sort(mid + 1, right);
    merge(left, mid, right);
  };

  sort(0, arr.length - 1);
  frames.push({ label: 'Merge sort completed', arrayState: arr.map(String), activeIndices: [arr.length - 1] });
  return frames;
};

const buildQuickSortFrames = (nodes: string[]): VisualizationFrame[] => {
  const nums = toNumericArray(nodes);
  if (!nums || nums.length < 2) return [];

  const arr = [...nums];
  const frames: VisualizationFrame[] = [{ label: 'Initial array state', arrayState: arr.map(String), activeIndices: [0] }];

  const partition = (low: number, high: number): number => {
    const pivot = arr[high];
    let i = low;
    frames.push({ label: `Choose pivot ${pivot} at index ${high}`, activeIndices: [high], arrayState: arr.map(String) });

    for (let j = low; j < high; j += 1) {
      frames.push({ label: `Compare a[${j}] with pivot ${pivot}`, compareIndices: [j, high], arrayState: arr.map(String) });
      if (arr[j] <= pivot) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        frames.push({ label: `Swap index ${i} and ${j}`, swapIndices: [i, j], arrayState: arr.map(String) });
        i += 1;
      }
    }

    [arr[i], arr[high]] = [arr[high], arr[i]];
    frames.push({ label: `Place pivot at index ${i}`, swapIndices: [i, high], arrayState: arr.map(String) });
    return i;
  };

  const sort = (low: number, high: number) => {
    if (low >= high) return;
    const p = partition(low, high);
    sort(low, p - 1);
    sort(p + 1, high);
  };

  sort(0, arr.length - 1);
  frames.push({ label: 'Quick sort completed', arrayState: arr.map(String), activeIndices: [arr.length - 1] });
  return frames;
};

const buildHeapSortFrames = (nodes: string[]): VisualizationFrame[] => {
  const nums = toNumericArray(nodes);
  if (!nums || nums.length < 2) return [];

  const arr = [...nums];
  const frames: VisualizationFrame[] = [{ label: 'Initial array state', arrayState: arr.map(String), activeIndices: [0] }];

  const heapify = (n: number, i: number) => {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < n && arr[left] > arr[largest]) largest = left;
    if (right < n && arr[right] > arr[largest]) largest = right;

    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      frames.push({ label: `Heapify swap ${i} and ${largest}`, swapIndices: [i, largest], arrayState: arr.map(String) });
      heapify(n, largest);
    }
  };

  for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i -= 1) {
    heapify(arr.length, i);
  }
  frames.push({ label: 'Max-heap built', arrayState: arr.map(String) });

  for (let i = arr.length - 1; i > 0; i -= 1) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    frames.push({ label: `Extract max to index ${i}`, swapIndices: [0, i], arrayState: arr.map(String) });
    heapify(i, 0);
  }

  frames.push({ label: 'Heap sort completed', arrayState: arr.map(String), activeIndices: [arr.length - 1] });
  return frames;
};

const buildCountingSortFrames = (nodes: string[]): VisualizationFrame[] => {
  const nums = toNumericArray(nodes);
  if (!nums || nums.length < 2) return [];

  const arr = nums.map((item) => Math.trunc(item));
  const min = Math.min(...arr);
  const shifted = arr.map((item) => item - min);
  const max = Math.max(...shifted);
  const count = new Array(max + 1).fill(0);
  const output = new Array(arr.length).fill(0);
  const frames: VisualizationFrame[] = [{ label: 'Initial array state', arrayState: arr.map(String), activeIndices: [0] }];

  shifted.forEach((value, index) => {
    count[value] += 1;
    frames.push({ label: `Count value ${value + min}`, activeIndices: [index], arrayState: arr.map(String) });
  });

  for (let i = 1; i < count.length; i += 1) {
    count[i] += count[i - 1];
  }

  for (let i = shifted.length - 1; i >= 0; i -= 1) {
    const value = shifted[i];
    const pos = count[value] - 1;
    output[pos] = arr[i];
    count[value] -= 1;
    frames.push({ label: `Place ${arr[i]} at sorted index ${pos}`, activeIndices: [i], arrayState: output.map(String) });
  }

  frames.push({ label: 'Counting sort completed', arrayState: output.map(String), activeIndices: [output.length - 1] });
  return frames;
};

const buildBucketSortFrames = (nodes: string[]): VisualizationFrame[] => {
  const nums = toNumericArray(nodes);
  if (!nums || nums.length < 2) return [];

  const arr = [...nums];
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const bucketCount = Math.max(3, Math.floor(Math.sqrt(arr.length)));
  const buckets: number[][] = Array.from({ length: bucketCount }, () => []);
  const range = max - min + 1;
  const frames: VisualizationFrame[] = [{ label: 'Initial array state', arrayState: arr.map(String), activeIndices: [0] }];

  arr.forEach((value, index) => {
    const bucketIndex = Math.min(bucketCount - 1, Math.floor(((value - min) / range) * bucketCount));
    buckets[bucketIndex].push(value);
    frames.push({ label: `Put ${value} into bucket ${bucketIndex}`, activeIndices: [index], arrayState: arr.map(String) });
  });

  buckets.forEach((bucket) => bucket.sort((a, b) => a - b));
  const flattened = buckets.flat();

  frames.push({ label: 'Collect buckets in order', arrayState: flattened.map(String), activeIndices: [flattened.length - 1] });
  frames.push({ label: 'Bucket sort completed', arrayState: flattened.map(String), activeIndices: [flattened.length - 1] });
  return frames;
};

const buildRadixSortFrames = (nodes: string[]): VisualizationFrame[] => {
  const nums = toNumericArray(nodes);
  if (!nums || nums.length < 2) return [];
  if (nums.some((item) => item < 0)) return [];

  const arr = nums.map((item) => Math.trunc(item));
  const frames: VisualizationFrame[] = [{ label: 'Initial array state', arrayState: arr.map(String), activeIndices: [0] }];
  let exp = 1;
  const max = Math.max(...arr);

  while (Math.floor(max / exp) > 0) {
    const output = new Array(arr.length).fill(0);
    const count = new Array(10).fill(0);

    arr.forEach((value) => {
      const digit = Math.floor(value / exp) % 10;
      count[digit] += 1;
    });
    for (let i = 1; i < 10; i += 1) count[i] += count[i - 1];
    for (let i = arr.length - 1; i >= 0; i -= 1) {
      const digit = Math.floor(arr[i] / exp) % 10;
      output[count[digit] - 1] = arr[i];
      count[digit] -= 1;
    }

    for (let i = 0; i < arr.length; i += 1) arr[i] = output[i];
    frames.push({ label: `After digit pass exp=${exp}`, arrayState: arr.map(String), activeIndices: [arr.length - 1] });
    exp *= 10;
  }

  frames.push({ label: 'Radix sort completed', arrayState: arr.map(String), activeIndices: [arr.length - 1] });
  return frames;
};

const buildExternalSortFrames = (): VisualizationFrame[] => {
  const initialRuns: string[][] = [
    ['3', '9', '18', '27'],
    ['1', '7', '15', '24'],
    ['2', '8', '16', '25'],
    ['4', '10', '19', '28']
  ];

  const pointers = [0, 0, 0, 0];
  const output: string[] = [];
  const total = initialRuns.reduce((sum, run) => sum + run.length, 0);

  const snapshotRuns = () => initialRuns.map((run, idx) => run.slice(pointers[idx]));
  const frames: VisualizationFrame[] = [
    {
      label: 'Initialize 4 sorted runs on disk',
      runChains: snapshotRuns(),
      outputList: [],
      arrayState: []
    }
  ];

  while (output.length < total) {
    let selectedRun = -1;
    let selectedValue = Number.POSITIVE_INFINITY;

    for (let i = 0; i < initialRuns.length; i += 1) {
      const value = initialRuns[i][pointers[i]];
      if (value === undefined) continue;
      const numeric = Number(value);
      if (numeric < selectedValue) {
        selectedValue = numeric;
        selectedRun = i;
      }
    }

    if (selectedRun === -1) {
      break;
    }

    const chosen = initialRuns[selectedRun][pointers[selectedRun]];
    pointers[selectedRun] += 1;
    output.push(chosen);

    frames.push({
      label: `Round ${output.length}: merge ${chosen} from Run${selectedRun + 1}`,
      activeIndices: [selectedRun],
      runChains: snapshotRuns(),
      outputList: [...output],
      arrayState: [...output]
    });
  }

  frames.push({
    label: 'External sort merge completed',
    runChains: snapshotRuns(),
    outputList: [...output],
    arrayState: [...output],
    activeIndices: [initialRuns.length - 1]
  });

  return frames;
};

const buildLinearSearchFrames = (nodes: string[]): VisualizationFrame[] => {
  if (nodes.length === 0) return [];
  const target = nodes[Math.floor(nodes.length / 2)];
  const frames: VisualizationFrame[] = [{ label: `Target = ${target}`, activeIndices: [0], arrayState: [...nodes] }];

  for (let i = 0; i < nodes.length; i += 1) {
    frames.push({ label: `Compare a[${i}] with target`, compareIndices: [i], arrayState: [...nodes] });
    if (nodes[i] === target) {
      frames.push({ label: `Found target at index ${i}`, activeIndices: [i], visitedIndices: [i], arrayState: [...nodes] });
      break;
    }
  }

  return frames;
};

const buildBinarySearchFrames = (nodes: string[]): VisualizationFrame[] => {
  const nums = toNumericArray(nodes);
  if (!nums || nums.length === 0) return [];

  const arr = [...nums].sort((a, b) => a - b);
  const target = arr[Math.floor(arr.length / 2)];
  const frames: VisualizationFrame[] = [{ label: `Sorted array, target=${target}`, arrayState: arr.map(String), activeIndices: [0] }];
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    frames.push({
      label: `Check mid=${mid}, value=${arr[mid]}`,
      activeIndices: [mid],
      compareIndices: [mid],
      arrayState: arr.map(String)
    });
    if (arr[mid] === target) {
      frames.push({ label: `Found target at index ${mid}`, activeIndices: [mid], visitedIndices: [mid], arrayState: arr.map(String) });
      break;
    }
    if (arr[mid] < target) {
      left = mid + 1;
      frames.push({ label: `Move left boundary to ${left}`, arrayState: arr.map(String), activeIndices: [left] });
    } else {
      right = mid - 1;
      frames.push({ label: `Move right boundary to ${right}`, arrayState: arr.map(String), activeIndices: [Math.max(0, right)] });
    }
  }

  return frames;
};

const buildBstSearchFrames = (nodes: string[]): VisualizationFrame[] => {
  if (nodes.length === 0) return [];
  const targetIndex = Math.floor(nodes.length / 2);
  const target = nodes[targetIndex];
  const frames: VisualizationFrame[] = [{ label: `BST target=${target}`, activeIndices: [0] }];
  let index = 0;
  const targetValue = Number(target);
  const numericComparable = Number.isFinite(targetValue);

  while (index < nodes.length) {
    frames.push({ label: `Visit node index ${index} value=${nodes[index]}`, activeIndices: [index] });
    if (nodes[index] === target) {
      frames.push({ label: `Found target at node ${index}`, activeIndices: [index], visitedIndices: [index] });
      break;
    }

    const currentValue = nodes[index];
    const goLeft = numericComparable && Number.isFinite(Number(currentValue))
      ? targetValue < Number(currentValue)
      : String(target) < String(currentValue);
    const nextIndex = goLeft ? index * 2 + 1 : index * 2 + 2;

    frames.push({
      label: `${goLeft ? 'Go left' : 'Go right'} from ${currentValue}`,
      activeIndices: [index, nextIndex]
    });

    if (nextIndex >= nodes.length) {
      frames.push({ label: 'Search failed: null child reached', activeIndices: [index] });
      break;
    }

    index = nextIndex;
  }

  return frames;
};

const buildBruteForceMatchFrames = (nodes: string[]): VisualizationFrame[] => {
  const text = nodes.join('');
  if (text.length < 2) return [];
  const pattern = text.slice(Math.max(0, Math.floor(text.length / 3)), Math.max(2, Math.floor(text.length / 3) + 2));
  const frames: VisualizationFrame[] = [{ label: `Text=${text}, Pattern=${pattern}` }];

  for (let i = 0; i <= text.length - pattern.length; i += 1) {
    let matched = true;
    for (let j = 0; j < pattern.length; j += 1) {
      frames.push({ label: `Compare text[${i + j}] and pattern[${j}]`, compareIndices: [i + j] });
      if (text[i + j] !== pattern[j]) {
        matched = false;
        frames.push({ label: `Mismatch at text[${i + j}]`, activeIndices: [i + j] });
        break;
      }
    }
    if (matched) {
      frames.push({ label: `Pattern found at index ${i}`, activeIndices: [i], visitedIndices: [i] });
      return frames;
    }
  }

  frames.push({ label: 'Pattern not found' });
  return frames;
};

const buildKmpMatchFrames = (nodes: string[]): VisualizationFrame[] => {
  const text = nodes.join('');
  if (text.length < 3) return [];
  const pattern = text.slice(1, Math.min(4, text.length));
  if (!pattern) return [];

  const lps = new Array(pattern.length).fill(0);
  const frames: VisualizationFrame[] = [{ label: `Text=${text}, Pattern=${pattern}` }];

  let len = 0;
  for (let i = 1; i < pattern.length;) {
    if (pattern[i] === pattern[len]) {
      len += 1;
      lps[i] = len;
      frames.push({ label: `Build LPS: lps[${i}] = ${len}` });
      i += 1;
    } else if (len > 0) {
      len = lps[len - 1];
    } else {
      lps[i] = 0;
      frames.push({ label: `Build LPS: lps[${i}] = 0` });
      i += 1;
    }
  }

  let i = 0;
  let j = 0;
  while (i < text.length) {
    frames.push({ label: `Compare text[${i}] with pattern[${j}]`, compareIndices: [i] });
    if (text[i] === pattern[j]) {
      i += 1;
      j += 1;
      if (j === pattern.length) {
        frames.push({ label: `KMP match found at index ${i - j}`, activeIndices: [i - j], visitedIndices: [i - j] });
        return frames;
      }
    } else if (j > 0) {
      frames.push({ label: `Mismatch, fallback j from ${j} to ${lps[j - 1]}` });
      j = lps[j - 1];
    } else {
      i += 1;
    }
  }

  frames.push({ label: 'KMP no match found' });
  return frames;
};

const buildWeightedAdjacencyMatrix = (nodes: string[]): number[][] => {
  const n = Math.max(3, Math.min(nodes.length, 8));
  const matrix: number[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => Number.POSITIVE_INFINITY));

  for (let i = 0; i < n; i += 1) {
    matrix[i][i] = 0;
    for (let j = i + 1; j < n; j += 1) {
      if (j === i + 1 || (i % 2 === 0 && j === i + 2) || (i === 0 && j === n - 1)) {
        const w = Math.abs(Number(nodes[i] ?? i) - Number(nodes[j] ?? j));
        const weight = Number.isFinite(w) ? Math.max(1, Math.trunc(w)) : ((i + j) % 9) + 1;
        matrix[i][j] = weight;
        matrix[j][i] = weight;
      }
    }
  }

  return matrix;
};

const buildDijkstraFrames = (nodes: string[]): VisualizationFrame[] => {
  const matrix = buildWeightedAdjacencyMatrix(nodes);
  const n = matrix.length;
  const dist = Array.from({ length: n }, (_, index) => (index === 0 ? 0 : Number.POSITIVE_INFINITY));
  const visited = new Set<number>();
  const frames: VisualizationFrame[] = [{ label: 'Dijkstra from node 0', activeIndices: [0] }];

  for (let count = 0; count < n; count += 1) {
    let u = -1;
    let minDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < n; i += 1) {
      if (!visited.has(i) && dist[i] < minDist) {
        minDist = dist[i];
        u = i;
      }
    }
    if (u === -1) break;

    visited.add(u);
    frames.push({ label: `Pick nearest unvisited node ${u}, dist=${dist[u]}`, activeIndices: [u], visitedIndices: [...visited] });

    for (let v = 0; v < n; v += 1) {
      if (matrix[u][v] < Number.POSITIVE_INFINITY && !visited.has(v)) {
        const candidate = dist[u] + matrix[u][v];
        frames.push({ label: `Relax edge ${u}->${v}, candidate=${candidate}`, activeIndices: [u, v], compareIndices: [v] });
        if (candidate < dist[v]) {
          dist[v] = candidate;
          frames.push({ label: `Update dist[${v}] = ${candidate}`, activeIndices: [v], visitedIndices: [...visited] });
        }
      }
    }
  }

  frames.push({ label: `Dijkstra completed: ${dist.map((d) => (Number.isFinite(d) ? d : 'xÞ')).join(', ')}`, activeIndices: [n - 1] });
  return frames;
};

const buildBellmanFordFrames = (nodes: string[]): VisualizationFrame[] => {
  const matrix = buildWeightedAdjacencyMatrix(nodes);
  const n = matrix.length;
  const edges: Array<{ u: number; v: number; w: number }> = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = 0; v < n; v += 1) {
      if (u !== v && Number.isFinite(matrix[u][v])) {
        edges.push({ u, v, w: matrix[u][v] });
      }
    }
  }

  const dist = Array.from({ length: n }, (_, index) => (index === 0 ? 0 : Number.POSITIVE_INFINITY));
  const frames: VisualizationFrame[] = [{ label: 'Bellman-Ford from node 0', activeIndices: [0] }];

  for (let i = 0; i < n - 1; i += 1) {
    let changed = false;
    edges.forEach(({ u, v, w }) => {
      if (Number.isFinite(dist[u]) && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        changed = true;
        frames.push({ label: `Iteration ${i + 1}: relax ${u}->${v}, dist=${dist[v]}`, activeIndices: [u, v] });
      }
    });
    if (!changed) break;
  }

  frames.push({ label: `Bellman-Ford completed: ${dist.map((d) => (Number.isFinite(d) ? d : 'xÞ')).join(', ')}`, activeIndices: [n - 1] });
  return frames;
};

const buildFloydWarshallFrames = (nodes: string[]): VisualizationFrame[] => {
  const dist = buildWeightedAdjacencyMatrix(nodes).map((row) => [...row]);
  const n = dist.length;
  const frames: VisualizationFrame[] = [{ label: 'Floyd-Warshall initialize all-pairs distances' }];

  for (let k = 0; k < n; k += 1) {
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
          frames.push({
            label: `Update dist(${i},${j}) via ${k} => ${dist[i][j]}`,
            activeIndices: [i, j, k]
          });
        }
      }
    }
  }

  frames.push({ label: 'Floyd-Warshall completed', activeIndices: [n - 1] });
  return frames;
};

const buildPrimFrames = (nodes: string[]): VisualizationFrame[] => {
  const matrix = buildWeightedAdjacencyMatrix(nodes);
  const n = matrix.length;
  const inMst = new Set<number>([0]);
  const frames: VisualizationFrame[] = [{ label: 'Prim MST start at node 0', activeIndices: [0], visitedIndices: [0] }];

  while (inMst.size < n) {
    let bestU = -1;
    let bestV = -1;
    let bestW = Number.POSITIVE_INFINITY;

    inMst.forEach((u) => {
      for (let v = 0; v < n; v += 1) {
        if (!inMst.has(v) && matrix[u][v] < bestW) {
          bestW = matrix[u][v];
          bestU = u;
          bestV = v;
        }
      }
    });

    if (bestV === -1) break;
    inMst.add(bestV);
    frames.push({ label: `Add edge ${bestU}-${bestV} (w=${bestW})`, activeIndices: [bestU, bestV], visitedIndices: [...inMst] });
  }

  frames.push({ label: 'Prim MST completed', visitedIndices: [...inMst] });
  return frames;
};

const buildKruskalFrames = (nodes: string[]): VisualizationFrame[] => {
  const matrix = buildWeightedAdjacencyMatrix(nodes);
  const n = matrix.length;
  const edges: Array<{ u: number; v: number; w: number }> = [];
  for (let u = 0; u < n; u += 1) {
    for (let v = u + 1; v < n; v += 1) {
      if (Number.isFinite(matrix[u][v])) edges.push({ u, v, w: matrix[u][v] });
    }
  }
  edges.sort((a, b) => a.w - b.w);

  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  };
  const unite = (a: number, b: number): boolean => {
    const pa = find(a);
    const pb = find(b);
    if (pa === pb) return false;
    parent[pb] = pa;
    return true;
  };

  const frames: VisualizationFrame[] = [{ label: 'Kruskal sort edges by weight' }];
  let picked = 0;
  for (const edge of edges) {
    frames.push({ label: `Try edge ${edge.u}-${edge.v} (w=${edge.w})`, activeIndices: [edge.u, edge.v] });
    if (unite(edge.u, edge.v)) {
      picked += 1;
      frames.push({ label: `Accept edge ${edge.u}-${edge.v}`, activeIndices: [edge.u, edge.v], visitedIndices: [edge.u, edge.v] });
      if (picked === n - 1) break;
    } else {
      frames.push({ label: `Reject edge ${edge.u}-${edge.v} (cycle)` });
    }
  }

  frames.push({ label: 'Kruskal MST completed' });
  return frames;
};

const buildHuffmanTreeFrames = (nodes: string[]): VisualizationFrame[] => {
  const weights = nodes.map((item, index) => {
    const numeric = Number(item);
    return Number.isFinite(numeric) ? Math.max(1, Math.trunc(numeric)) : index + 1;
  });
  if (weights.length < 2) return [];

  type HuffNode = { id: string; weight: number };
  const queue: HuffNode[] = weights.map((weight, index) => ({ id: `n${index}`, weight }));
  const frames: VisualizationFrame[] = [{ label: `Initialize ${queue.length} leaf nodes` }];

  while (queue.length > 1) {
    queue.sort((a, b) => a.weight - b.weight);
    const left = queue.shift() as HuffNode;
    const right = queue.shift() as HuffNode;
    const merged: HuffNode = { id: `(${left.id}+${right.id})`, weight: left.weight + right.weight };
    frames.push({ label: `Merge ${left.id}:${left.weight} and ${right.id}:${right.weight} => ${merged.weight}` });
    queue.push(merged);
  }

  frames.push({ label: `Huffman tree built, root weight=${queue[0].weight}` });
  return frames;
};

const buildThreadedTreeFrames = (nodes: string[]): VisualizationFrame[] => {
  if (nodes.length === 0) return [];
  const inorderFrames = buildTreeTraversalFrames(nodes, 'inorder');
  const frames: VisualizationFrame[] = [{ label: 'Start building threaded binary tree' }, ...inorderFrames];
  for (let i = 0; i < nodes.length; i += 1) {
    frames.push({ label: `Thread node index ${i} with predecessor/successor`, activeIndices: [i] });
  }
  frames.push({ label: 'Threaded binary tree build completed' });
  return frames;
};

const buildCrudDemoFrames = (nodes: string[], operationName: string): VisualizationFrame[] => {
  if (nodes.length === 0) return [];
  const op = operationName.toLowerCase();
  const arr = [...nodes];
  const mid = Math.floor(arr.length / 2);

  if (opHas(op, ['modify', 'update', 'set', 'ÐÞ¸Ä', '¸ü¸Ä'])) {
    const next = [...arr];
    next[mid] = `${arr[mid]}*`;
    return [
      { label: `Locate index ${mid}`, activeIndices: [mid], arrayState: [...arr] },
      { label: `Modify value at index ${mid}`, activeIndices: [mid], visitedIndices: [mid], arrayState: next }
    ];
  }

  if (opHas(op, ['insert', 'enqueue', 'push', '²åÈë', 'Èë¶Ó', 'ÈëÕ»'])) {
    const next = [...arr];
    next.splice(mid, 0, String(Number(arr[mid]) + 1 || `${arr[mid]}+`));
    return [
      { label: `Select insert index ${mid}`, activeIndices: [mid], arrayState: [...arr] },
      { label: `Insert new node at index ${mid}`, activeIndices: [mid], visitedIndices: [mid], arrayState: next }
    ];
  }

  if (opHas(op, ['delete', 'remove', 'dequeue', 'pop', 'É¾³ý', '³ö¶Ó', '³öÕ»'])) {
    const next = [...arr];
    next.splice(mid, 1);
    return [
      { label: `Select delete index ${mid}`, activeIndices: [mid], arrayState: [...arr] },
      { label: `Delete node at index ${mid}`, activeIndices: [Math.max(0, mid - 1)], visitedIndices: [mid], arrayState: next }
    ];
  }

  if (opHas(op, ['search', 'find', 'locate', 'access', '²éÕÒ', '·ÃÎÊ'])) {
    return [
      { label: `Start searching from head/root`, activeIndices: [0], arrayState: [...arr] },
      { label: `Locate target near index ${mid}`, activeIndices: [mid], visitedIndices: [0, mid], arrayState: [...arr] }
    ];
  }

  return [];
};

const buildOperationScript = (params: {
  form: VisualizationForm;
  operationName: string;
  nodes: string[];
  steps: string[];
}): VisualizationAlgorithmScript | undefined => {
  const { form, operationName, nodes, steps } = params;
  const op = operationName.toLowerCase();

  if (opHas(op, ['buildtree', 'build tree', '½¨Ê÷']) && opHas(op, ['huffman', '»ô·òÂü'])) {
    const frames = buildHuffmanTreeFrames(nodes);
    if (frames.length > 0) return { kind: 'tree', frames, loop: false };
  }
  if (opHas(op, ['buildtree', 'build tree', '½¨Ê÷']) && opHas(op, ['thread', 'threaded', 'ÏßË÷'])) {
    const frames = buildThreadedTreeFrames(nodes);
    if (frames.length > 0) return { kind: 'tree', frames, loop: false };
  }

  if (opHas(op, ['external sort', 'external merge', 'Íâ²¿ÅÅÐò'])) {
    const frames = buildExternalSortFrames();
    if (frames.length > 0) return { kind: 'array', frames, loop: false };
  }

  if (form === 'algorithm' || form === 'sequential' || form === 'hash') {
    if (opHas(op, ['insertion sort', 'insert sort', '²åÈëÅÅÐò'])) {
      const frames = buildInsertionSortFrames(nodes);
      if (frames.length > 0) return { kind: 'array', frames, loop: false };
    }
    if (opHas(op, ['bubble', 'Ã°ÅÝ'])) {
      const base = toNumericArray(nodes);
      if (base && base.length > 1) {
        const arr = [...base];
        const frames: VisualizationFrame[] = [];
        for (let i = 0; i < arr.length; i += 1) {
          for (let j = 0; j < arr.length - i - 1; j += 1) {
            frames.push({ label: `Compare a[${j}] and a[${j + 1}]`, compareIndices: [j, j + 1], arrayState: arr.map(String) });
            if (arr[j] > arr[j + 1]) {
              [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
              frames.push({ label: `Swap index ${j} and ${j + 1}`, swapIndices: [j, j + 1], arrayState: arr.map(String) });
            }
          }
        }
        frames.push({ label: 'Bubble sort completed', arrayState: arr.map(String), activeIndices: [arr.length - 1] });
        return { kind: 'array', frames, loop: false };
      }
    }
    if (opHas(op, ['selection sort', 'Ñ¡ÔñÅÅÐò'])) {
      const frames = buildSelectionSortFrames(nodes);
      if (frames.length > 0) return { kind: 'array', frames, loop: false };
    }
    if (opHas(op, ['shell sort', 'Ï£¶ûÅÅÐò'])) {
      const frames = buildShellSortFrames(nodes);
      if (frames.length > 0) return { kind: 'array', frames, loop: false };
    }
    if (opHas(op, ['merge sort', '¹é²¢ÅÅÐò'])) {
      const frames = buildMergeSortFrames(nodes);
      if (frames.length > 0) return { kind: 'array', frames, loop: false };
    }
    if (opHas(op, ['quick sort', '¿ìËÙÅÅÐò'])) {
      const frames = buildQuickSortFrames(nodes);
      if (frames.length > 0) return { kind: 'array', frames, loop: false };
    }
    if (opHas(op, ['heap sort', '¶ÑÅÅÐò'])) {
      const frames = buildHeapSortFrames(nodes);
      if (frames.length > 0) return { kind: 'array', frames, loop: false };
    }
    if (opHas(op, ['counting sort', '¼ÆÊýÅÅÐò'])) {
      const frames = buildCountingSortFrames(nodes);
      if (frames.length > 0) return { kind: 'array', frames, loop: false };
    }
    if (opHas(op, ['bucket sort', 'Í°ÅÅÐò'])) {
      const frames = buildBucketSortFrames(nodes);
      if (frames.length > 0) return { kind: 'array', frames, loop: false };
    }
    if (opHas(op, ['radix sort', '»ùÊýÅÅÐò'])) {
      const frames = buildRadixSortFrames(nodes);
      if (frames.length > 0) return { kind: 'array', frames, loop: false };
    }

    if (opHas(op, ['binary search', '¶þ·Ö'])) {
      const frames = buildBinarySearchFrames(nodes);
      if (frames.length > 0) return { kind: 'array', frames, loop: true };
    }
    if (opHas(op, ['linear search', 'sequential search', 'Ë³ÐòËÑË÷', 'Ë³Ðò²éÕÒ'])) {
      const frames = buildLinearSearchFrames(nodes);
      if (frames.length > 0) return { kind: 'array', frames, loop: true };
    }
    if (opHas(op, ['kmp'])) {
      const frames = buildKmpMatchFrames(nodes);
      if (frames.length > 0) return { kind: 'generic', frames, loop: true };
    }
    if (opHas(op, ['brute force', 'bf match', '±©Á¦Æ¥Åä'])) {
      const frames = buildBruteForceMatchFrames(nodes);
      if (frames.length > 0) return { kind: 'generic', frames, loop: true };
    }
  }

  if (form === 'graph' || opHas(op, ['graph', 'Í¼'])) {
    if (opHas(op, ['bfs', 'breadth'])) {
      const frames = buildBfsFrames(nodes);
      if (frames.length > 0) return { kind: 'graph', frames, loop: true };
    }
    if (opHas(op, ['dfs', 'depth'])) {
      const frames = buildDfsFrames(nodes);
      if (frames.length > 0) return { kind: 'graph', frames, loop: true };
    }
    if (opHas(op, ['dijkstra', 'µÏ½ÜË¹ÌØÀ­'])) {
      const frames = buildDijkstraFrames(nodes);
      if (frames.length > 0) return { kind: 'graph', frames, loop: true };
    }
    if (opHas(op, ['bellman', 'ford'])) {
      const frames = buildBellmanFordFrames(nodes);
      if (frames.length > 0) return { kind: 'graph', frames, loop: true };
    }
    if (opHas(op, ['floyd', 'warshall'])) {
      const frames = buildFloydWarshallFrames(nodes);
      if (frames.length > 0) return { kind: 'graph', frames, loop: true };
    }
    if (opHas(op, ['prim'])) {
      const frames = buildPrimFrames(nodes);
      if (frames.length > 0) return { kind: 'graph', frames, loop: true };
    }
    if (opHas(op, ['kruskal'])) {
      const frames = buildKruskalFrames(nodes);
      if (frames.length > 0) return { kind: 'graph', frames, loop: true };
    }
  }

  if (form === 'tree') {
    if (opHas(op, ['preorder', 'ÏÈÐò'])) {
      const frames = buildTreeTraversalFrames(nodes, 'preorder');
      if (frames.length > 0) return { kind: 'tree', frames, loop: true };
    }
    if (opHas(op, ['inorder', 'ÖÐÐò'])) {
      const frames = buildTreeTraversalFrames(nodes, 'inorder');
      if (frames.length > 0) return { kind: 'tree', frames, loop: true };
    }
    if (opHas(op, ['postorder', 'ºóÐò'])) {
      const frames = buildTreeTraversalFrames(nodes, 'postorder');
      if (frames.length > 0) return { kind: 'tree', frames, loop: true };
    }
    if (opHas(op, ['bst search', 'binary search tree search', '¶þ²æËÑË÷Ê÷'])) {
      const frames = buildBstSearchFrames(nodes);
      if (frames.length > 0) return { kind: 'tree', frames, loop: true };
    }
  }

  const crudFrames = buildCrudDemoFrames(nodes, op);
  if (crudFrames.length > 0) {
    const kind: VisualizationAlgorithmScript['kind'] = form === 'graph'
      ? 'graph'
      : form === 'tree'
      ? 'tree'
      : form === 'linked'
      ? 'linked'
      : 'array';
    return { kind, frames: crudFrames, loop: true };
  }

  if (steps.length > 0) {
    return {
      kind: form === 'graph' ? 'graph' : form === 'tree' ? 'tree' : form === 'linked' ? 'linked' : 'generic',
      loop: true,
      frames: steps.map((label, index) => ({
        label,
        activeIndices: nodes.length > 0 ? [index % nodes.length] : []
      }))
    };
  }

  return undefined;
};

const normalizeOperations = (
  form: VisualizationForm,
  nodes: string[],
  rawOperations: unknown,
  fallbackOperations: HardcodedVisualizationSeed['operations']
): VisualizationOperationPlan[] => {
  const source = Array.isArray(rawOperations)
    ? rawOperations
    : (Array.isArray(fallbackOperations) ? fallbackOperations : []);

  return source
    .map((operation) => {
      if (!operation || typeof operation !== 'object') return null;
      const op = operation as Record<string, unknown>;
      const name = String(op.name ?? '').trim();
      const description = String(op.description ?? op.explanation ?? '').trim();
      const steps = normalizeSteps(op.steps, description);
      const explicitScript = normalizeExplicitScript(op.script);

      if (!name) return null;

      return {
        name,
        description,
        steps,
        dynamicPlan: `Dynamic visualization: highlight ${name} step by step`,
        script: explicitScript ?? buildOperationScript({
          form,
          operationName: name,
          nodes,
          steps
        })
      } as VisualizationOperationPlan;
    })
    .filter((item): item is VisualizationOperationPlan => item !== null);
};

const normalizeNodes = (raw: unknown, fallbackNodes: string[]): string[] => {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((item) => String(item));
  }

  return fallbackNodes;
};

export const buildHardcodedVisualizationModule = (seed: HardcodedVisualizationSeed): VisualizationModuleData => {
  const form = seed.form ?? inferFormBySectionSignals({
    sectionId: seed.sectionId,
    sectionName: seed.sectionName,
    operations: seed.operations
  });
  const nodes = Array.isArray(seed.nodes) ? seed.nodes : [];
  const operations = normalizeOperations(form, nodes, seed.operations, []);

  if (nodes.length === 0 && operations.length === 0) {
    return {
      source: 'placeholder',
      form,
      representation: representationTextMap[form],
      caption: '',
      nodes: [],
      operations: [],
      placeholderText: PLACEHOLDER_TEXT
    };
  }

  return {
    source: 'hardcoded',
    form,
    representation: representationTextMap[form],
    caption: seed.caption ?? `${seed.sectionName} Visualization`,
    nodes,
    operations
  };
};

const buildFromDatabase = (
  rawContent: unknown,
  hardcoded: VisualizationModuleData,
  sectionId: string
): VisualizationModuleData | null => {
  if (!rawContent || typeof rawContent !== 'object') {
    return null;
  }

  const payload = rawContent as Record<string, unknown>;
  const config = (payload.config && typeof payload.config === 'object')
    ? payload.config as Record<string, unknown>
    : null;

  const formFallback = hardcoded.form ?? inferFormBySectionSignals({
    sectionId,
    sectionName: hardcoded.caption,
    operations: hardcoded.operations
  });
  const form = normalizeForm(payload.type ?? config?.type, formFallback);

  const nodes = normalizeNodes(
    payload.nodes ?? payload.visualNodes ?? payload.defaultNodes ?? config?.defaultArray,
    hardcoded.nodes
  );

  const rawOperations = Array.isArray(payload.operations) ? payload.operations : [];
  const hasLegacyLookupOnly = sectionId === '6.3'
    && rawOperations.length === 1
    && String((rawOperations[0] as Record<string, unknown>)?.name ?? '').toLowerCase() === 'lookup';
  const hasLegacyBTreeOps = sectionId === '6.4'
    && rawOperations.length === 1
    && /insert\s*key/i.test(String((rawOperations[0] as Record<string, unknown>)?.name ?? ''));
  const hasLegacyBPlusOps = sectionId === '6.5'
    && rawOperations.length === 1
    && /range\s*query/i.test(String((rawOperations[0] as Record<string, unknown>)?.name ?? ''));
  const shouldFallbackToHardcodedOps = hasLegacyLookupOnly || hasLegacyBTreeOps || hasLegacyBPlusOps;
  const operations = normalizeOperations(
    form,
    nodes,
    shouldFallbackToHardcodedOps ? undefined : payload.operations,
    hardcoded.operations
  );
  const caption = String(payload.title ?? payload.visualCaption ?? hardcoded.caption ?? '').trim();

  const hasRenderableData = nodes.length > 0 || operations.length > 0 || caption.length > 0;
  if (!hasRenderableData) {
    return null;
  }

  return {
    source: 'database',
    form,
    representation: representationTextMap[form],
    caption: caption || hardcoded.caption,
    nodes,
    operations
  };
};

export const resolveVisualizationModuleData = (params: {
  hardcoded: HardcodedVisualizationSeed;
  databaseContent?: unknown;
  databaseSectionId?: string;
}): VisualizationModuleData => {
  const { hardcoded, databaseContent, databaseSectionId } = params;
  const hardcodedData = buildHardcodedVisualizationModule(hardcoded);

  if (databaseContent !== undefined) {
    const dbData = buildFromDatabase(
      databaseContent,
      hardcodedData,
      databaseSectionId ?? hardcoded.sectionId
    );
    if (dbData) {
      return dbData;
    }
  }

  return hardcodedData;
};

export const visualizationPlaceholderText = PLACEHOLDER_TEXT;
