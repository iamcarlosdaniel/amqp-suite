/**
 * Example: Hello World with amqp-suite
 *
 * Overview:
 * Demonstrates a basic event-driven flow using RabbitMQ topic exchanges.
 * This example publishes a message and consumes it from a bound queue.
 *
 * Architecture Flow:
 * [Publisher] -> (Topic Exchange) -> (Routing Key) -> [Queue] -> [Consumer]
 *
 * Notes:
 * - This example runs publisher and consumer in the same process
 *   for demonstration purposes only.
 * - In real-world applications, these responsibilities are usually
 *   separated into different services.
 *
 * Author:
 * Carlos Daniel Menchaca Arauz
 *
 * Package:
 * amqp-suite
 *
 * Repository:
 * https://github.com/iamcarlosdaniel/amqp-suite
 *
 * License:
 * MIT
 */

import { AmqpClient } from "amqp-suite";

/**
 * AMQP connection URL.
 * Usually points to a RabbitMQ instance.
 */
const AMQP_URL = "amqp://localhost";

/**
 * Topic exchange name.
 * Topic exchanges allow flexible routing using patterns.
 */
const TOPIC_EXCHANGE = "hello-exchange";

/**
 * Connection retry configuration.
 * Useful for environments where the broker may not be ready immediately.
 */
const RETRIES = 5;
const DELAY = 2000;

/**
 * Routing key namespace.
 * Using a prefix helps organize events in larger systems.
 */
const ROUTING_KEY_PREFIX = "example.events";

/**
 * Queue name where messages will be consumed.
 */
const QUEUE_NAME = "hello-queue";

/**
 * Message handler for consumed messages.
 *
 * @param {Object} msg - Parsed JSON message payload
 */
async function helloWorld(msg) {
  console.log("Received message payload:", msg);
}

/**
 * Main application entry point.
 */
async function main() {
  /**
   * Create an instance of the AMQP client.
   * This does not connect immediately; it only prepares the client.
   */
  const amqpClient = new AmqpClient(AMQP_URL, TOPIC_EXCHANGE);

  try {
    /**
     * Establish a connection to the AMQP broker.
     * Includes automatic retries in case of failure.
     */
    await amqpClient.connect(RETRIES, DELAY);

    /**
     * Define a routing key for the "Hello World" event.
     * Topic exchanges route messages based on this key.
     */
    const routingKey = `${ROUTING_KEY_PREFIX}.hello_world`;

    /**
     * Message payload.
     * It will be automatically serialized to JSON before publishing.
     */
    const payload = {
      id: 123,
      message: "Hello World!",
    };

    /**
     * Publish the message to the exchange using the routing key.
     */
    await amqpClient.publish(routingKey, payload);

    /**
     * Consumer configuration.
     * Prefetch limits how many unacknowledged messages can be processed at once.
     */
    const options = {
      prefetch: 10,
    };

    /**
     * Binding key used to link the queue to the exchange.
     * Only messages matching this pattern will be delivered to the queue.
     */
    const bindingKey = `${ROUTING_KEY_PREFIX}.hello_world`;

    /**
     * Start consuming messages from the queue.
     * The `helloWorld` function will be called for each received message.
     */
    await amqpClient.consume(QUEUE_NAME, helloWorld, options, bindingKey);
  } catch (error) {
    console.error(error.message);
  } finally {
    /**
     * Gracefully close the AMQP connection.
     * In real-world applications, this is usually done on shutdown signals.
     */
    await amqpClient.close();
  }
}

/**
 * Execute the example.
 */
main();
