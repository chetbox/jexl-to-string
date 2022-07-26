import JexlAst from "jexl/Ast";
import JexlGrammar from "jexl/Grammar";

export function escapeKeyOfExpressionIdentifier(
  identifier: string,
  ...keys: string[]
): string {
  if (keys.length === 0) {
    return identifier;
  }
  const key = keys[0];
  return escapeKeyOfExpressionIdentifier(
    key.match(/^[A-Za-z_]\w*$/)
      ? `${identifier}.${key}`
      : `${identifier}["${key.replace(/"/g, '\\"')}"]`,
    ...keys.slice(1)
  );
}

export function jexlExpressionStringFromAst(
  grammar: JexlGrammar,
  ast: JexlAst | null,
  depth = 0
): string {
  if (!ast) {
    return "";
  }

  const recur = (ast: JexlAst) =>
    jexlExpressionStringFromAst(grammar, ast, depth + 1);

  switch (ast.type) {
    case "Literal":
      return JSON.stringify(ast.value);
    case "Identifier":
      // TODO: if identifierAst can generate FilterExpressions when required then can we ditch `escapeKeyOfExpressionIdentifier`?
      if (ast.from) {
        return `${recur(ast.from)}${escapeKeyOfExpressionIdentifier(
          "",
          ast.value
        )}`;
      } else {
        return escapeKeyOfExpressionIdentifier(ast.value);
      }
    case "UnaryExpression":
      return `${ast.operator}${recur(ast.right)}`;
    case "BinaryExpression": {
      const element = grammar.elements[ast.operator];
      const precedence =
        element.type === "binaryOp" ? element.precedence : Infinity;

      const leftBinaryExpressionElement =
        ast.left.type === "BinaryExpression"
          ? grammar.elements[ast.left.operator]
          : null;
      const leftPrecedence =
        leftBinaryExpressionElement?.type === "binaryOp"
          ? leftBinaryExpressionElement.precedence
          : Infinity;
      let left = recur(ast.left);
      if (precedence > leftPrecedence) {
        left = `(${left})`;
      }

      const rightBinaryExpressionElement =
        ast.right.type === "BinaryExpression"
          ? grammar.elements[ast.right.operator]
          : null;
      const rightPrecedence =
        rightBinaryExpressionElement?.type === "binaryOp"
          ? rightBinaryExpressionElement.precedence
          : Infinity;
      let right = recur(ast.right);
      if (precedence >= rightPrecedence) {
        right = `(${right})`;
      }

      return `${left} ${ast.operator} ${right}`;
    }
    case "ConditionalExpression": {
      const expressionString = `${recur(ast.test)} ? ${recur(
        ast.consequent
      )} : ${recur(ast.alternate)}`;
      return depth > 0 ? `(${expressionString})` : expressionString;
    }
    case "ArrayLiteral":
      return `[${ast.value.map(recur).join(", ")}]`;
    case "ObjectLiteral":
      return `{ ${Object.entries(ast.value)
        .map(([key, value]) => `${key}: ${recur(value)}`)
        .join(", ")} }`;
    case "FilterExpression":
      return `${recur(ast.subject)}[${ast.relative ? "." : ""}${recur(
        ast.expr
      )}]`;
    case "FunctionCall":
      switch (ast.pool) {
        case "functions":
          return `${ast.name}(${ast.args.map(recur).join(", ")})`;
        case "transforms":
          // Note that transforms always have at least one argument
          // i.e. `a | b` is `b` with one argument of `a`
          return `${recur(ast.args[0])} | ${ast.name}${
            ast.args.length > 1
              ? `(${ast.args.slice(1).map(recur).join(", ")})`
              : ""
          }`;
      }
  }
}
