import { Request, Response } from 'express';
import { PlaybackService } from '../services/playback/playbackService';
import { ApiResponse, PlaybackDateFilter, PlaybackTimeline } from '../types';

const playbackService = new PlaybackService();

export const getRepositoryPlayback = async (
  req: Request<{ id: string }, {}, {}, { filter?: string }>,
  res: Response<ApiResponse<PlaybackTimeline>>
): Promise<void> => {
  try {
    const filter = (req.query.filter as PlaybackDateFilter) || 'all';
    const data = await playbackService.getPlayback(req.params.id, filter);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    if (message === 'Repository not found') {
      res.status(404).json({ success: false, error: message });
      return;
    }
    res.status(500).json({ success: false, error: message });
  }
};
