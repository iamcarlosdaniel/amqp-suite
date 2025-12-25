declare module "amqp-suite" {
  export class AmqpClient {
    constructor(amqpUrl: string, exchange: string);
    connect(retries?: number, delay?: number): Promise<void>;
    publish(routingKey: string, message: any, options?: any): Promise<void>;
    consume(
      queue: string,
      onMessage: (content: any, msg: any) => Promise<void>,
      options?: any,
      bindingKey?: string
    ): Promise<void>;
    close(): Promise<void>;
  }
}
