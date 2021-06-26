# lc3asm.js

An assembler for Little Computer 3 ([LC-3](https://en.wikipedia.org/wiki/Little_Computer_3)).

## Installation

```sh
$ npm install lc3asm.js
```

## Running

```sh
$ lc3asm.js <inputfile>.asm
```

This will generate `inputfile.obj` and `inputfile.sym` with the resulting object code and symbols respectively.

## API

```js
import Assembler from "lc3asm";

const asm = new Assembler(`
.orig 0
.fill 0
.end`, "filename");

asm.symbols(stream);
asm.object(stream);
```

[![Node.js CI](https://github.com/hildjj/lc3asm.js/actions/workflows/node.js.yml/badge.svg)](https://github.com/hildjj/lc3asm.js/actions/workflows/node.js.yml)
