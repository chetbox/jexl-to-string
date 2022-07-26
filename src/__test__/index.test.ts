import { jexlExpressionStringFromAst } from "..";
import { Jexl } from "jexl";

describe("jexlExpressionStringFromAst", () => {
  // Create a Jexl AST from an expression and then convert back to an expression and see if it looks right

  const expressions: [string, string | null][] = [
    ["true", "true"],
    ["'hello world'", '"hello world"'], // We always use double quotes
    ["123.0", "123"],
    ["foo .bar .baz", "foo.bar.baz"],
    ['foo["bar"].baz', null], // Stays as filter syntax
    ["foo  ? bar  : baz", "foo ? bar : baz"],
    ["{ one: a.value, two: b.value }", "{ one: a.value, two: b.value }"], // Keys are not escaped. Keys in quotes give a Jexl syntax error
    ["! foo", "!foo"],
    ["foo.bar   ==   foo.baz", "foo.bar == foo.baz"],
    ['[true,"two",3]', '[true, "two", 3]'],
    ["foo[.bar == 3]", null],
    ["foo[bar == 3]", null],
    ["foo | bar | baz(1, 2)", null],
    ["baz(bar(foo), 1, 2)", null],
    ["1 + (2 * 3)", "1 + 2 * 3"],
    ["(1 + 2) * 3", null],
    ["1 + 2 + 3 - 3 - 2 - 1", null],
    ['1 // 2 * (foo["bar"] - 4) % 6 ^ foo[.bar == 1 * 2 * 3]', null],
    ["a.b[e.f].c[g.h].d", null],
    ["a[c][d].b", null],
    ["(a ? b : c) + (d && (e || f))", null],
    [
      '(z + 0) + " A " + (a + 1) + " B " + (b + 2) + " C " + (c == 0 ? "c1" : "c2")',
      'z + 0 + " A " + (a + 1) + " B " + (b + 2) + " C " + (c == 0 ? "c1" : "c2")',
    ],
  ];

  test.each(expressions)("`%s`", (input, expected) => {
    const jexl = new Jexl();
    const compiledExpression = jexl.compile(input);
    const newExpression = jexlExpressionStringFromAst(
      jexl._grammar,
      compiledExpression._getAst()
    );
    expect(newExpression).toBe(expected ?? input);
    expect(() => jexl.compile(newExpression)).not.toThrow();
  });
});
