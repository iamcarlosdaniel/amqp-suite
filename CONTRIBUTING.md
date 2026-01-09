# Contributing to AMQP-Suite

If you have a question about AMQP-Suite (not a bug report) please post it to the [GitHub Discussions](https://github.com/iamcarlosdaniel/amqp-suite/discussions).

## Reporting bugs

- Before opening a new issue, look for existing [issues](https://github.com/iamcarlosdaniel/amqp-suite/issues) to avoid duplication. If the issue does not yet exist, [create one](https://github.com/iamcarlosdaniel/amqp-suite/issues/new).
- Please post any relevant code samples, preferably a standalone script that reproduces your issue. Do **not** describe your issue in prose. **Show your code.**
- If the bug involves an error, please post the stack trace.
- Please post the version of **amqp-suite**, **Node.js**, and **RabbitMQ** that you're using.
- Please write bug reports in **JavaScript (ES6+)**, not CoffeeScript or TypeScript.

## Requesting new features

- Before opening a new issue, look for existing issues to avoid duplication.
- Please describe a clear use case for it.
- Please include test cases or example API usage if possible.

## Fixing bugs / Adding features

- Before starting to write code, look for existing issues. This avoids working on something that might already be in progress.
- **Source Code:** This project is written in **JavaScript**. Please do not submit PRs converting the logic to TypeScript.
- **Typings:** If you modify the public API, you **must** update the corresponding `.d.ts` files to keep the TypeScript definitions in sync.
- Fork the [repo](https://github.com/iamcarlosdaniel/amqp-suite) and create your branch from `main`.
- Follow the general coding style of the project:
- 2 space tabs.
- No trailing whitespace.
- 1 space between conditionals, no space before function parenthesis:
- `if (..) {`
- `for (..) {`
- `function(err, res) {`

- Write tests and make sure they pass (tests are in the `test` directory).

## Running the tests

To run the tests locally, you need a running RabbitMQ instance.

- Open a terminal and navigate to the root of the project.
- Execute `npm install` to install dependencies.
- **RabbitMQ Setup:** Ensure you have a RabbitMQ server running on `localhost:5672`. You can quickly start one via Docker:

```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

- Execute `npm test` to run the test suite (using Mocha/Jest).
- To run tests with a specific reporter or flag, use:

```bash
npm test -- --reporter spec
```

## Documentation

To contribute to the documentation, edit the `README.md` or any files in the `docs` directory. For small changes, you can use the GitHub **Edit** button directly on the file.

If you add new methods, please ensure the JSDoc comments are clear and follow the existing pattern, as these help users with IntelliSense in their editors.

## Credits

### Contributors

Thank you to all the people who contribute to making AMQP-Suite better!

<a href="https://github.com/iamcarlosdaniel/amqp-suite/graphs/contributors">
<img src="https://contrib.rocks/image?repo=iamcarlosdaniel/amqp-suite" alt="Contributors" />
</a>
