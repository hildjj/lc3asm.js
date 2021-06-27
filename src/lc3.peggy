{{
/**
 * @typedef Instruction - A single instruction or pseudo-operation
 * @type {object}
 * @property {string} op - The name of the operation.  Uppercase, leading
 *   periond removed for pseudo-ops.
 * @property {number} pc - The program counter where this op goes
 * @property {number} [size = 1] - The size in words that this op takes up
 * @property {string} [_] - The label for this op, if it exists
 * @property {number|string} [fill] - If the op is `FILL`, the number or label name.
 *   If a number, can be signed or unsigned.
 * @property {string} [string] - If the op is `STRINGZ` the string (no null added).
 * @property {number} [br] - Base register
 * @property {number} [dr] - Destination register
 * @property {number} [sr] - Source register
 * @property {number} [sr1] - First source register
 * @property {number} [sr2] - Second source register
 * @property {number} [direct] - A direct value, signed
 * @property {number} [nzp] - If the op is `BR`, a three-bit number for the nzp flags
 * @property {string} [label] - An operand label name
 */

/**
 * @typedef AST
 * @type {object}
 * @property {number} [orig] - The origin offset to prefix onto generated code
 * @property {Object.<String,number>} [symbols] - A mapping from symbol names to their
 *   program counter offsets, measured in 16-bit words.
 * @property {number} [end] - The ending program counter offset, measured in
 *   16-bit words.
 * @property {Instruction[]} [instructions] - The instructions that were parsed.
 */

// @ts-nocheck
const opcodes = [
  "ADD", "AND",
  "BR", "BRN", "BRZ", "BRP", "BRNZ", "BRNP", "BRZP", "BRNZP",
  "JMP", "JSR", "JSRR",  "RET", "RTI",
  "LD", "LDI", "LDR",
  "LEA",
  "NOT",
  "ST", "STI", "STR",
  "TRAP",
];

const traps = [
  "GETC",
  "OUT",
  "PUTS",
  "IN",
  "PUTSP",
  "HALT",
];

const memops = [
  ".BLKW",
  ".FILL",
  ".STRINGZ",
]

const REGISTER = /^[rR][0-7]$/;

function validID(id) {
  const up = id.toUpperCase();
  return !opcodes.includes(up) &&
    !traps.includes(up) &&
    !memops.includes(up) &&
    !REGISTER.test(id);
}
}}
{
let orig = null;
let counter = null;
const symbols = {};
}

file = commentline* orig lines:line* end commentline* {
  /** @type AST */
  const res = {orig, symbols, end: counter, instructions:lines.filter(x => x)};
  return res;
}

line
  = commentline
  / label_instruction

commentline
  = comment eol? { return }
  / _ eol { return }

orig = _ ".ORIG"i sp d:direct eol { counter = orig = d; }

label_instruction
  = _ label:prelabel? i:instruction? comment? eol {
    const pc = counter;
    if (i) {
      counter += i.size || 1;
    } else {
      i = { op: "LABEL" }
    }
    i.pc = pc;

    if (label) {
      if  (symbols[label] !== undefined) {
        error(`Label "${label}" redifined`);
      }
      symbols[label] = pc;
      i._ = label;
    }

    return i;
  }

instruction
  = memop
  / op
  / trap

memop
  = BLKW
  / FILL
  / STRINGZ

BLKW = ".BLKW"i sp n:DIGIT+ { return {
  op: "BLKW", size: parseInt(n, 10)
}}

FILL = ".FILL"i sp fill:(direct / labelref) { return {
  op: "FILL", fill
}; }

STRINGZ = ".STRINGZ"i sp string:string { return {
  op:"STRINGZ", string, size: string.length + 1
}}

op
  = ADD
  / AND
  / BR
  / JMP
  / JSRR // order matters
  / JSR
  / LDI  // order matters
  / LDR  // order matters
  / LD
  / LEA
  / NOT
  / RET
  / RTI
  / STI  // order matters
  / STR  // order matters
  / ST
  / TRAP

ADD = "ADD"i sp dr:register c sr1:register c rd:regdirect { return {
  op: "ADD", dr, sr1, ...rd
}}

