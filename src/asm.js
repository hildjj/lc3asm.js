import { parse } from "./lc3.js";

const snLen = "Symbol Name".length;

/**
 * @typedef { import("./lc3").AST } AST
 * @typedef { import("./lc3").Instruction } Instruction
 */

/**
 * Chop a signed number to a given number of bits, returning an unsigned 2's
 * complement of negative numbers.
 *
 * @param {number} n - number between -2**(bits-1) and 2**(bits-1)-1, inclusive
 * @param {number} bits - number of bits to clamp to
 * @return {number} Resulting unsigned number that fits in bits
 * @throws {RangeError}
 */
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

/**
 * Output a 16-bit word into a DataView
 *
 * @param {DataView} dv - The DataView to modify
 * @param {number} byteOffset - Offset, in bytes, to write to
 * @param {number} opcode - The four bit opcode for the word.
 *   Use zero if it is not needed.
 * @param {number[]} others - Other numbers to bitwise-or with the opcode before writing.
 * @throws {RangeError}
 */
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

/**
 * Parser and assembler for LC-3 assembly code.
 *
 * @export
 * @class Assembler
 */
export default class Assembler {
  /**
   * Creates an instance of Assembler.
   *
   * @param {string} src - source text
   * @param {string} [filename = ""] - name of the file that source came from
   */
  constructor(src, filename = "") {
    this.src = src;
    this.filename = filename;
    /** @type AST */
    this.ast = parse(src, { grammarSource: filename });
  }

  /**
   * Generate a symbol table
   *
   * @return {string} The symbol table
   */
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

  /**
   * Calculate the offset from the current program counter for the given label.
   *
   * @param {Instruction} i - The instruction, which contains a label operand.
   * @param {number} [bits=9] - The number of bits for the offset
   * @return {number} - The offset, clamped to the given number of bits.
   * @throws {Error} - Unknown symbol
   * @private
   */
  labelOffset(i, bits = 9) {
    const pos = this.ast.symbols[i.label];
    if (pos === undefined) {
      throw new Error(`Unknown symbol "${i.label}"`);
    }
    return chop(pos - i.pc - 1, bits);
  }

  /**
   * Generate the object bytes for the AST that was parsed in the constructor.
   *
   * @return {Uint8Array} - The created bytes
   * @throws {Error} - Unknown opcode
   */
  object() {
    const byteSize = (this.ast.end - this.ast.orig + 1) * 2;
    const buf = new ArrayBuffer(byteSize);
    const dv = new DataView(buf);

    word(dv, 0, 0, this.ast.orig);
    for (const i of this.ast.instructions) {
      if (!this[i.op]) {
        throw new Error(`Unknown opcode "${i.op}"`);
      }
      this[i.op](dv, (i.pc - this.ast.orig + 1) * 2, i);
    }
    return new Uint8Array(buf, 0, byteSize);
  }

  /**
   * ADD  DR, SR1, SR2
   * ADD  DR, SR1, imm5
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   * @param {Instruction} i - The instruction
   */
  ADD(dv, loc, i) {
    const code = ("direct" in i)
      ? (1 << 5) | chop(i.direct, 5)
      : i.sr2;
    word(dv, loc, 0b0001, i.dr << 9, i.sr1 << 6, code);
  }

  /**
   * AND  DR, SR1, SR2
   * AND  DR, SR1, imm5
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   * @param {Instruction} i - The instruction
   */
  AND(dv, loc, i) {
    const code = ("direct" in i)
      ? (1 << 5) | chop(i.direct, 5)
      : i.sr2;
    word(dv, loc, 0b0101, i.dr << 9, i.sr1 << 6, code);
  }

  /**
   * .BLKW <words>
   */
  BLKW() {
    // No-op, region already set to 0
  }

  /**
   * BR    LABEL
   * BRn   LABEL
   * BRz   LABEL
   * BRp   LABEL
   * BRnz  LABEL
   * BRnp  LABEL
   * BRzp  LABEL
   * BRnzp LABEL
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   * @param {Instruction} i - The instruction
   */
  BR(dv, loc, i) {
    word(dv, loc, 0b0000, i.nzp << 9, this.labelOffset(i));
  }

