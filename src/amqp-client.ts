import amqp from "amqplib";

import type { ChannelModel, Channel, Options, ConsumeMessage } from "amqplib";

/**
 * @fileoverview
 * AMQP Service Class to manage AMQP communication.
 * Handles automatic connection, channel management, and structured
 * pub/sub patterns using 'topic' exchanges.
 */
class AmqpClient {
  private readonly amqpUrl: string;
  private readonly exchange: string;
  private channelModel: ChannelModel | null = null;
  private channel: Channel | null = null;
  /** State flag to prevent multiple simultaneous connection attempts. */
  private isConnecting: boolean = false;
  /** State flag to indicate if the client is closing. */
  private isClosing: boolean = false;

  /**
   * Creates an instance of the AMQP helper.
   * @param amqpUrl - The connection string (e.g., 'amqp://localhost').
   * @param exchange - The name of the exchange to be used.
   */
  constructor(amqpUrl: string, exchange: string) {
    this.amqpUrl = amqpUrl;
    this.exchange = exchange;
  }

  /**
   * Establishes a connection to the AMQP broker and sets up the infrastructure.
   * Implements a recursive retry logic in case of connection failure or drops.
   * @param retries - Maximum number of reconnection attempts.
   * @param delay - Time interval in milliseconds between retries.
   * @returns {Promise<void>}
   * @throws {Error} Throws an error if all retry attempts fail.
   */
  async connect(retries: number = 5, delay: number = 5000): Promise<void> {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.channelModel = await amqp.connect(this.amqpUrl);
      this.channel = await this.channelModel.createChannel();

      // Infrastructure initial setup: Using 'topic' for flexible routing
      await this.channel.assertExchange(this.exchange, "topic", {
        durable: true,
      });

      this.channelModel.on("error", (err: any) => {
        console.error("AMQP Connection Error:", err);
      });

      this.channelModel.on("close", () => {
        this.channelModel = null;
        this.channel = null;

        if (!this.isClosing) {
          this.isConnecting = false;
          console.warn(`AMQP connection lost. Retrying in ${delay}ms...`);
          setTimeout(() => this.connect(), delay);
        }
      });

      console.log("AMQP: Connection established successfully");
      this.isConnecting = false;
    } catch (error) {
      this.isConnecting = false;
      if (retries > 0) {
        console.error(
          `AMQP: Connection failed. Retries left: ${retries}. Retrying in ${delay}ms...`,
        );
        setTimeout(() => this.connect(retries - 1, delay), delay);
      } else {
        console.error(
          "AMQP: Critical failure. Could not connect after maximum attempts.",
        );
        throw error;
      }
    }
  }

  /**
   * Publishes a message to the configured exchange.
   * @param routingKey - The routing key used to direct the message.
   * @param message - The message payload (will be stringified to JSON).
   * @param options - Additional publish options.
   * @returns {Promise<void>}
   */
  async publish(
    routingKey: string,
    message: unknown,
    options: Options.Publish = {},
  ): Promise<void> {
    if (!this.channel) {
      console.log("AMQP: Channel not initialized. Attempting to connect...");
      await this.connect();
    }

    try {
      const published = this.channel!.publish(
        this.exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true, ...options },
      );

      if (published) {
        console.log(`AMQP: Message published to [${routingKey}]`);
      } else {
        console.warn(
          "AMQP: Message was buffered locally. Check broker capacity or channel drain.",
        );
      }
    } catch (err) {
      console.error("AMQP: Failed to publish message:", err);
      throw err;
    }
  }

  /**
   * Consumes messages from a specific queue.
   * @param queue - The name of the queue to consume from.
   * @param onMessage - Callback executed when a message is received.
   * @param options - Additional queue and prefetch options.
   * @param bindingKey - The binding pattern to link the queue to the exchange.
   * @returns {Promise<void>}
   */
  async consume(
    queue: string,
    onMessage: (content: any, msg: ConsumeMessage) => Promise<void>,
    options: Options.AssertQueue & { prefetch?: number } = {},
    bindingKey: string = "#",
  ): Promise<void> {
    if (!this.channel) {
      console.log("AMQP: Channel not initialized. Attempting to connect...");
      await this.connect();
    }

    try {
      const { prefetch = 10, ...queueOptions } = options;

      // Ensure the queue exists and is durable by default
      await this.channel!.assertQueue(queue, {
        durable: true,
        ...queueOptions,
      });
      await this.channel!.bindQueue(queue, this.exchange, bindingKey);

      // Limit unacknowledged messages to avoid overwhelming the consumer
      await this.channel!.prefetch(prefetch);

      await this.channel!.consume(
        queue,
        async (msg: ConsumeMessage | null) => {
          if (msg !== null) {
            try {
              const content = JSON.parse(msg.content.toString());
              await onMessage(content, msg);
              this.channel!.ack(msg);
            } catch (err: any) {
              console.error(
                `AMQP: Error processing message on queue [${queue}]:`,
                err.message,
              );
              // nack(message, requeue: false) to prevent infinite loops on malformed messages
              this.channel!.nack(msg, false, false);
            }
          }
        },
        { noAck: false },
      );

      console.log(
        `AMQP: Consumer started for queue [${queue}] with binding [${bindingKey}]`,
      );
    } catch (err) {
      console.error("AMQP: Failed to initialize consumer:", err);
      throw err;
    }
  }

  /**
   * Gracefully closes the AMQP channel and connection.
   * @returns {Promise<void>}
   */
  async close(): Promise<void> {
    try {
      this.isClosing = true;
      await this.channel?.close();
      await (this.channelModel as any)?.close();
      console.log("AMQP: Connection closed cleanly.");
    } catch (err) {
      this.isClosing = false;
      console.error("AMQP: Error during shutdown:", err);
    }
  }
}

export { AmqpClient };
