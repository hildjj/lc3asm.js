"use strict";

const { parse } = require("./lc3");

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

class Assembler {
  constructor(src, filename) {
    this.src = src;
    this.filename = filename;
    this.ast = parse(src, { grammarSource: filename });
  }

  symbols(stream) {
    const maxSym = Object
      .keys(this.ast.symbols)
      .reduce((t, v) => Math.max(t, v.length), snLen);

    stream.write(`\
// Symbol table
// Scope level 0:
//\tSymbol Name${" ".repeat(maxSym - snLen)}  Page Address
//\t${"-".repeat(maxSym)}  ------------
`);
    for (const [k, v] of Object.entries(this.ast.symbols)) {
      const hex = v.toString(16).toUpperCase().padStart(4, "0");
      stream.write(`//\t${k}${" ".repeat(maxSym - k.length)}  ${hex}\n`);
    }
    stream.write("\n");
  }

  labelOffset(i, bits = 9) {
    const pos = this.ast.symbols[i.label];
    if (pos === undefined) {
      throw new Error(`Unknown symbol "${i.label}"`);
    }
    return chop(pos - i.pc - 1, bits);
  }

  object(stream) {
    function wordOut(opcode, ...others) {
      const buf = Buffer.alloc(2);
      let code = opcode << 12;
      for (const o of others) {
        code |= o;
      }
      buf.writeUint16BE(code);
      stream.write(buf);
    }

    wordOut(0, this.ast.orig);
    for (const i of this.ast.instructions) {
      switch (i.op) {
        case "ADD": {
          const code = ("direct" in i)
            ? (1 << 5) | chop(i.direct, 5)
            : i.sr2;
          wordOut(0b0001, i.dr << 9, i.sr1 << 6, code);
          break;
        }
        case "AND": {
          const code = ("direct" in i)
            ? (1 << 5) | chop(i.direct, 5)
            : i.sr2;
          wordOut(0b0101, i.dr << 9, i.sr1 << 6, code);
          break;
        }
        case "BLKW":
          stream.write(Buffer.alloc(i.size * 2));
          break;
        case "BR":
          wordOut(0b0000, i.nzp << 9, this.labelOffset(i));
          break;
        case "FILL":
          if (typeof i.fill === "number") {
            // Odd behavior, but if positive, unsigned.  If negative, signed.
            wordOut(0, (i.fill >= 0) ? i.fill : chop(i.fill, 16));
          } else {
            wordOut(0, this.ast.symbols[i.fill].pc);
          }
          break;
        case "JMP":
          wordOut(0b1100, i.br << 6);
          break;
        case "JSR":
          wordOut(0b0100, 1 << 11, this.labelOffset(i, 11));
          break;
        case "JSRR":
          wordOut(0b0100, i.br << 6);
          break;
        case "LABEL":
          // No-op
          break;
        case "LD":
          wordOut(0b0010, i.dr << 9, this.labelOffset(i));
          break;
        case "LDI":
          wordOut(0b1010, i.dr << 9, this.labelOffset(i));
          break;
        case "LDR":
          wordOut(0b0110, i.dr << 9, i.br << 6, chop(i.direct, 6));
          break;
        case "LEA":
          wordOut(0b1110, i.dr << 9, this.labelOffset(i));
          break;
        case "NOT":
          wordOut(0b1001, i.dr << 9, i.sr << 6, 0x3f);
          break;
        case "RTI":
          wordOut(0b1000);
          break;
        case "ST":
          wordOut(0b0011, i.sr << 9, this.labelOffset(i));
          break;
        case "STI":
          wordOut(0b1011, i.sr << 9, this.labelOffset(i));
          break;
        case "STR":
          wordOut(0b0111, i.sr << 9, i.br << 6, chop(i.direct, 6));
          break;
        case "STRINGZ":
          for (let c = 0; c < i.string.length; c++) {
            const code = i.string.charCodeAt(c);
            // Chars are little-endian
            const buf = Buffer.alloc(2);
            buf.writeUint16LE(code);
            stream.write(buf);
          }
          wordOut(0, 0);
          break;
        case "TRAP":
          wordOut(0b1111, chop(i.direct, 8));
          break;
        default:
          throw new Error(`Unknown opcode "${i.op}":`, i);
      }
    }
  }
}

module.exports = Assembler;
