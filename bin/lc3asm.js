#!/usr/bin/env node

import Assembler from "../src/asm.js";
import fs from "fs";
import path from "path";

const f = process.argv[2];
if (!f) {
  console.error(`Usage: ${process.argv[1]} <file>`);
  process.exit(64);
}

const src = fs.readFileSync(f, "utf8");

try {
  const asm = new Assembler(src, f);

  const out = path.parse(path.resolve(process.cwd(), f));
  delete out.base;

  out.ext = ".sym";
  const syms = fs.createWriteStream(path.format(out));
  asm.symbols(syms);
  syms.close();

  out.ext = ".obj";
  const obj = fs.createWriteStream(path.format(out));
  asm.object(obj);
  obj.close();
} catch (e) {
  if (e.format) {
    console.error(e.format([{
      source: f,
      text: src,
    }]));
    process.exit(1);
  } else {
    throw e;
  }
}
