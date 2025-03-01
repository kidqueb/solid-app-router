import { createMatcher, joinPaths, resolvePath, createMemoObject } from "../src/utils";

describe("resolvePath should", () => {
  test("normalize the base arg", () => {
    const expected = "/base";
    const actual = resolvePath("base", "");
    expect(actual).toBe(expected);
  });

  test("normalize the path arg", () => {
    const expected = "/path";
    const actual = resolvePath("", "path");
    expect(actual).toBe(expected);
  });

  test("normalize the from arg", () => {
    const expected = "/from";
    const actual = resolvePath("", "", "from");
    expect(actual).toBe(expected);
  });

  test("returns the default path when all ags are empty", () => {
    const expected = "/";
    const actual = resolvePath("", "");
    expect(actual).toBe(expected);
  });

  test("resolve root path against base and ignore from", () => {
    const expected = "/base";
    const actual = resolvePath("/base", "/", "/base/foo");
    expect(actual).toBe(expected);
  });

  test("resolve rooted paths against base and ignore from", () => {
    const expected = "/base/bar";
    const actual = resolvePath("/base", "/bar", "/base/foo");
    expect(actual).toBe(expected);
  });

  test("resolve empty path against from", () => {
    const expected = "/base/foo";
    const actual = resolvePath("/base", "", "/base/foo");
    expect(actual).toBe(expected);
  });

  test("resolve relative paths against from", () => {
    const expected = "/base/foo/bar";
    const actual = resolvePath("/base", "bar", "/base/foo");
    expect(actual).toBe(expected);
  });

  test("prepend base if from does not start with it", () => {
    const expected = "/base/foo/bar";
    const actual = resolvePath("/base", "bar", "/foo");
    expect(actual).toBe(expected);
  });

  test(`test start of from against base case-insensitive`, () => {
    const expected = "/BASE/foo/bar";
    const actual = resolvePath("/base", "bar", "BASE/foo");
    expect(actual).toBe(expected);
  });
});

describe("createMatcher should", () => {
  test("return empty object when location matches simple path", () => {
    const expected = { path: "/foo/bar", params: {} };
    const matcher = createMatcher("/foo/bar");
    const match = matcher("/foo/bar");
    expect(match).not.toBe(null);
    expect(match!.path).toBe(expected.path);
    expect(match!.params).toEqual(expected.params);
  });

  test("return null when location does not match", () => {
    const expected = null;
    const matcher = createMatcher("/foo/bar");
    const match = matcher("/foo/baz");
    expect(match).toEqual(expected);
  });

  test("return params collection when location matches parameterized path", () => {
    const expected = { path: "/foo/abc-123", params: { id: "abc-123" } };
    const matcher = createMatcher("/foo/:id");
    const match = matcher("/foo/abc-123");
    expect(match).not.toBe(null);
    expect(match!.path).toBe(expected.path);
    expect(match!.params).toEqual(expected.params);
  });

  test("match past end when end when ending in a /*", () => {
    const expected = { path: "/foo/bar", params: {} };
    const matcher = createMatcher("/foo/bar/*");
    const match = matcher("/foo/bar/baz");
    expect(match).not.toBe(null);
    expect(match!.path).toBe(expected.path);
    expect(match!.params).toEqual(expected.params);
  });

  test("not match past end when not ending in /*", () => {
    const expected = null;
    const matcher = createMatcher("/foo/bar");
    const match = matcher("/foo/bar/baz");
    expect(match).toBe(expected);
  });

  test("include remaining unmatched location as param when ending in /*param_name", () => {
    const expected = { path: "/foo/bar", params: { something: "baz/qux" } };
    const matcher = createMatcher("/foo/bar/*something");
    const match = matcher("/foo/bar/baz/qux");
    expect(match).not.toBe(null);
    expect(match!.path).toBe(expected.path);
    expect(match!.params).toEqual(expected.params);
  });

  test("include empty param when ending in /*param_name and exact match", () => {
    const expected = { path: "/foo/bar", params: { something: "" } };
    const matcher = createMatcher("/foo/bar/*something");
    const match = matcher("/foo/bar");
    expect(match).not.toBe(null);
    expect(match!.path).toBe(expected.path);
    expect(match!.params).toEqual(expected.params);
  });
});

describe("joinPaths should", () => {
  test.each([
    ["/foo", "bar", "/foo/bar"],
    ["/foo/", "bar", "/foo/bar"],
    ["/foo", "/bar", "/foo/bar"],
    ["/foo/", "/bar", "/foo/bar"]
  ])(`join with a single '/' (case '%s' and '%s' as '%s')`, (from, to, expected) => {
    const joined = joinPaths(from, to);
    expect(joined).toBe(expected);
  });

  test.each([
    ["/foo", "", "/foo"],
    ["foo", "", "/foo"],
    ["", "foo", "/foo"],
    ["", "/foo", "/foo"],
    ["/", "foo", "/foo"],
    ["/", "/foo", "/foo"]
  ])(`ensure leading '/' (case '%s' and '%s' as '%s')`, (from, to, expected) => {
    const joined = joinPaths(from, to);
    expect(joined).toBe(expected);
  });

  test.each([
    ["/foo", "", "/foo"],
    ["/foo/", "/", "/foo"],
    ["/foo/", "bar/", "/foo/bar"]
  ])(`strip trailing '/' (case '%s' and '%s' as '%s')`, (from, to, expected) => {
    const joined = joinPaths(from, to);
    expect(joined).toBe(expected);
  });

  test.each([
    ["foo/*", "", "/foo/*"],
    ["/foo/*all", "", "/foo/*all"],
    ["/foo/*", "bar", "/foo/bar"],
    ["/foo/*all", "bar", "/foo/bar"],
    ["/*", "foo", "/foo"],
    ["/*all", "foo", "/foo"],
    ["*", "foo", "/foo"]
  ])(`strip trailing '/*' (case '%s' and '%s' as '%s')`, (from, to, expected) => {
    const joined = joinPaths(from, to);
    expect(joined).toBe(expected);
  });

  test.each([
    ["/foo/:bar", "", "/foo/:bar"],
    ["/foo/:bar", "baz", "/foo/:bar/baz"],
    ["/foo", ":bar/baz", "/foo/:bar/baz"],
    ["", ":bar/baz", "/:bar/baz"]
  ])(`preserve parameters (case '%s' and '%s' as '%s')`, (from, to, expected) => {
    const joined = joinPaths(from, to);
    expect(joined).toBe(expected);
  });
});

describe("createMemoObject should", () => {
  test("allow listing its own keys", () => {
    const actual = createMemoObject(() => ({
      hello: "world",
      get throws() {
        throw new Error("throws");
      }
    }));
    expect(Object.getOwnPropertyNames(actual)).toEqual(["hello", "throws"]);
  });

  test("allow listing its keys", () => {
    const actual = createMemoObject(() => ({
      hello: "world",
      get throws() {
        throw new Error("throws");
      }
    }));
    expect(Object.keys(actual)).toEqual(["hello", "throws"]);
  });

  test("stringify into JSON", () => {
    const actual = createMemoObject(() => ({
      hello: "world",
      get getter() {
        return "works too";
      }
    }));
    expect(JSON.stringify(actual)).toEqual(
      JSON.stringify({
        hello: "world",
        getter: "works too"
      })
    );
  });
});