AND ="AND"i sp dr:register c sr1:register c rd:regdirect { return {
  op: "AND", dr, sr1, ...rd
}}

BR = "BR"i nzp:nzp? sp label:labelref { return {
  op: "BR", nzp: nzp || 7, label
}}

nzp
  = "nzp" { return 7 }
  / "nz"  { return 6 }
  / "np"  { return 5 }
  / "n"   { return 4 }
  / "zp"  { return 3 }
  / "z"   { return 2 }
  / "p"   { return 1 }

JMP = "JMP"i sp br:register { return {
  op: "JMP", br
}}

JSRR = "JSRR"i sp br:register  { return {
  op: "JSRR", br
}}

JSR = "JSR"i sp label:labelref { return {
  op: "JSR", label
}}

LDI = "LDI"i sp dr:register c label:labelref { return {
  op: "LDI", dr, label
}}

LDR = "LDR"i sp dr:register c br:register c direct:direct { return {
  op: "LDR", dr, br, direct
}}

LD = "LD"i sp dr:register c label:labelref { return {
  op: "LD", dr, label
}}

LEA = "LEA"i sp dr:register c label:labelref { return {
  op: "LEA", dr, label
}}

NOT = "NOT"i sp dr:register c sr:register { return {
  op: "NOT", dr, sr
}}

RET = "RET"i { return {
  op: "JMP", br: 7
}}

RTI = "RTI"i { return {
  op: "RTI"
}}

STI = "STI"i sp sr:register c label:labelref { return {
  op: "STI", sr, label
}}

STR = "STR"i sp sr:register c br:register c direct:direct { return {
  op: "STR", sr, br, direct
}}

ST = "ST"i sp sr:register c label:labelref { return {
  op: "ST", sr, label
}}

TRAP = "TRAP"i sp direct:direct { return {
  op: "TRAP", direct
}}

regdirect
  = sr2:register { return {sr2} }
  / direct:direct { return {direct} }

register
  = "R"i r:[0-7] { return parseInt(r, 10) }

trap
  = "GETC"i  { return { op: "TRAP", direct: 0x20 } }
  / "OUT"i   { return { op: "TRAP", direct: 0x21 } }
  / "PUTSP"i { return { op: "TRAP", direct: 0x24 } } // Order matters
  / "PUTS"i  { return { op: "TRAP", direct: 0x22 } }
  / "IN"i    { return { op: "TRAP", direct: 0x23 } }
  / "HALT"i  { return { op: "TRAP", direct: 0x25 } }

prelabel
  = @lab:$[^: \t\n]+ _ ":" _ !{ return REGISTER.test(lab) }
  / @label _

label = @lab:$[a-z0-9_]i+ &{ return validID(lab) }
labelref = @lab:$[a-z0-9_]i+ !{ return REGISTER.test(lab) }

end = _ ".END"i _ eol? { return {end: true} }

comment = _ ";" @$[^\n]*

string "string"
  = quotation_mark chars:char* quotation_mark { return chars.join(""); }

char
  = unescaped
  / escape
    sequence:(
        '"'
      / "\\"
      / "/"
      / "b" { return "\b"; }
      / "f" { return "\f"; }
      / "n" { return "\n"; }
      / "r" { return "\r"; }
      / "t" { return "\t"; }
      / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
          return String.fromCharCode(parseInt(digits, 16));
        }
    )
    { return sequence; }

escape
  = "\\"

quotation_mark
  = '"'

unescaped
  = [^\0-\x1F\x22\x5C]

direct
  = hex
  / dec
  / bin

hex = "x" n:$(sign? HEXDIG+) { return parseInt(n, 16) }
dec = "#"? n:$(sign? DIGIT+) { return parseInt(n, 10) }
bin = "b" n:$(sign? [01]+) { return parseInt(n, 2) }

HEXDIG = [0-9a-f]i
DIGIT = [0-9]

sign = $[-+]

c "comma" = _ "," _ { return }
_ = [ \t]* { return }
sp = [ \t]+ { return }
eol "newline" = "\n" { return }
