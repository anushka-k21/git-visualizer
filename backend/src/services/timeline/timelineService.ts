import prisma from '../../utils/prisma';
import {
  aggregateTimeline,
  TimelineGroupBy,
  TimelinePeriod,
} from '../../utils/timelineAggregation';

const VALID_GROUP_BY: TimelineGroupBy[] = ['day', 'week', 'month'];

export class TimelineService {
  async getTimeline(
    repositoryId: string,
    groupByParam: string | undefined
  ): Promise<TimelinePeriod[]> {
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!repository) {
      throw new Error('Repository not found');
    }

    const groupBy = VALID_GROUP_BY.includes(groupByParam as TimelineGroupBy)
      ? (groupByParam as TimelineGroupBy)
      : 'day';

    const commits = await prisma.commit.findMany({
      where: { repositoryId },
      select: {
        hash: true,
        author: true,
        message: true,
        commitDate: true,
      },
      orderBy: { commitDate: 'desc' },
    });

    return aggregateTimeline(commits, groupBy);
  }
}
