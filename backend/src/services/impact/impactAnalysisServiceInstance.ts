import { ImpactAnalysisService } from './impactAnalysisService';
import { GitService } from '../git/gitService';

const repositoriesPath = process.env.REPOSITORIES_PATH || './repositories';
export const impactAnalysisService = new ImpactAnalysisService(new GitService(repositoriesPath));
