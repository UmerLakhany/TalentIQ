import { Request, Response } from 'express';
import asyncHandler from '../common/asyncHandler';
import DashboardRepository from '../repositories/dashboard.repository';
import Cache, { CACHE_TTL_SECONDS, CacheKeys } from '../lib/classes/Cache';
import { Candidate, Job } from '../models';

/** Same bands as MATCH_SCORE_BANDS in the recruiter panel (src/data/candidates.ts). */
const SCORE_BANDS = [
  { label: 'Strong Match', min: 85 },
  { label: 'Good Match', min: 70 },
  { label: 'Partial Match', min: 50 },
  { label: 'Low Match', min: 0 },
];

const TOP_CANDIDATES = 5;
const NEEDS_ATTENTION_LIMIT = 10;

const average = (values: number[]) =>
  values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : null;

/** How many of the job's mandatory requirements this analysed candidate fully meets. */
const mandatoryCoverage = (candidate: Candidate, mandatoryIds: Set<string>) => {
  const rows = (candidate.evaluation?.requirements ?? []) as { requirementId: string; verdict: string }[];
  const met = rows.filter((row) => mandatoryIds.has(row.requirementId) && row.verdict === 'met').length;
  return { met, total: mandatoryIds.size };
};

const buildDashboard = async (recruiterId: string) => {
  const jobs = await DashboardRepository.jobsForRecruiter(recruiterId);
  const candidates = await DashboardRepository.candidatesForJobs(jobs.map((job) => job.id));

  const jobById = new Map(jobs.map((job) => [job.id, job]));
  const mandatoryIdsByJob = new Map(
    jobs.map((job) => [job.id, new Set((job.requirements ?? []).filter((r) => r.type === 'mandatory').map((r) => r.id))]),
  );

  const byStatus = (status: Candidate['status'], list = candidates) => list.filter((c) => c.status === status);
  const analyzed = byStatus('completed').filter((c) => c.matchScore !== null);

  const summarise = (candidate: Candidate) => {
    const job = jobById.get(candidate.jobId)!;
    const coverage = mandatoryCoverage(candidate, mandatoryIdsByJob.get(job.id)!);
    return {
      id: candidate.id,
      name: String(candidate.profile?.name || candidate.fileName),
      currentRole: String(candidate.profile?.currentRole || ''),
      jobId: job.id,
      jobTitle: job.title,
      matchScore: candidate.matchScore,
      mandatoryMet: coverage.met,
      mandatoryTotal: coverage.total,
    };
  };

  const allMandatoryMet = analyzed.filter((c) => {
    const coverage = mandatoryCoverage(c, mandatoryIdsByJob.get(c.jobId)!);
    return coverage.total > 0 && coverage.met === coverage.total;
  }).length;

  const ranked = [...analyzed].sort((a, b) => b.matchScore! - a.matchScore!);

  return {
    stats: {
      jobs: jobs.length,
      cvs: candidates.length,
      analyzed: analyzed.length,
      averageScore: average(analyzed.map((c) => c.matchScore!)),
      inProgress: byStatus('queued').length + byStatus('processing').length,
      failed: byStatus('failed').length,
      allMandatoryMet,
    },
    topCandidates: ranked.slice(0, TOP_CANDIDATES).map(summarise),
    scoreDistribution: SCORE_BANDS.map((band, index) => {
      const max = index === 0 ? Infinity : SCORE_BANDS[index - 1].min;
      return {
        ...band,
        max: index === 0 ? 100 : max - 1,
        count: analyzed.filter((c) => c.matchScore! >= band.min && c.matchScore! < max).length,
      };
    }),
    processing: {
      queued: byStatus('queued').length,
      processing: byStatus('processing').length,
      completed: byStatus('completed').length,
      failed: byStatus('failed').length,
    },
    jobs: jobs.map((job: Job) => {
      const jobCvs = candidates.filter((c) => c.jobId === job.id);
      const jobAnalyzed = ranked.filter((c) => c.jobId === job.id);
      const best = jobAnalyzed[0];
      return {
        id: job.id,
        title: job.title,
        createdAt: job.createdAt.toISOString().slice(0, 10),
        totalCvs: jobCvs.length,
        analyzed: jobAnalyzed.length,
        inProgress: byStatus('queued', jobCvs).length + byStatus('processing', jobCvs).length,
        failed: byStatus('failed', jobCvs).length,
        averageScore: average(jobAnalyzed.map((c) => c.matchScore!)),
        bestCandidate: best ? { id: best.id, name: String(best.profile?.name || best.fileName), matchScore: best.matchScore } : null,
      };
    }),
    needsAttention: byStatus('failed')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, NEEDS_ATTENTION_LIMIT)
      .map((c) => ({
        id: c.id,
        fileName: c.fileName,
        jobId: c.jobId,
        jobTitle: jobById.get(c.jobId)!.title,
        errorMessage: c.errorMessage,
        uploadedAt: c.createdAt.toISOString(),
      })),
    generatedAt: new Date().toISOString(),
  };
};

class DashboardService {
  /**
   * GET /api/v1/recruiter/dashboard: everything the Dashboard page shows, for the logged-in
   * recruiter's jobs only. Cached in Redis; cleared when jobs or CVs change or a CV finishes analysis.
   */
  static getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const recruiterId = req.user!.id;
    const { value, hit } = await Cache.remember(
      CacheKeys.dashboard(recruiterId),
      CACHE_TTL_SECONDS.dashboard,
      () => buildDashboard(recruiterId),
    );
    res.setHeader('X-Cache', hit ? 'HIT' : 'MISS');
    return res.generalResponse('Dashboard fetched successfully.', value, 200);
  });
}

export default DashboardService;
