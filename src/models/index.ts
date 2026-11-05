import Recruiter from './Recruiter';
import Job from './Job';
import JobRequirement from './JobRequirement';

// ----- Relations -----
Recruiter.hasMany(Job, { foreignKey: 'recruiterId', as: 'jobs', onDelete: 'CASCADE' });
Job.belongsTo(Recruiter, { foreignKey: 'recruiterId', as: 'recruiter' });

Job.hasMany(JobRequirement, { foreignKey: 'jobId', as: 'requirements', onDelete: 'CASCADE' });
JobRequirement.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

export {
  Recruiter,
  Job,
  JobRequirement,
};
