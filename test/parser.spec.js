import { describe, expect, it } from "@jest/globals";
import { parse } from "../src/lc3.js";

function errParse(txt, grammarSource, opts = {}) {
  try {
    parse(txt, { grammarSource, ...opts });
  } catch (e) {
    return e;
  }
  throw new Error("Expected parse to fail");
}

describe("parse errors", () => {
  it("fails", () => {
    const source = "test";
    const text = "...";
    const e = errParse(text, source);
    expect(typeof e.format).toBe("function");
    expect(e.format([{ source, text }])).toContain('Error: Expected ".ORIG"');
  });
  it("formats class", () => {
    const source = "test";
    const text = `
.ORIG 0
.STRINGZ "foo`;
    const e = errParse(text, source);
    expect(e.format([{ source, text }])).toContain("string");
  });
  it("rejects invalidstart rules", () => {
    const e = errParse(".orig 0\n.end", "test", { startRule: "orig" });
    expect(e.message).toContain('Can\'t start parsing from rule "orig"');
    const ok = parse(".orig 0\n.end", { startRule: "file" });
    expect(ok).toBeTruthy();
  });
  it("rejects invalid input", () => {
    expect(errParse(".orig")).toBeTruthy();
    expect(errParse(".orig ")).toBeTruthy();
    expect(errParse(".orig 0")).toBeTruthy();
    expect(errParse(".orig b")).toBeTruthy();
    expect(errParse(".orig b2")).toBeTruthy();
    expect(errParse(".orig b-")).toBeTruthy();
    expect(errParse(".orig b-2")).toBeTruthy();

    expect(errParse(".orig 0\n.blkw")).toBeTruthy();

    expect(errParse(".orig 0\n.fill")).toBeTruthy();
    expect(errParse(".orig 0\n.fill 0")).toBeTruthy();
    expect(errParse(".orig 0\n.fill x")).toBeTruthy();
    expect(errParse(".orig 0\n.fill .")).toBeTruthy();

    expect(errParse(".orig 0\n.stringz")).toBeTruthy();

    expect(errParse(".orig 0\nadd")).toBeTruthy();
    expect(errParse(".orig 0\nadd ")).toBeTruthy();
    expect(errParse(".orig 0\nadd R")).toBeTruthy();
    expect(errParse(".orig 0\nadd R2")).toBeTruthy();
    expect(errParse(".orig 0\nadd R2 ")).toBeTruthy();
    expect(errParse(".orig 0\nadd R2,")).toBeTruthy();
    expect(errParse(".orig 0\nadd R2, ")).toBeTruthy();
    expect(errParse(".orig 0\nadd R2, R3")).toBeTruthy();
    expect(errParse(".orig 0\nadd R2, R3,")).toBeTruthy();
    expect(errParse(".orig 0\nadd R2, R3, ")).toBeTruthy();

    expect(errParse(".orig 0\nand")).toBeTruthy();
    expect(errParse(".orig 0\nand ")).toBeTruthy();
    expect(errParse(".orig 0\nand R2")).toBeTruthy();
    expect(errParse(".orig 0\nand R2 ")).toBeTruthy();
    expect(errParse(".orig 0\nand R2,")).toBeTruthy();
    expect(errParse(".orig 0\nand R2, ")).toBeTruthy();
    expect(errParse(".orig 0\nand R2, R3")).toBeTruthy();
    expect(errParse(".orig 0\nand R2, R3,")).toBeTruthy();
    expect(errParse(".orig 0\nand R2, R3, ")).toBeTruthy();

    expect(errParse(".orig 0\nBR")).toBeTruthy();
    expect(errParse(".orig 0\nBR ")).toBeTruthy();
    expect(errParse(".orig 0\nBR .")).toBeTruthy();

    expect(errParse(".orig 0\nJMP")).toBeTruthy();
    expect(errParse(".orig 0\nJMP ")).toBeTruthy();
    expect(errParse(".orig 0\nJMP .")).toBeTruthy();

    expect(errParse(".orig 0\nJSRR")).toBeTruthy();
    expect(errParse(".orig 0\nJSRR ")).toBeTruthy();
    expect(errParse(".orig 0\nJSRR .")).toBeTruthy();

    expect(errParse(".orig 0\nJSR")).toBeTruthy();
    expect(errParse(".orig 0\nJSR ")).toBeTruthy();
    expect(errParse(".orig 0\nJSR .")).toBeTruthy();

    expect(errParse(".orig 0\nLDI")).toBeTruthy();
    expect(errParse(".orig 0\nLDI ")).toBeTruthy();
    expect(errParse(".orig 0\nLDI .")).toBeTruthy();
    expect(errParse(".orig 0\nLDI R1")).toBeTruthy();
    expect(errParse(".orig 0\nLDI R1 ")).toBeTruthy();
    expect(errParse(".orig 0\nLDI R1,")).toBeTruthy();
    expect(errParse(".orig 0\nLDI R1, ")).toBeTruthy();
    expect(errParse(".orig 0\nLDI R1, .")).toBeTruthy();

    expect(errParse(".orig 0\nLDR")).toBeTruthy();
    expect(errParse(".orig 0\nLDR ")).toBeTruthy();
    expect(errParse(".orig 0\nLDR .")).toBeTruthy();
    expect(errParse(".orig 0\nLDR R1")).toBeTruthy();
    expect(errParse(".orig 0\nLDR R1 ")).toBeTruthy();
    expect(errParse(".orig 0\nLDR R1,")).toBeTruthy();
    expect(errParse(".orig 0\nLDR R1, ")).toBeTruthy();
    expect(errParse(".orig 0\nLDR R1, .")).toBeTruthy();
    expect(errParse(".orig 0\nLDR R1, R2")).toBeTruthy();
    expect(errParse(".orig 0\nLDR R1, R2 ")).toBeTruthy();
    expect(errParse(".orig 0\nLDR R1, R2,")).toBeTruthy();
    expect(errParse(".orig 0\nLDR R1, R2, ")).toBeTruthy();
    expect(errParse(".orig 0\nLDR R1, R2, .")).toBeTruthy();

    expect(errParse(".orig 0\nLD")).toBeTruthy();
    expect(errParse(".orig 0\nLD ")).toBeTruthy();
    expect(errParse(".orig 0\nLD .")).toBeTruthy();
    expect(errParse(".orig 0\nLD R1")).toBeTruthy();
    expect(errParse(".orig 0\nLD R1 ")).toBeTruthy();
    expect(errParse(".orig 0\nLD R1,")).toBeTruthy();
    expect(errParse(".orig 0\nLD R1, ")).toBeTruthy();
    expect(errParse(".orig 0\nLD R1, .")).toBeTruthy();

    expect(errParse(".orig 0\nLEA")).toBeTruthy();
    expect(errParse(".orig 0\nLEA ")).toBeTruthy();
    expect(errParse(".orig 0\nLEA .")).toBeTruthy();
    expect(errParse(".orig 0\nLEA R1")).toBeTruthy();
    expect(errParse(".orig 0\nLEA R1 ")).toBeTruthy();
    expect(errParse(".orig 0\nLEA R1,")).toBeTruthy();
    expect(errParse(".orig 0\nLEA R1, ")).toBeTruthy();
    expect(errParse(".orig 0\nLEA R1, .")).toBeTruthy();

    expect(errParse(".orig 0\nNOT")).toBeTruthy();
    expect(errParse(".orig 0\nNOT ")).toBeTruthy();
    expect(errParse(".orig 0\nNOT .")).toBeTruthy();
    expect(errParse(".orig 0\nNOT R1")).toBeTruthy();
    expect(errParse(".orig 0\nNOT R1 ")).toBeTruthy();
    expect(errParse(".orig 0\nNOT R1,")).toBeTruthy();
    expect(errParse(".orig 0\nNOT R1, ")).toBeTruthy();
    expect(errParse(".orig 0\nNOT R1, .")).toBeTruthy();

    expect(errParse(".orig 0\nSTI")).toBeTruthy();
    expect(errParse(".orig 0\nSTI ")).toBeTruthy();
    expect(errParse(".orig 0\nSTI .")).toBeTruthy();
    expect(errParse(".orig 0\nSTI R1")).toBeTruthy();
    expect(errParse(".orig 0\nSTI R1 ")).toBeTruthy();
    expect(errParse(".orig 0\nSTI R1,")).toBeTruthy();
    expect(errParse(".orig 0\nSTI R1, ")).toBeTruthy();
    expect(errParse(".orig 0\nSTI R1, .")).toBeTruthy();

    expect(errParse(".orig 0\nSTR")).toBeTruthy();
    expect(errParse(".orig 0\nSTR ")).toBeTruthy();
    expect(errParse(".orig 0\nSTR .")).toBeTruthy();
    expect(errParse(".orig 0\nSTR R1")).toBeTruthy();
    expect(errParse(".orig 0\nSTR R1 ")).toBeTruthy();
    expect(errParse(".orig 0\nSTR R1,")).toBeTruthy();
    expect(errParse(".orig 0\nSTR R1, ")).toBeTruthy();
    expect(errParse(".orig 0\nSTR R1, .")).toBeTruthy();
    expect(errParse(".orig 0\nSTR R1, R2")).toBeTruthy();
    expect(errParse(".orig 0\nSTR R1, R2 ")).toBeTruthy();
    expect(errParse(".orig 0\nSTR R1, R2,")).toBeTruthy();
    expect(errParse(".orig 0\nSTR R1, R2, ")).toBeTruthy();
    expect(errParse(".orig 0\nSTR R1, R2, .")).toBeTruthy();

    expect(errParse(".orig 0\nST")).toBeTruthy();
    expect(errParse(".orig 0\nST ")).toBeTruthy();
    expect(errParse(".orig 0\nST .")).toBeTruthy();
    expect(errParse(".orig 0\nST R1")).toBeTruthy();
    expect(errParse(".orig 0\nST R1 ")).toBeTruthy();
    expect(errParse(".orig 0\nST R1,")).toBeTruthy();
    expect(errParse(".orig 0\nST R1, ")).toBeTruthy();
    expect(errParse(".orig 0\nST R1, .")).toBeTruthy();

    expect(errParse(".orig 0\nTRAP")).toBeTruthy();
    expect(errParse(".orig 0\nTRAP ")).toBeTruthy();
    expect(errParse(".orig 0\nTRAP .")).toBeTruthy();

    expect(errParse(".orig 0\nR1: RET\n.end")).toBeTruthy();
    expect(errParse(".orig 0\nR1")).toBeTruthy();
    expect(errParse(".orig 0\nBR R1\n.end")).toBeTruthy();
    expect(errParse(";")).toBeTruthy();
    expect(errParse("")).toBeTruthy();
    expect(errParse(".orig 0\n:")).toBeTruthy();

    expect(errParse(".orig 0\n.STRINGZ .")).toBeTruthy();
    expect(errParse('.orig 0\n.STRINGZ "\\s"')).toBeTruthy();
    expect(errParse('.orig 0\n.STRINGZ "\\u"')).toBeTruthy();
    expect(errParse('.orig 0\n.STRINGZ "\\u0"')).toBeTruthy();
    expect(errParse('.orig 0\n.STRINGZ "\\u01"')).toBeTruthy();
    expect(errParse('.orig 0\n.STRINGZ "\\u012"')).toBeTruthy();
  });
});

describe("parse edges", () => {
  it("has edge cases", () => {
    expect(parse(`
.orig  0
.FILL 0 \t ; comment
.end
; end comment
`)).toBeTruthy();

    expect(parse(`
.orig 0
.end
; end comment`)).toBeTruthy();
  });
});
