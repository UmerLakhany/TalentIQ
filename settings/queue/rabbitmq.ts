import amqp from 'amqplib';
import 'dotenv/config';

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;
type AmqpConfirmChannel = Awaited<ReturnType<AmqpConnection['createConfirmChannel']>>;

/** Queue of CVs waiting for AI analysis. Consumed by the CV worker. */
export const CV_PROCESSING_QUEUE = process.env.CV_PROCESSING_QUEUE || 'cv_processing';

const RECONNECT_DELAY_MS = 5000;
/** Wait before putting a message back after an unexpected error (e.g. database down), to avoid a hot loop. */
const REQUEUE_DELAY_MS = 5000;

export type MessageHandler = (payload: any) => Promise<void>;

interface Consumer {
  queue: string;
  prefetch: number;
  handler: MessageHandler;
}

class RabbitMQClass {
  private static instance: RabbitMQClass | null = null;
  private connection: AmqpConnection | null = null;
  private channel: AmqpConfirmChannel | null = null;
  /** Registered consumers; re-subscribed automatically after a reconnect. */
  private consumers: Consumer[] = [];
  private connecting: Promise<void> | null = null;
  private closing = false;

  public static getInstance(): RabbitMQClass {
    if (!RabbitMQClass.instance) {
      RabbitMQClass.instance = new RabbitMQClass();
    }
    return RabbitMQClass.instance;
  }

  /** Opens the connection and declares the queues. Safe to call more than once. */
  public async connect(): Promise<void> {
    if (this.channel) return;
    if (!this.connecting) {
      this.connecting = this.open().finally(() => {
        this.connecting = null;
      });
    }
    return this.connecting;
  }

  private async open(): Promise<void> {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
    connection.on('error', (err) => console.error('RabbitMQ error:', err.message));
    connection.on('close', () => {
      this.connection = null;
      this.channel = null;
      if (this.closing) return;
      console.warn(`RabbitMQ connection closed. Reconnecting in ${RECONNECT_DELAY_MS / 1000}s...`);
      setTimeout(() => {
        this.connect().catch((err) => console.error('RabbitMQ reconnect failed:', err.message));
      }, RECONNECT_DELAY_MS);
    });

    // Confirm channel: publish() resolves only after RabbitMQ has stored the message.
    const channel = await connection.createConfirmChannel();
    await channel.assertQueue(CV_PROCESSING_QUEUE, { durable: true });

    this.connection = connection;
    this.channel = channel;
    console.log('RabbitMQ connected.');

    for (const consumer of this.consumers) {
      await this.startConsumer(consumer);
    }
  }

  /**
   * Consumes JSON messages from a queue, at most `prefetch` at a time. A message is acknowledged
   * (removed) after the handler resolves; if the handler throws it is put back on the queue after
   * a short delay. Unparseable messages are discarded.
   */
  public async consume(queue: string, prefetch: number, handler: MessageHandler): Promise<void> {
    await this.connect();
    const consumer = { queue, prefetch, handler };
    this.consumers.push(consumer);
    await this.startConsumer(consumer);
  }

  private async startConsumer({ queue, prefetch, handler }: Consumer): Promise<void> {
    const channel = await this.connection!.createChannel();
    await channel.assertQueue(queue, { durable: true });
    await channel.prefetch(prefetch);

    await channel.consume(queue, async (message) => {
      if (!message) return; // consumer cancelled by the server

      let payload: unknown;
      try {
        payload = JSON.parse(message.content.toString());
      } catch {
        console.error(`Discarding malformed message on "${queue}".`);
        channel.ack(message);
        return;
      }

      try {
        await handler(payload);
        channel.ack(message);
      } catch (err: any) {
        console.error(`Handler failed on "${queue}", requeueing:`, err?.message || err);
        setTimeout(() => {
          try {
            channel.nack(message, false, true);
          } catch {
            // Channel already closed: RabbitMQ redelivers unacknowledged messages by itself.
          }
        }, REQUEUE_DELAY_MS);
      }
    }, { noAck: false });

    console.log(`Consuming "${queue}" (prefetch ${prefetch}).`);
  }

  /** Publishes a persistent JSON message and waits for RabbitMQ to confirm it. */
  public async publish(queue: string, payload: Record<string, unknown>): Promise<void> {
    await this.connect();
    const channel = this.channel!;
    await new Promise<void>((resolve, reject) => {
      channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true, contentType: 'application/json' },
        (err) => (err ? reject(err) : resolve()),
      );
    });
  }

  public async close(): Promise<void> {
    this.closing = true;
    await this.connection?.close().catch(() => undefined);
  }
}

export default RabbitMQClass;
