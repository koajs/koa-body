# koa-body Test Info

Running tests:
```sh
npm install
npm test
```

## Coverage
To run coverage, you must be using [c8's supported version](https://github.com/bcoe/c8#supported-nodejs-versions) of Node.js, v10.12.0+.

To get an HTML coverage report, run the following commands:
```sh
npm run coverage:html
```

CI will fail if a line, function, and branch coverage percentage is not met. This is set in `package.json` in the `coverage` script.
