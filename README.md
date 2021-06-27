# lc3asm.js

An assembler for Little Computer 3 ([LC-3](https://en.wikipedia.org/wiki/Little_Computer_3)).

## Installation

```sh
$ npm install lc3asm.js
```

## Running

```sh
$ lc3asm <inputfile>.asm
```

This will generate `inputfile.obj` and `inputfile.sym` with the resulting object code and symbols respectively.

## API

```js
import Assembler from "lc3asm";

const asm = new Assembler(`
.orig 0
.fill 0
.end`, "filename"); // May throw a Peggy syntax error

asm.symbols(); // Returns a string
asm.object(); // Returns a Uint8Array
```

Syntax errors have a `format()` function that will generate nice output:

```js
catch (e) {
  if (typeof e.format === "function") {
    console.error(e.format([{
      source, // must match what was passed to the Assembler constructor
      text,   // The text associated with that file
    }]));
```

[![Node.js CI](https://github.com/hildjj/lc3asm.js/actions/workflows/node.js.yml/badge.svg)](https://github.com/hildjj/lc3asm.js/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/hildjj/lc3asm.js/branch/main/graph/badge.svg?token=684YVFGCPI)](https://codecov.io/gh/hildjj/lc3asm.js)
