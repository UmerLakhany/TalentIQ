import amqp from 'amqplib';
import 'dotenv/config';

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;
type AmqpConfirmChannel = Awaited<ReturnType<AmqpConnection['createConfirmChannel']>>;

/** Queue of CVs waiting for AI analysis. Consumed by the CV worker. */
export const CV_PROCESSING_QUEUE = process.env.CV_PROCESSING_QUEUE || 'cv_processing';

const RECONNECT_DELAY_MS = 5000;

class RabbitMQClass {
  private static instance: RabbitMQClass | null = null;
  private connection: AmqpConnection | null = null;
  private channel: AmqpConfirmChannel | null = null;
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
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }
}

export default RabbitMQClass;
