william-baptista@william-baptista-17ZB90R-K-AAC7U1:~/gestor-AQ/backend$ npm run dev

> anesthesia-consent-backend@1.0.0 dev
> nodemon --exec 'node --loader ts-node/esm src/index.ts'

[nodemon] 3.1.10
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `node --loader ts-node/esm src/index.ts`
(node:29472) ExperimentalWarning: `--experimental-loader` may be removed in the future; instead use `register()`:
--import 'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("ts-node/esm", pathToFileURL("./"));'
(Use `node --trace-warnings ...` to show where the warning was created)
(node:29472) [DEP0180] DeprecationWarning: fs.Stats constructor is deprecated.
(Use `node --trace-deprecation ...` to show where the warning was created)

node:internal/modules/run_main:123
    triggerUncaughtException(
    ^
[Object: null prototype] {
  [Symbol(nodejs.util.inspect.custom)]: [Function: [nodejs.util.inspect.custom]]
}

Node.js v22.17.0
[nodemon] app crashed - waiting for file changes before starting...