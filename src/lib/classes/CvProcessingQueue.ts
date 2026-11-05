import RabbitMQClass, { CV_PROCESSING_QUEUE } from '../../../settings/queue/rabbitmq';

/** Message the CV worker receives for each CV to analyse. */
export interface CvProcessingMessage {
  candidateId: string;
  jobId: string;
  /** Candidate.analysisVersion when queued; the worker skips the message if it has changed since. */
  analysisVersion?: number;
}

class CvProcessingQueue {
  /** Queues one CV for AI analysis. Resolves once RabbitMQ has stored the message. */
  static async enqueue(message: CvProcessingMessage): Promise<void> {
    await RabbitMQClass.getInstance().publish(CV_PROCESSING_QUEUE, { ...message, queuedAt: new Date().toISOString() });
  }
}

export default CvProcessingQueue;
