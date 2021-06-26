import Assembler from "../src/asm.js";
import { Transform } from "stream";

export class Sink extends Transform {
  _transform(chunk, enc, cb) {
    this.push(chunk);
    cb();
  }
}

export function asm(code, file = "test") {
  const a = new Assembler(`
.orig #0
${code}
.end`, file);
  const s = new Sink();
  a.object(s);
  s.end();
  s.read(2); // The .orig bytes
  return s.read().toString("hex");
}

export function symbols(code, file = "test") {
  const a = new Assembler(`
.orig x3000
${code}
.end`, file);
  const s = new Sink();
  a.symbols(s);
  s.end();
  return s.read().toString();
}
