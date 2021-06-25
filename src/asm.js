"use strict";

const { parse } = require("./lc3");

const snLen = "Symbol Name".length;

function chop(n, bits) {
  const max = (1 << (bits - 1)) - 1;
  if (n >= 0) {
    if (n > max) {
      throw new Error(`Invalid direct number ${n} > ${max}`);
    }
    return n & max;
  }
  const min = -1 << (bits - 1);
  if (n < min) {
    throw new Error(`Invalid direct number ${n} < ${min}`);
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
    return chop(pos - i.offset - 1, bits);
  }

  object(stream) {
    function wordOut(word) {
      const buf = Buffer.alloc(2);
      buf.writeUint16BE(word);
      stream.write(buf);
    }

    wordOut(this.ast.orig);
    for (const i of this.ast.instructions) {
      switch (i.op) {
        case "ADD": {
          let code = (0b0001 << 12) | (i.dr << 9) | (i.sr1 << 6);
          if ("direct" in i) {
            code |= (1 << 5) | chop(i.direct, 5);
          } else {
            code |= i.sr2;
          }
          wordOut(code);
          break;
        }
        case "AND": {
          let code = (0b0101 << 12) | (i.dr << 9) | (i.sr1 << 6);
          if ("direct" in i) {
            code |= (1 << 5) | chop(i.direct, 5);
          } else {
            code |= i.sr2;
          }
          wordOut(code);
          break;
        }
        case "BLKW": {
          const buf = Buffer.alloc(i.size * 2);
          stream.write(buf);
          break;
        }
        case "BR": {
          // Opcode 0
          const code = i.nzp << 9 | this.labelOffset(i);
          wordOut(code);
          break;
        }
        case "LABEL":
          // No-op
          break;
        case "LD": {
          const code = (0b0010 << 12) | (i.dr << 9) | this.labelOffset(i);
          wordOut(code);
          break;
        }
        case "ST": {
          const code = (0b0011 << 12) | (i.sr << 9) | this.labelOffset(i);
          wordOut(code);
          break;
        }
        case "STRINGZ": {
          for (let c = 0; c < i.string.length; c++) {
            const code = i.string.charCodeAt(c);
            // Chars are little-endian
            const buf = Buffer.alloc(2);
            buf.writeUint16LE(code);
            stream.write(buf);
          }
          wordOut(0);
          break;
        }
        case "TRAP": {
          const code = (0b1111 << 12) | chop(i.direct, 8);
          wordOut(code);
          break;
        }
        default:
          throw new Error(`Unknown opcode "${i.op}":`, i);
      }
    }
  }
}

module.exports = Assembler;
