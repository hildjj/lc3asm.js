import { parse } from "./lc3.js";

const snLen = "Symbol Name".length;

function chop(n, bits) {
  const max = (1 << (bits - 1)) - 1;
  if (n >= 0) {
    if (n > max) {
      throw new RangeError(`Invalid direct number ${n} > ${max}`);
    }
    return n & max;
  }
  const min = -1 << (bits - 1);
  if (n < min) {
    throw new RangeError(`Invalid direct number ${n} < ${min}`);
  }
  return (n & max) | (max + 1);
}

function word(dv, byteOffset, opcode, ...others) {
  let code = opcode << 12;
  for (const o of others) {
    code |= o;
  }
  if ((code < 0) || (code > 0xffff)) {
    throw new RangeError(`${code} is out of range. It must be >= 0 and <= 65535.`);
  }
  dv.setUint16(byteOffset, code);
}

export default class Assembler {
  constructor(src, filename) {
    this.src = src;
    this.filename = filename;
    this.ast = parse(src, { grammarSource: filename });
  }

  symbols() {
    const maxSym = Object
      .keys(this.ast.symbols)
      .reduce((t, v) => Math.max(t, v.length), snLen);

    let res = (`\
// Symbol table
// Scope level 0:
//\tSymbol Name${" ".repeat(maxSym - snLen)}  Page Address
//\t${"-".repeat(maxSym)}  ------------
`);
    for (const [k, v] of Object.entries(this.ast.symbols)) {
      const hex = v.toString(16).toUpperCase().padStart(4, "0");
      res += `//\t${k}${" ".repeat(maxSym - k.length)}  ${hex}\n`;
    }
    res += "\n";
    return res;
  }

  labelOffset(i, bits = 9) {
    const pos = this.ast.symbols[i.label];
    if (pos === undefined) {
      throw new Error(`Unknown symbol "${i.label}"`);
    }
    return chop(pos - i.pc - 1, bits);
  }

  object() {
    const byteSize = (this.ast.end - this.ast.orig + 1) * 2;
    const buf = new ArrayBuffer(byteSize);
    const dv = new DataView(buf);

    word(dv, 0, 0, this.ast.orig);
    for (const i of this.ast.instructions) {
      if (!this[i.op]) {
        throw new Error(`Unknown opcode "${i.op}":`, i);
      }
      this[i.op](dv, (i.pc - this.ast.orig + 1) * 2, i);
    }
    return new Uint8Array(buf, 0, byteSize);
  }

  ADD(dv, loc, i) {
    const code = ("direct" in i)
      ? (1 << 5) | chop(i.direct, 5)
      : i.sr2;
    word(dv, loc, 0b0001, i.dr << 9, i.sr1 << 6, code);
  }

  AND(dv, loc, i) {
    const code = ("direct" in i)
      ? (1 << 5) | chop(i.direct, 5)
      : i.sr2;
    word(dv, loc, 0b0101, i.dr << 9, i.sr1 << 6, code);
  }

  BLKW() {
    // No-op, region already set to 0
  }

  BR(dv, loc, i) {
    word(dv, loc, 0b0000, i.nzp << 9, this.labelOffset(i));
  }

  FILL(dv, loc, i) {
    if (typeof i.fill === "number") {
      // Odd behavior, but if positive, unsigned.  If negative, signed.
      word(dv, loc, 0, (i.fill >= 0) ? i.fill : chop(i.fill, 16));
    } else {
      word(dv, loc, 0, this.ast.symbols[i.fill].pc);
    }
  }

  JMP(dv, loc, i) {
    word(dv, loc, 0b1100, i.br << 6);
  }

  JSR(dv, loc, i) {
    word(dv, loc, 0b0100, 1 << 11, this.labelOffset(i, 11));
  }

  JSRR(dv, loc, i) {
    word(dv, loc, 0b0100, i.br << 6);
  }

  LABEL() {
    // No-op
  }

  LD(dv, loc, i) {
    word(dv, loc, 0b0010, i.dr << 9, this.labelOffset(i));
  }

  LDI(dv, loc, i) {
    word(dv, loc, 0b1010, i.dr << 9, this.labelOffset(i));
  }

  LDR(dv, loc, i) {
    word(dv, loc, 0b0110, i.dr << 9, i.br << 6, chop(i.direct, 6));
  }

  LEA(dv, loc, i) {
    word(dv, loc, 0b1110, i.dr << 9, this.labelOffset(i));
  }

  NOT(dv, loc, i) {
    word(dv, loc, 0b1001, i.dr << 9, i.sr << 6, 0x3f);
  }

  RTI(dv, loc) {
    word(dv, loc, 0b1000);
  }

  ST(dv, loc, i) {
    word(dv, loc, 0b0011, i.sr << 9, this.labelOffset(i));
  }

  STI(dv, loc, i) {
    word(dv, loc, 0b1011, i.sr << 9, this.labelOffset(i));
  }

  STR(dv, loc, i) {
    word(dv, loc, 0b0111, i.sr << 9, i.br << 6, chop(i.direct, 6));
  }

  STRINGZ(dv, loc, i) {
    let size = 0;
    for (let c = 0; c < i.string.length; c++) {
      dv.setUint16(loc + size, i.string.charCodeAt(c));
      size += 2;
    }
    // Next word will be skipped and left zero
  }

  TRAP(dv, loc, i) {
    word(dv, loc, 0b1111, chop(i.direct, 8));
  }
}
