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

export interface ContributorListItem {
  id: string;
  name: string;
  email: string;
  totalCommits: number;
  firstCommitDate: string;
  lastCommitDate: string;
}

export interface ContributorActivityBucket {
  period: string;
  count: number;
}

export interface ContributorDetail extends ContributorListItem {
  commitsPerWeek: ContributorActivityBucket[];
  commitsPerMonth: ContributorActivityBucket[];
  recentCommits: { hash: string; message: string; commitDate: string }[];
}

export interface SyncContributorsResult {
  repositoryId: string;
  contributorsSynced: number;
}

export interface ContributorChartItem {
  name: string;
  email: string;
  totalCommits: number;
}

export interface RepositoryStats {
  totalCommits: number;
  totalBranches: number;
  totalContributors: number;
  totalMergeCommits: number;
  averageCommitsPerDay: number;
  repositoryAgeDays: number;
  repositoryAgeYears: number;
  firstCommitDate: string | null;
  latestCommitDate: string | null;
  averageCommitsPerContributor: number;
  activeContributorsLast30Days: number;
  mostActiveContributor: { name: string; email: string; totalCommits: number } | null;
  commitsByContributor: ContributorChartItem[];
  commitsOverTime: ContributorActivityBucket[];
}

export type HeatmapRange = '30d' | '90d' | '1y' | 'all';

export interface HeatmapEntry {
  date: string;
  commitCount: number;
}

export interface RepositoryFile {
  path: string;
  name: string;
}

export interface FileHistoryEntry {
  hash: string;
  author: string;
  message: string;
  commitDate: string;
}

export interface FileHistoryResponse {
  entries: FileHistoryEntry[];
  hasMore: boolean;
}

export type DiffFileStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'binary';

export interface DiffFile {
  path: string;
  oldPath: string | null;
  status: DiffFileStatus;
  additions: number;
  deletions: number;
  patch: string | null;
}

export interface CommitDiff {
  commitHash: string;
  author: string;
  message: string;
  commitDate: string;
  files: DiffFile[];
}

export interface ComparisonCommitSummary {
  hash: string;
  author: string;
  message: string;
  commitDate: string;
}

export interface BranchComparison {
  sourceBranch: string;
  targetBranch: string;
  mergeBase: string;
  aheadCount: number;
  behindCount: number;
  additions: number;
  deletions: number;
  changedFiles: string[];
  sourceUniqueCommits: ComparisonCommitSummary[];
  targetUniqueCommits: ComparisonCommitSummary[];
}

export interface PlaybackGraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface PlaybackTimelineEntry {
  timestamp: string;
  commitHash: string;
  graphState: PlaybackGraphState;
}

export type PlaybackDateFilter = 'all' | '1y' | '6m' | 'custom';

export interface PlaybackTimeline {
  repositoryId: string;
  baseGraph: GraphResponse;
  timeline: PlaybackTimelineEntry[];
}

export interface ImpactCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  impactScore: number;
  additions: number;
  deletions: number;
  filesChanged: number;
}

export interface ImpactInsights {
  mostImpactfulContributor: { name: string; totalImpact: number } | null;
  mostImpactfulBranch: { name: string; score: number } | null;
  mostImpactfulMonth: { period: string; totalImpact: number } | null;
  largestCommit: { hash: string; impactScore: number; message: string } | null;
  largestMerge: { hash: string; impactScore: number; message: string } | null;
  totalCommits?: number;
}

export interface ImpactAnalysisResponse {
  repositoryId: string;
  topCommits: ImpactCommit[];
  insights: ImpactInsights;
  scoreByHash: Record<string, number>;
}
