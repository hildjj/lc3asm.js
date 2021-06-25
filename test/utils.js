"use strict";

const Assembler = require("../src/asm");
const { Transform } = require("stream");

class Sink extends Transform {
  _transform(chunk, enc, cb) {
    this.push(chunk);
    cb();
  }
}

function asm(code, file = "test") {
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

function symbols(code, file = "test") {
  const a = new Assembler(`
.orig x3000
${code}
.end`, file);
  const s = new Sink();
  a.symbols(s);
  s.end();
  return s.read().toString();
}

module.exports = {
  Sink,
  asm,
  symbols,
};
