# amqp-suite

[![NPM version](https://img.shields.io/npm/v/amqp-suite?color=1447e6&style=flat-square)](https://www.npmjs.com/package/amqp-suite)
[![MIT license](https://img.shields.io/badge/License-MIT-bridhtgreen?style=flat-square)](https://opensource.org/licenses/MIT)
[![NPM downloads](https://img.shields.io/npm/dw/amqp-suite?color=bridhtgreen&style=flat-square)](https://www.npmjs.com/package/amqp-suite)
[![stars](https://img.shields.io/github/stars/iamcarlosdaniel/amqp-suite)](https://github.com/iamcarlosdaniel/amqp-suite)

![](https://raw.githubusercontent.com/iamcarlosdaniel/amqp-suite/main/docs/assets/repository_banner.png)

`amqp-suite` is a simple and efficient AMQP (Advanced Message Queuing Protocol) client wrapper for Node.js that handles connection management, message publishing, and consuming messages from queues with a topic exchange. This package abstracts complex connection handling and simplifies AMQP usage in applications by providing easy-to-use methods for connecting, publishing, consuming, and gracefully shutting down the connection.

> [!IMPORTANT]
> Contributions, feedback and suggestions are welcome.  
> If you have ideas for improvements, feature requests, or find any issues, please open an issue or submit a pull request. <br/>
> Your input helps make this library better for everyone —  
> **[get started here](https://github.com/iamcarlosdaniel/amqp-suite?tab=contributing-ov-file)**.

## 🔥 Features

- **Automatic Reconnection:** Built-in retry logic for connection failures and drops.
- **Simplified Pub/Sub:** Designed for 'topic' exchanges to allow flexible routing.
- **Structured Messaging:** Automatic JSON serialization and deserialization.
- **Error Handling:** Graceful handling of malformed messages and channel crashes.
- **Flow Control:** Integrated prefetch support to prevent consumer saturation.

## Installation

### Package manager

Using npm:

```bash
npm install amqp-suite
```

Using yarn:

```bash
yarn add amqp-suite
```

Using pnpm:

```bash
pnpm add amqp-suite
```

Using bun:

```bash
bun add amqp-suite
```

Once the package is installed, you can import the library using ES Modules:

```javascript
import { AmqpClient } from "amqp-suite";
```

## Quick Start

### 1. Initialize and Connect

Create an instance of `AmqpClient` and establish a connection to your RabbitMQ broker. This prepares the client to publish and consume messages.

```javascript
import { AmqpClient } from "amqp-suite";

const amqpClient = new AmqpClient("amqp://localhost", "example-exchange");

await amqpClient.connect();
```

### 2. Publish Messages

The `publish` method automatically stringifies your message and sends it as a persistent buffer, ensuring it won’t be lost if the broker restarts.

```javascript
await amqpClient.publish(
  "example.events.hello_world", // Routing Key
  {
    message: "Hello World!",
  },
  {} // Options
);
```

### 3. Consume Messages

The `consume` method automatically creates queues, binds them to the exchange, and handles acknowledgments (`ack`/`nack`). You only need to provide the queue name and the function that will process incoming messages.

```javascript
await amqpClient.consume(
  "example-queue", // Queue
  (msg) => {
    console.log("Received message:", msg);
  },
  {}, // Options
  "example.events.hello_world" // Binding Key
);
```

### Example Overview

This diagram illustrates how a message is sent from the publisher, routed through the topic exchange, enqueued in the queue, and finally consumed by the consumer.

![](https://raw.githubusercontent.com/iamcarlosdaniel/amqp-suite/main/docs/assets/example-architecture-diagram.svg)

Here’s a full example that connects, publishes, consumes messages, and finally closes the connection.

```javascript
import { AmqpClient } from "amqp-suite";

const amqpClient = new AmqpClient("amqp://localhost", "example-exchange");

await amqpClient.connect();

await amqpClient.publish(
  "example.events.hello_world", // Routing Key
  {
    message: "Hello World!",
  },
  {} // Options
);

await amqpClient.consume(
  "example-queue", // Queue
  (msg) => {
    console.log("Received message:", msg);
  },
  {}, // Options
  "example.events.hello_world" // Binding Key
);

await amqpClient.close();
```

> **Note:** You can check the full example in [examples/hello-world](https://github.com/iamcarlosdaniel/amqp-suite/tree/main/examples/hello-world).

## API Reference

### `new AmqpClient(amqpUrl, exchange)`

Creates a new instance of the AMQP client.

The client uses a **durable topic exchange** to enable flexible message routing using routing patterns.

#### Parameters

- **`amqpUrl`** (`string`)
  The AMQP connection URL.
  Example: `amqp://user:pass@localhost:5672`

- **`exchange`** (`string`)
  The name of the **topic exchange** used for publishing and consuming messages.
  The exchange is asserted as `durable`.

---

### `.connect(retries = 5, delay = 5000)`

Establishes a connection to the AMQP broker and creates a channel.
If the connection is lost unexpectedly, the client will automatically attempt to reconnect.

#### Parameters

- **`retries`** (`number`, optional)
  Maximum number of reconnection attempts during the initial connection.
  Default: `5`

- **`delay`** (`number`, optional)
  Delay in milliseconds between reconnection attempts.
  Default: `5000`

#### Behavior

- Prevents multiple simultaneous connection attempts.
- Automatically reconnects if the connection is closed by the broker.
- Reconnection attempts triggered after a connection drop do **not** reuse the original retry counter.

#### Returns

- `Promise<void>`

---

### `.publish(routingKey, message, options = {})`

Publishes a message to the configured topic exchange using the specified routing key.

Messages are automatically serialized to JSON and published as **persistent** by default.

#### Parameters

- **`routingKey`** (`string`)
  The routing key used to route the message.
  Example: `user.events.create`

- **`message`** (`object`)
  The message payload. It will be automatically serialized to JSON.

- **`options`** (`object`, optional)
  Additional publish options supported by `amqplib`.
  These options are merged with `{ persistent: true }`.

#### Behavior

- If the channel is not initialized, the client will attempt to connect automatically.
- If the broker’s write buffer is full, the message may be temporarily buffered locally.

#### Returns

- `Promise<void>`

---

### `.consume(queue, onMessage, options = {}, bindingKey = "#")`

Consumes messages from the specified queue and binds it to the exchange using the provided routing pattern.

The `onMessage` callback is executed for each received message.

#### Parameters

- **`queue`** (`string`)
  The name of the queue to consume messages from.
  The queue is asserted as `durable`.

- **`onMessage`** (`function`)
  An asynchronous callback executed when a message is received.

  ```javascript
  async (content, rawMessage) => {
    // message handling logic
  };
  ```

  - `content`: Parsed JSON message payload.
  - `rawMessage`: The original `ConsumeMessage` from `amqplib`.

- **`options`** (`object`, optional)
  Consumer configuration options.

  - **`prefetch`** (`number`):
    Limits the number of unacknowledged messages.
    Default: `10`

- **`bindingKey`** (`string`, optional)
  The routing pattern used to bind the queue to the exchange.
  Default: `#` (matches all routing keys).

#### Behavior

- Messages are acknowledged (`ack`) automatically after successful processing.
- If an error is thrown while processing a message:

  - The message is negatively acknowledged (`nack`)
  - The message is **not requeued**, preventing infinite retry loops for malformed messages.

#### Returns

- `Promise<void>`

---

### `.close()`

Gracefully closes the AMQP channel and connection.

#### Behavior

- Prevents automatic reconnection during shutdown.
- Ensures resources are released cleanly.

#### Returns

- `Promise<void>`

## License

This project is licensed under the terms of the [MIT License](https://github.com/iamcarlosdaniel/amqp-suite?tab=MIT-1-ov-file).
