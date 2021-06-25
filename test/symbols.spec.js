"use strict";
const Assembler = require("../src/asm");
const { Sink } = require("./utils");

describe("symbols", () => {
  it("generates short", () => {
    const a = new Assembler(`
.orig x3000
LOOP
BR LOOP
.end`);
    const s = new Sink();
    a.symbols(s);
    s.end();
    expect(s.read().toString()).toBe(`\
// Symbol table
// Scope level 0:
//\tSymbol Name  Page Address
//\t-----------  ------------
//\tLOOP         3000

`);
  });

  it("generates long", () => {
    const a = new Assembler(`
.orig x3000
LONGER_SYMBOL_NAME
BR LONGER_SYMBOL_NAME
.end`);
    const s = new Sink();
    a.symbols(s);
    s.end();

    // Check alignment
    expect(s.read().toString()).toBe(`\
// Symbol table
// Scope level 0:
//\tSymbol Name         Page Address
//\t------------------  ------------
//\tLONGER_SYMBOL_NAME  3000

`);
  });
});
