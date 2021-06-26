import { Sink, asm } from "./utils.js";
import Assembler from "../src/asm.js";

describe("parses", () => {
  it("errors", () => {
    expect(() => asm("ADD R0")).toThrow();
  });
});

describe("opcodes", () => {
  it("ADD", () => {
    expect(asm("ADD R3, R1, R2")).toBe("1642");
    expect(asm("ADD R3, R1, x1")).toBe("1661");
    expect(asm("ADD R3, R1, #-1")).toBe("167f");
    expect(() => asm("ADD R0, R1, #16")).toThrow("16 > 15");
    expect(() => asm("ADD R0, R1, #-17")).toThrow("-17 < -16");
  });
  it("AND", () => {
    expect(asm("AND R3, R1, R2")).toBe("5642");
    expect(asm("AND R3, R1, #1")).toBe("5661");
    expect(asm("AND R3, R1, x-1")).toBe("567f");
  });
  it(".BLKW", () => {
    expect(asm(".BLKW 3")).toBe("000000000000");
    expect(() => asm(".BLKW -1")).toThrow();
  });
  it("BR", () => {
    expect(asm("LOOP BR LOOP")).toBe("0fff");
    expect(asm("LOOP BRn LOOP")).toBe("09ff");
    expect(asm("LOOP BRz LOOP")).toBe("05ff");
    expect(asm("LOOP BRp LOOP")).toBe("03ff");
    expect(asm("LOOP BRnz LOOP")).toBe("0dff");
    expect(asm("LOOP BRnp LOOP")).toBe("0bff");
    expect(asm("LOOP BRzp LOOP")).toBe("07ff");
    expect(asm("LOOP BRnzp LOOP")).toBe("0fff");
    expect(() => asm("BR foo")).toThrow('Unknown symbol "foo"');
  });
  it(".FILL", () => {
    expect(asm(".FILL -15")).toBe("fff1");
    expect(asm(".FILL 0")).toBe("0000");
    expect(asm(".FILL 65535")).toBe("ffff");
    expect(asm(".FILL #-1")).toBe("ffff");
    expect(asm("START .FILL START")).toBe("0000");
    expect(() => asm(".FILL 65536")).toThrow("<= 65535");
    expect(() => asm(".FILL -32769")).toThrow("< -32768");
  });
  it("JMP", () => {
    expect(asm("JMP R3")).toBe("c0c0");
  });
  it("JSR", () => {
    expect(asm("LOOP JSR LOOP")).toBe("4fff");
    expect(asm("JSRR R6")).toBe("4180");
  });
  it("LD", () => {
    expect(asm("BEFORE: LD R3, BEFORE")).toBe("27ff");
    expect(asm("LD R0, AFTER\nAFTER")).toBe("2000");
  });
  it("LDI", () => {
    expect(asm("BEFORE: LDI R3, BEFORE")).toBe("a7ff");
    expect(asm("LDI R0, AFTER\nAFTER")).toBe("a000");
  });
  it("LDR", () => {
    expect(asm("LDR R4,R2,#-5")).toBe("68bb");
  });
  it("LEA", () => {
    expect(asm("LEA R4, TARGET\nTARGET")).toBe("e800");
  });
  it("NOT", () => {
    expect(asm("NOT R3, R1")).toBe("967f");
  });
  it("RET", () => {
    expect(asm("RET")).toBe("c1c0");
  });
  it("RTI", () => {
    expect(asm("RTI")).toBe("8000");
  });
  it("ST", () => {
    expect(asm("BEFORE: ST R3, BEFORE")).toBe("37ff");
    expect(asm("ST R0, AFTER\nAFTER")).toBe("3000");
  });
  it("STI", () => {
    expect(asm("BEFORE: STI R3, BEFORE")).toBe("b7ff");
    expect(asm("STI R0, AFTER\nAFTER")).toBe("b000");
  });
  it("STR", () => {
    expect(asm("STR R3, R2, b11")).toBe("7683");
    expect(asm("STR R3, R2, #-3")).toBe("76bd");
  });
  it(".STRINGZ", () => {
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
