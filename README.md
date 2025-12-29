# amqp-suite

[![NPM version](https://img.shields.io/npm/v/amqp-suite?color=1447e6&style=flat-square)](https://www.npmjs.com/package/amqp-suite)
[![MIT license](https://img.shields.io/badge/License-MIT-bridhtgreen?style=flat-square)](https://opensource.org/licenses/MIT)
[![NPM downloads](https://img.shields.io/npm/dw/amqp-suite?color=bridhtgreen&style=flat-square)](https://www.npmjs.com/package/amqp-suite)
[![stars](https://img.shields.io/github/stars/iamcarlosdaniel/amqp-suite)](https://github.com/iamcarlosdaniel/amqp-suite)

![](https://raw.githubusercontent.com/iamcarlosdaniel/amqp-suite/main/docs/assets/repository_banner.png)

`amqp-suite` is a simple and efficient AMQP (Advanced Message Queuing Protocol) client wrapper for Node.js that handles connection management, message publishing, and consuming messages from queues with a topic exchange. This package abstracts complex connection handling and simplifies AMQP usage in applications by providing easy-to-use methods for connecting, publishing, consuming, and gracefully shutting down the connection.

## Features

- Automatic Reconnection: Built-in retry logic for connection failures and drops.
- Simplified Pub/Sub: Designed for 'topic' exchanges to allow flexible routing.
- Structured Messaging: Automatic JSON serialization and deserialization.
- Error Handling: Graceful handling of malformed messages and channel crashes.
- Flow Control: Integrated prefetch support to prevent consumer saturation.

## Installation

```bash
npm install amqp-suite
```

## Quick Start

### 1. Initialize and Connect

Create an instance of the `AmqpClient` and establish a connection to the RabbitMQ broker.

```javascript
import { AmqpClient } from "amqp-suite";

const amqpClient = new AmqpClient("amqp://localhost", "my_exchange");

// Connect with optional retry config (retries, delay in ms)
await amqpClient.connect(5, 2000);
```

### 2. Publish Messages

The `publish` method ensures that the message is stringified and sent as a persistent buffer.

```javascript
const payload = {
  id: 123,
  event: "user_created",
  timestamp: new Date(),
};

await amqpClient.publish("user.events.create", payload);
```

### 3. Consume Messages

The `consume` method automatically asserts queues, binds them to the exchange, and handles acknowledgments (`ack`/`nack`).

```javascript
await amqpClient.consume(
  "user_service_queue",
  async (content, msg) => {
    console.log("Received data:", content);
    // Business logic here...
  },
  { prefetch: 10 }, // Optional: defaults to 10
  "user.events.*" // Binding key (Topic pattern)
);
```

> ### More Examples
>
> - [hello-world](https://github.com/iamcarlosdaniel/amqp-suite/tree/main/example/hello-world)

## API Reference

### `new AmqpClient(amqpUrl, exchange)`

- **amqpUrl**: The connection string (e.g., `amqp://user:pass@localhost:5672`).
- **exchange**: The name of the topic exchange to use.

### `.connect(retries = 5, delay = 5000)`

Establishes the connection and creates the channel. If the connection drops, it will automatically attempt to reconnect.

- **retries** (optional): Number of reconnection attempts (default: `5`).
- **delay** (optional): Time interval (in milliseconds) between retries (default: `5000`).

### `.publish(routingKey, message, options = {})`

Publishes a message to the configured exchange with the given routing key.

- **routingKey**: The routing key used to route the message (e.g., `'user.events.create'`).
- **message**: The message payload, which will be stringified into JSON.
- **options** (optional): Additional publish options from `amqplib`.

### `.consume(queue, onMessage, options = {}, bindingKey = "#")`

Consumes messages from the specified queue. The callback `onMessage` is executed when a message is received.

- **queue**: The name of the queue to consume messages from.
- **onMessage**: An async callback function that will be called with the message content and the original message.

  ```javascript
  async (content, rawMessage) => {
    /* logic */
  };
  ```

- **options** (optional): Additional options like `prefetch` (default is 10).
- **bindingKey** (optional): The routing pattern to bind the queue (default is `#`).

### `.close()`

Gracefully closes the channel and the connection.

## License

This project is licensed under the terms of the [MIT License](https://opensource.org/licenses/MIT).
