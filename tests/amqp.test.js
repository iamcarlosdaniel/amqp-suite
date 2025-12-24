/**
 * @fileoverview Unit tests for the AMQP class using Vitest and amqplib mocks.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import amqp from "amqplib";
import { AmqpClient } from "amqp-suite";

vi.mock("amqplib");

/**
 * Test suite for AMQP integration and message handling.
 */
describe("AMQP Class", () => {
  /** @type {AmqpClient} */
  let amqpInstance;

  /** @type {string} */
  const mockUrl = "amqp://localhost";

  /** @type {string} */
  const mockExchange = "test_exchange";

  /**
   * Mocked AMQP Channel object with Vitest spy functions.
   * @type {Object}
   */
  const mockChannel = {
    assertExchange: vi.fn().mockResolvedValue(undefined),
    assertQueue: vi.fn().mockResolvedValue({}),
    bindQueue: vi.fn().mockResolvedValue(undefined),
    prefetch: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn().mockReturnValue(true),
    consume: vi.fn().mockResolvedValue({ consumerTag: "abc" }),
    ack: vi.fn(),
    nack: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  };

  /**
   * Mocked AMQP Connection object.
   * @type {Object}
   */
  const mockConnection = {
    createChannel: vi.fn().mockResolvedValue(mockChannel),
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  };

  /**
   * Setup hook to reset mocks and re-initialize the AMQP instance before each test.
   */
  beforeEach(() => {
    vi.clearAllMocks();
    amqpInstance = new AmqpClient(mockUrl, mockExchange);
    amqp.connect.mockResolvedValue(mockConnection);
  });

  /**
   * Test case: Constructor property assignment.
   */
  it("should correctly initialize values in the constructor", () => {
    expect(amqpInstance.amqpUrl).toBe(mockUrl);
    expect(amqpInstance.exchange).toBe(mockExchange);
  });

  /**
   * Test case: Connection workflow and exchange assertion.
   */
  it("should connect and create a channel successfully", async () => {
    await amqpInstance.connect();

    expect(amqp.connect).toHaveBeenCalledWith(mockUrl);
    expect(mockConnection.createChannel).toHaveBeenCalled();
    expect(mockChannel.assertExchange).toHaveBeenCalledWith(
      mockExchange,
      "topic",
      { durable: true }
    );
    expect(amqpInstance.connection).not.toBeNull();
  });

  /**
   * Test case: Message publishing logic and buffer conversion.
   */
  it("should publish a message correctly", async () => {
    await amqpInstance.connect();
    const routingKey = "user.created";
    const message = { id: 1, name: "Test" };

    await amqpInstance.publish(routingKey, message);

    expect(mockChannel.publish).toHaveBeenCalledWith(
      mockExchange,
      routingKey,
      expect.any(Buffer),
      expect.objectContaining({ persistent: true })
    );
  });

  /**
   * Test case: Consumer setup and successful message processing.
   */
  it("should setup consumer and acknowledge messages on success", async () => {
    await amqpInstance.connect();
    const queueName = "test_queue";
    const bindingKey = "test.key";
    const mockPayload = { data: "hello world" };
    const mockOnMessage = vi.fn().mockResolvedValue(undefined);

    await amqpInstance.consume(
      queueName,
      mockOnMessage,
      { prefetch: 5 },
      bindingKey
    );

    expect(mockChannel.assertQueue).toHaveBeenCalledWith(
      queueName,
      expect.objectContaining({ durable: true })
    );
    expect(mockChannel.bindQueue).toHaveBeenCalledWith(
      queueName,
      mockExchange,
      bindingKey
    );
    expect(mockChannel.prefetch).toHaveBeenCalledWith(5);

    const consumerCallback = mockChannel.consume.mock.calls[0][1];
    const fakeMsg = {
      content: Buffer.from(JSON.stringify(mockPayload)),
    };

    await consumerCallback(fakeMsg);

    expect(mockOnMessage).toHaveBeenCalledWith(mockPayload, fakeMsg);
    expect(mockChannel.ack).toHaveBeenCalledWith(fakeMsg);
  });

  /**
   * Test case: Consumer error handling (nack).
   */
  it("should nack messages if the processing fails", async () => {
    await amqpInstance.connect();
    const mockOnMessage = vi
      .fn()
      .mockRejectedValue(new Error("Processing failed"));

    await amqpInstance.consume("error_queue", mockOnMessage);

    const consumerCallback = mockChannel.consume.mock.calls[0][1];
    const fakeMsg = {
      content: Buffer.from(JSON.stringify({ some: "data" })),
    };

    await consumerCallback(fakeMsg);

    expect(mockChannel.nack).toHaveBeenCalledWith(fakeMsg, false, false);
    expect(mockChannel.ack).not.toHaveBeenCalled();
  });

  /**
   * Test case: Graceful shutdown of channel and connection.
   */
  it("should close the connection cleanly", async () => {
    await amqpInstance.connect();
    await amqpInstance.close();

    expect(mockChannel.close).toHaveBeenCalled();
    expect(mockConnection.close).toHaveBeenCalled();
  });
});
