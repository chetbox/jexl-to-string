# `jexl-to-string`

Convert a [Jexl](https://github.com/TomFrost/Jexl) Abstract Syntax Tree (AST) back to a string expression.

## Installation

NPM:

```shell
npm install --save jexl-to-string
```

Yarn:

```shell
yarn add jexl-to-string
```

## Example

```ts
import { jexlExpressionStringFromAst } from "jexl-to-string";
import { Jexl } from "jexl";

const jexl = new Jexl();
const compiledExpression = jexl.compile(input);
const newExpression = jexlExpressionStringFromAst(
  jexl._grammar,
  compiledExpression._getAst()
);
```
