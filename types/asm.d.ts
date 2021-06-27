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
    constructor(src: string, filename?: string);
    src: string;
    filename: string;
    /** @type AST */
    ast: AST;
    /**
     * Generate a symbol table
     *
     * @return {string} The symbol table
     */
    symbols(): string;
    /**
     * Calculate the offset from the current program counter for the given label.
     *
     * @param {Instruction} i - The instruction, which contains a label operand.
     * @param {number} [bits=9] - The number of bits for the offset
     * @return {number} - The offset, clamped to the given number of bits.
     * @throws {Error} - Unknown symbol
     * @private
     */
    private labelOffset;
    /**
     * Generate the object bytes for the AST that was parsed in the constructor.
     *
     * @return {Uint8Array} - The created bytes
     * @throws {Error} - Unknown opcode
     */
    object(): Uint8Array;
    /**
     * ADD  DR, SR1, SR2
     * ADD  DR, SR1, imm5
     *
     * @param {DataView} dv - DataView to write to
     * @param {number} loc - Offset to start at in dv, in bytes
     * @param {Instruction} i - The instruction
     */
    ADD(dv: DataView, loc: number, i: Instruction): void;
    /**
     * AND  DR, SR1, SR2
     * AND  DR, SR1, imm5
     *
     * @param {DataView} dv - DataView to write to
     * @param {number} loc - Offset to start at in dv, in bytes
     * @param {Instruction} i - The instruction
     */
    AND(dv: DataView, loc: number, i: Instruction): void;
    /**
     * .BLKW <words>
     */
    BLKW(): void;
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
    BR(dv: DataView, loc: number, i: Instruction): void;
    /**
     * .FILL direct
     * .FILL LABEL
     *
     * @param {DataView} dv - DataView to write to
     * @param {number} loc - Offset to start at in dv, in bytes
     * @param {Instruction} i - The instruction
     */
    FILL(dv: DataView, loc: number, i: Instruction): void;
    /**
     * JMP BaseR
     * RET
     *
     * @param {DataView} dv - DataView to write to
     * @param {number} loc - Offset to start at in dv, in bytes
     * @param {Instruction} i - The instruction
     */
    JMP(dv: DataView, loc: number, i: Instruction): void;
    /**
     * JSR LABEL
     *
     * @param {DataView} dv - DataView to write to
     * @param {number} loc - Offset to start at in dv, in bytes
     * @param {Instruction} i - The instruction
     */
    JSR(dv: DataView, loc: number, i: Instruction): void;
    /**
     * JSR BaseR
     *
     * @param {DataView} dv - DataView to write to
     * @param {number} loc - Offset to start at in dv, in bytes
     * @param {Instruction} i - The instruction
     */
    JSRR(dv: DataView, loc: number, i: Instruction): void;
    /**
     * Label on a line by itself
     */
    LABEL(): void;
    /**
     * LD DR, LABEL
     *
     * @param {DataView} dv - DataView to write to
     * @param {number} loc - Offset to start at in dv, in bytes
     * @param {Instruction} i - The instruction
     */
    LD(dv: DataView, loc: number, i: Instruction): void;
    /**
     * LDI DR, LABEL
     *
     * @param {DataView} dv - DataView to write to
     * @param {number} loc - Offset to start at in dv, in bytes
     * @param {Instruction} i - The instruction
     */
    LDI(dv: DataView, loc: number, i: Instruction): void;
    /**
     * LDR DR, BaseR, offset6
     *
     * @param {DataView} dv - DataView to write to
     * @param {number} loc - Offset to start at in dv, in bytes
     * @param {Instruction} i - The instruction
     */
    LDR(dv: DataView, loc: number, i: Instruction): void;
    /**
     * LDR DR, LABEL
     *
     * @param {DataView} dv - DataView to write to
     * @param {number} loc - Offset to start at in dv, in bytes
     * @param {Instruction} i - The instruction
     */
    LEA(dv: DataView, loc: number, i: Instruction): void;
    /**
     * NOT DR, SR
     *
     * @param {DataView} dv - DataView to write to
     * @param {number} loc - Offset to start at in dv, in bytes
     * @param {Instruction} i - The instruction
     */
    NOT(dv: DataView, loc: number, i: Instruction): void;
    /**
     * RTI
     *
     * @param {DataView} dv - DataView to write to
     * @param {number} loc - Offset to start at in dv, in bytes
     */
    RTI(dv: DataView, loc: number): void;
    /**
     * ST SR, LABEL
     *
     * @param {DataView} dv - DataView to write to
     * @param {number} loc - Offset to start at in dv, in bytes
     * @param {Instruction} i - The instruction
     */
    ST(dv: DataView, loc: number, i: Instruction): void;
    /**
     * STI SR, LABEL
     *
     * @param {DataView} dv - DataView to write to
     * @param {number} loc - Offset to start at in dv, in bytes
     * @param {Instruction} i - The instruction
     */
    STI(dv: DataView, loc: number, i: Instruction): void;
    /**
     * STR SR, BaseR, offset6
     *
     * @param {DataView} dv - DataView to write to
     * @param {number} loc - Offset to start at in dv, in bytes
     * @param {Instruction} i - The instruction
     */
    STR(dv: DataView, loc: number, i: Instruction): void;
    /**
     * .STRINGZ "string"
     *
     * @param {DataView} dv - DataView to write to
     * @param {number} loc - Offset to start at in dv, in bytes
     * @param {Instruction} i - The instruction
     */
    STRINGZ(dv: DataView, loc: number, i: Instruction): void;
    /**
     * TRAP trapvector8
     *
     * @param {DataView} dv - DataView to write to
     * @param {number} loc - Offset to start at in dv, in bytes
     * @param {Instruction} i - The instruction
     */
    TRAP(dv: DataView, loc: number, i: Instruction): void;
}
export type AST = import("./lc3").AST;
export type Instruction = import("./lc3").Instruction;
