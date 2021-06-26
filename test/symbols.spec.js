import { describe, expect, it } from "@jest/globals";
import { symbols } from "./utils.js";

describe("symbols", () => {
  it("generates short", () => {
    expect(symbols(`
LOOP
BR LOOP`)).toBe(`\
// Symbol table
// Scope level 0:
//\tSymbol Name  Page Address
//\t-----------  ------------
//\tLOOP         3000

`);
  });

  it("generates long", () => {
    expect(symbols(`
LONGER_SYMBOL_NAME
BR LONGER_SYMBOL_NAME`)).toBe(`\
// Symbol table
// Scope level 0:
//\tSymbol Name         Page Address
//\t------------------  ------------
//\tLONGER_SYMBOL_NAME  3000

`);
  });

  it("detects dups", () => {
    expect(() => { symbols("LOOP\nLOOP:\n"); }).toThrow();
  });
});
