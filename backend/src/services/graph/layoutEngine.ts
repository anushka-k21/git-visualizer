import { GraphEdge, GraphNode } from '../../types';
import { isMergeCommit } from '../../utils/mergeDetection';

export interface LayoutCommit {
  hash: string;
  parentHashes: string[];
  author: string;
  message: string;
  commitDate: Date;
}

const LANE_WIDTH = 120;
const ROW_HEIGHT = 80;

function compareCommits(a: LayoutCommit, b: LayoutCommit): number {
  const dateDiff = a.commitDate.getTime() - b.commitDate.getTime();
  if (dateDiff !== 0) return dateDiff;
  return a.hash.localeCompare(b.hash);
}

function compareCommitsDesc(a: LayoutCommit, b: LayoutCommit): number {
  return -compareCommits(a, b);
}

export interface LayoutBranchMeta {
  headHashes: Set<string>;
  namesByHead: Map<string, string[]>;
}

export function computeLayout(
  commits: LayoutCommit[],
  branchMeta?: LayoutBranchMeta
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (commits.length === 0) {
    return { nodes: [], edges: [] };
  }

  const commitMap = new Map<string, LayoutCommit>();
  for (const commit of commits) {
    commitMap.set(commit.hash, commit);
  }

  const childrenMap = new Map<string, string[]>();
  for (const commit of commits) {
    for (const parent of commit.parentHashes) {
      if (!commitMap.has(parent)) continue;
      const children = childrenMap.get(parent) ?? [];
      children.push(commit.hash);
      childrenMap.set(parent, children);
    }
  }

  for (const [parent, children] of childrenMap) {
    children.sort((a, b) => compareCommits(commitMap.get(a)!, commitMap.get(b)!));
    childrenMap.set(parent, children);
  }

  const sortedAsc = [...commits].sort(compareCommits);
  const sortedDesc = [...commits].sort(compareCommitsDesc);

  const rowIndex = new Map<string, number>();
  sortedDesc.forEach((commit, index) => {
    rowIndex.set(commit.hash, index);
  });

  const lanes = new Map<string, number>();
  let nextLane = 0;

  const assignLane = (hash: string, lane: number): void => {
    if (!lanes.has(hash)) {
      lanes.set(hash, lane);
    }
  };

  const takeNextLane = (): number => {
    const lane = nextLane;
    nextLane += 1;
    return lane;
  };

  for (const commit of sortedAsc) {
    const parents = commit.parentHashes.filter((p) => commitMap.has(p));

    if (parents.length === 0) {
      assignLane(commit.hash, takeNextLane());
      continue;
    }

    const primaryParent = parents[0];
    const parentLane = lanes.get(primaryParent) ?? takeNextLane();
    assignLane(commit.hash, parentLane);

    for (const parent of parents) {
      const siblings = childrenMap.get(parent) ?? [];
      if (siblings.length <= 1) continue;

      const primaryChild = siblings[0];
      for (const sibling of siblings) {
        if (sibling === primaryChild) continue;
        if (!lanes.has(sibling)) {
          assignLane(sibling, takeNextLane());
        }
      }
    }
  }

  for (const commit of sortedAsc) {
    if (!lanes.has(commit.hash)) {
      assignLane(commit.hash, takeNextLane());
    }
  }

  const nodes: GraphNode[] = sortedDesc.map((commit) => {
    const lane = lanes.get(commit.hash) ?? 0;
    const row = rowIndex.get(commit.hash) ?? 0;

    return {
      id: commit.hash,
      position: {
        x: lane * LANE_WIDTH,
        y: row * ROW_HEIGHT,
      },
      data: {
        hash: commit.hash,
        author: commit.author,
        message: commit.message,
        commitDate: commit.commitDate.toISOString(),
        isMerge: isMergeCommit(commit.parentHashes),
        isMergeCommit: isMergeCommit(commit.parentHashes),
        isBranchHead: branchMeta?.headHashes.has(commit.hash) ?? false,
        branchNames: branchMeta?.namesByHead.get(commit.hash) ?? [],
      },
    };
  });

  const edges: GraphEdge[] = [];
  const edgeIds = new Set<string>();

  for (const commit of commits) {
    for (const parent of commit.parentHashes) {
      if (!commitMap.has(parent)) continue;
      const edgeId = `${parent}-${commit.hash}`;
      if (edgeIds.has(edgeId)) continue;
      edgeIds.add(edgeId);
      edges.push({
        id: edgeId,
        source: parent,
        target: commit.hash,
      });
    }
  }

  edges.sort((a, b) => a.id.localeCompare(b.id));

  return { nodes, edges };
}
