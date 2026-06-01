export interface Repository {
  id: string;
  name: string;
  owner: string;
  url: string;
  localPath: string;
  createdAt: Date;
}

export interface Commit {
  hash: string;
  author: string;
  email: string;
  message: string;
  commitDate: Date;
  parents: string[];
}

export interface CommitListItem {
  hash: string;
  author: string;
  message: string;
  commitDate: Date;
  parents: string[];
}

export interface CommitDetails {
  hash: string;
  author: string;
  email: string;
  message: string;
  commitDate: Date;
  filesChanged: number;
  additions: number;
  deletions: number;
  parentHashes: string[];
  isMergeCommit: boolean;
}

export interface SyncResult {
  repositoryId: string;
  commitsParsed: number;
  commitsStored: number;
}

export interface BranchListItem {
  id: string;
  name: string;
  headCommitHash: string;
  isDefault: boolean;
  commitCount: number;
}

export interface SyncBranchesResult {
  repositoryId: string;
  branchesSynced: number;
  activeBranch: string;
}

export interface GraphNodeData {
  hash: string;
  author: string;
  message: string;
  commitDate: string;
  isMerge: boolean;
  isMergeCommit: boolean;
  isBranchHead: boolean;
  branchNames: string[];
}

export interface GraphNode {
  id: string;
  position: { x: number; y: number };
  data: GraphNodeData;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  activeBranch: string | null;
}

export interface TimelineCommit {
  hash: string;
  author: string;
  message: string;
  commitDate: string;
}

export interface TimelinePeriod {
  period: string;
  commitCount: number;
  commits: TimelineCommit[];
}

export type TimelineResponse = TimelinePeriod[];

export interface ImportRepositoryRequest {
  url: string;
}

export interface ImportRepositoryResponse {
  success: boolean;
  data?: Repository;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ParsedGitUrl {
  owner: string;
  name: string;
}