  /**
   * .FILL direct
   * .FILL LABEL
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   * @param {Instruction} i - The instruction
   */
  FILL(dv, loc, i) {
    if (typeof i.fill === "number") {
      // Odd behavior, but if positive, unsigned.  If negative, signed.
      word(dv, loc, 0, (i.fill >= 0) ? i.fill : chop(i.fill, 16));
    } else {
      word(dv, loc, 0, this.ast.symbols[i.fill]);
    }
  }

  /**
   * JMP BaseR
   * RET
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   * @param {Instruction} i - The instruction
   */
  JMP(dv, loc, i) {
    word(dv, loc, 0b1100, i.br << 6);
  }

  /**
   * JSR LABEL
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   * @param {Instruction} i - The instruction
   */
  JSR(dv, loc, i) {
    word(dv, loc, 0b0100, 1 << 11, this.labelOffset(i, 11));
  }

  /**
   * JSR BaseR
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   * @param {Instruction} i - The instruction
   */
  JSRR(dv, loc, i) {
    word(dv, loc, 0b0100, i.br << 6);
  }

  /**
   * Label on a line by itself
   */
  LABEL() {
    // No-op
  }

  /**
   * LD DR, LABEL
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   * @param {Instruction} i - The instruction
   */
  LD(dv, loc, i) {
    word(dv, loc, 0b0010, i.dr << 9, this.labelOffset(i));
  }

  /**
   * LDI DR, LABEL
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   * @param {Instruction} i - The instruction
   */
  LDI(dv, loc, i) {
    word(dv, loc, 0b1010, i.dr << 9, this.labelOffset(i));
  }

  /**
   * LDR DR, BaseR, offset6
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   * @param {Instruction} i - The instruction
   */
  LDR(dv, loc, i) {
    word(dv, loc, 0b0110, i.dr << 9, i.br << 6, chop(i.direct, 6));
  }

  /**
   * LDR DR, LABEL
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   * @param {Instruction} i - The instruction
   */
  LEA(dv, loc, i) {
    word(dv, loc, 0b1110, i.dr << 9, this.labelOffset(i));
  }

  /**
   * NOT DR, SR
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   * @param {Instruction} i - The instruction
   */
  NOT(dv, loc, i) {
    word(dv, loc, 0b1001, i.dr << 9, i.sr << 6, 0x3f);
  }

  /**
   * RTI
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   */
  RTI(dv, loc) {
    word(dv, loc, 0b1000);
  }

  /**
   * ST SR, LABEL
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   * @param {Instruction} i - The instruction
   */
  ST(dv, loc, i) {
    word(dv, loc, 0b0011, i.sr << 9, this.labelOffset(i));
  }

  /**
   * STI SR, LABEL
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   * @param {Instruction} i - The instruction
   */
  STI(dv, loc, i) {
    word(dv, loc, 0b1011, i.sr << 9, this.labelOffset(i));
  }

  /**
   * STR SR, BaseR, offset6
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   * @param {Instruction} i - The instruction
   */
  STR(dv, loc, i) {
    word(dv, loc, 0b0111, i.sr << 9, i.br << 6, chop(i.direct, 6));
  }

  /**
   * .STRINGZ "string"
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   * @param {Instruction} i - The instruction
   */
  STRINGZ(dv, loc, i) {
    let size = 0;
    for (let c = 0; c < i.string.length; c++) {
      dv.setUint16(loc + size, i.string.charCodeAt(c));
      size += 2;
    }
    // Next word will be skipped and left zero
  }

  /**
   * TRAP trapvector8
   *
   * @param {DataView} dv - DataView to write to
   * @param {number} loc - Offset to start at in dv, in bytes
   * @param {Instruction} i - The instruction
   */
  TRAP(dv, loc, i) {
    word(dv, loc, 0b1111, chop(i.direct, 8));
  }
}
