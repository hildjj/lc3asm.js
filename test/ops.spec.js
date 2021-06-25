"use strict";

const Assembler = require("../src/asm");
const { asm, Sink } = require("./utils");

describe("parses", () => {
  it("errors", () => {
    expect(() => asm("ADD R0")).toThrow();
  });
});

describe("opcodes", () => {
  it("ADD", () => {
    expect(asm("ADD R0, R1, R2")).toBe("1042");
    expect(asm("ADD R0, R1, x1")).toBe("1061");
    expect(asm("ADD R0, R1, #-1")).toBe("107f");
    expect(() => asm("ADD R0, R1, #16")).toThrow("16 > 15");
    expect(() => asm("ADD R0, R1, #-17")).toThrow("-17 < -16");
  });
  it("AND", () => {
    expect(asm("AND R0, R1, R2")).toBe("5042");
    expect(asm("AND R0, R1, #1")).toBe("5061");
    expect(asm("AND R0, R1, x-1")).toBe("507f");
  });
  it(".BLKW", () => {
    expect(asm(".BLKW 3")).toBe("000000000000");
    expect(() => asm(".BLKW -1")).toThrow();
  });
  it("BR", () => {
    expect(asm("LOOP BR LOOP")).toBe("0fff");
    expect(() => asm("BR foo")).toThrow();
  });
  it("LD", () => {
    expect(asm("BEFORE: LD R0, BEFORE")).toBe("21ff");
    expect(asm("LD R0, AFTER\nAFTER")).toBe("2000");
  });
  it("ST", () => {
    expect(asm("BEFORE: ST R0, BEFORE")).toBe("31ff");
    expect(asm("ST R0, AFTER\nAFTER")).toBe("3000");
  });
  it("STRINGZ", () => {
    // Note: lc3as only writes one zero byte after the string,
    // which seems like a bug since it mis-aligns everything that follows.
    expect(asm('.STRINGZ "foo"')).toBe("66006f006f000000");
    expect(asm('.STRINGZ ""')).toBe("0000");
    expect(asm('.STRINGZ "\\""')).toBe("22000000");
    expect(asm('.STRINGZ "\\\\"')).toBe("5c000000");
    expect(asm('.STRINGZ "\\/"')).toBe("2f000000");
    expect(asm('.STRINGZ "\\b\\f\\n\\r\\t"')).toBe("08000c000a000d0009000000");
    expect(asm('.STRINGZ "\\u1234"')).toBe("34120000");
  });
  it("TRAP", () => {
    expect(asm("TRAP x23")).toBe("f023");
    expect(asm("GETC")).toBe("f020");
    expect(asm("OUT")).toBe("f021");
    expect(asm("PUTS")).toBe("f022");
    expect(asm("IN")).toBe("f023");
    expect(asm("PUTSP")).toBe("f024");
    expect(asm("HALT")).toBe("f025");
  });
  it("unknown", () => {
    const a = new Assembler(`
.orig #0
.end`, "test");
    a.ast.instructions.push({
      op: "__INVALID_OPERATION__",
    });
    expect(() => a.object(new Sink())).toThrow("__INVALID_OPERATION__");
  });
});
