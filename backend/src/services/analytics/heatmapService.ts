import prisma from '../../utils/prisma';
import { aggregateHeatmap, parseHeatmapRange } from '../../utils/heatmapAggregation';
import { HeatmapEntry, HeatmapRange } from '../../types';

export class HeatmapService {
  async getHeatmap(repositoryId: string, rangeParam?: string): Promise<HeatmapEntry[]> {
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });
    if (!repository) throw new Error('Repository not found');

    const range: HeatmapRange = parseHeatmapRange(rangeParam);

    const commits = await prisma.commit.findMany({
      where: { repositoryId },
      select: { commitDate: true },
      orderBy: { commitDate: 'asc' },
    });

    return aggregateHeatmap(commits, range);
  }
}
