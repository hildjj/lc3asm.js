{
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

let orig = null;
let counter = null;
const symbols = {};
}

file = commentline* orig lines:line* end commentline* {
  return {orig, symbols, instructions:lines.filter(x => x)}
}

line
  = commentline
  / label_instruction

commentline
  = comment eol { return }
  / _ eol { return }

orig = _ ".ORIG"i sp d:direct eol { counter = orig = d; }

label_instruction
  = _ label:prelabel? i:instruction? comment? eol {
    const offset = counter;
    if (i) {
      counter += i.size || 1;
    } else {
      i = { op: "LABEL" }
    }
    i.offset = offset;

    if (label) {
      if  (symbols[label] !== undefined) {
        error(`Label "${label}" redifined`);
      }
      symbols[label] = i.offset;
      i._ = label;
    }

    return i;
  }

instruction
  = direct:trap { return { op: "TRAP", direct }; }
  / op
  / ".BLKW"i sp n:DIGIT+ { return {
    op: "BLKW", size: parseInt(n, 10)
  }}
  / ".FILL"i sp fill:(direct / labelref) { return {
    op: "FILL", fill
  }; }
  / ".STRINGZ"i sp string:string { return {
    op:"STRINGZ", string, size: string.length + 1
  }}

op
  = "ADD"i sp dr:register c sr1:register c rd:regdirect { return {
    op: "ADD", dr, sr1, ...rd
  }}
  / "AND"i sp dr:register c sr1:register c rd:regdirect { return {
    op: "AND", dr, sr1, ...rd
  }}
  / "BR"i nzp:nzp? sp label:labelref { return {
    op: "BR", nzp: nzp || 7, label
  }}
  / "JMP"i sp br:register { return {
    op: "JMP", br
  }}
  / "JSRR"i sp br:register  { return {
    op: "JSRR", br
  }}
  / "JSR"i sp label:labelref { return {
    op: "JSR", label
  }}
  / "LDI"i sp dr:register c label:labelref { return {
    op: "LDI", dr, label
  }}
  / "LDR"i sp dr:register c br:register c direct:direct { return {
    op: "LDR", dr, br, direct
  }}
  / "LD"i sp dr:register c label:labelref { return {
    op: "LD", dr, label
  }}
  / "LEA"i sp dr:register c label:labelref { return {
    op: "LEA", dr, label
  }}
  / "NOT"i sp dr:register c sr:register { return {
    op: "NOT", dr, sr
  }}
  / "RET"i { return {
    op: "JMP", br: 7
  }}
  / "RTI"i { return {
    op: "RTI"
  }}
  / "STI"i sp sr:register c label:labelref { return {
    op: "STI", sr, label
  }}
  / "STR"i sp sr:register c br:register c direct:direct { return {
    op: "STR", sr, br, direct
  }}
  / "ST"i sp sr:register c label:labelref { return {
    op: "ST", sr, label
  }}
  / "TRAP"i sp direct:direct { return {
    op: "TRAP", direct
  }}

nzp
  = "nzp" { return 7 }
  / "nz"  { return 6 }
  / "np"  { return 5 }
  / "n"   { return 4 }
  / "zp"  { return 3 }
  / "z"   { return 2 }
  / "p"   { return 1 }

regdirect
  = sr2:register { return {sr2} }
  / direct:direct { return {direct} }

register
  = "R"i r:[0-7] { return parseInt(r, 10) }

trap
  = "GETC"i  { return 0x20 }
  / "OUT"i   { return 0x21 }
  / "PUTSP"i { return 0x24 } // Order matters
  / "PUTS"i  { return 0x22 }
  / "IN"i    { return 0x23 }
  / "HALT"i  { return 0x25 }

prelabel
  = @lab:$[^: \t\n]+ _ ":" _ !{ REGISTER.test(lab) }
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
dec = "#" n:$(sign? DIGIT+) { return parseInt(n, 10) }
bin = "b" n:$(sign? [01]+) { return parseInt(n, 2) }

HEXDIG = [0-9a-f]i
DIGIT = [0-9]

sign = $[-+]

c = _ "," _ { return }
_ = [ \t]* { return }
sp = [ \t]+ { return }
eol = "\n" { return }
