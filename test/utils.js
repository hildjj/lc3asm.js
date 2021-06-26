import Assembler from "../src/asm.js";

export function asm(code, file = "test") {
  const a = new Assembler(`
.orig #0
${code}
.end`, file);
  const buf = a.object();
  return Array.prototype.map.call(
    buf.subarray(2),
    b => b.toString(16).padStart(2, "0"),
  ).join("");
}

export function symbols(code, file = "test") {
  const a = new Assembler(`
.orig x3000
${code}
.end`, file);
  return a.symbols();
}
