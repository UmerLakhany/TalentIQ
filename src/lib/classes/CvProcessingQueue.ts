import RabbitMQClass, { CV_PROCESSING_QUEUE } from '../../../settings/queue/rabbitmq';

/** Message the CV worker receives for each uploaded CV. */
export interface CvProcessingMessage {
  candidateId: string;
  jobId: string;
}

class CvProcessingQueue {
  /** Queues one CV for AI analysis. Resolves once RabbitMQ has stored the message. */
  static async enqueue(message: CvProcessingMessage): Promise<void> {
    await RabbitMQClass.getInstance().publish(CV_PROCESSING_QUEUE, { ...message, queuedAt: new Date().toISOString() });
  }
}

export default CvProcessingQueue;
