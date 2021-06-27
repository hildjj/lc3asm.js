/**
 * - A single instruction or pseudo-operation
 */
export type Instruction = {
    /**
     * - The name of the operation.  Uppercase, leading
     * periond removed for pseudo-ops.
     */
    op: string;
    /**
     * - The program counter where this op goes
     */
    pc: number;
    /**
     * - The size in words that this op takes up
     */
    size?: number;
    /**
     * - The label for this op, if it exists
     */
    _?: string;
    /**
     * - If the op is `FILL`, the number or label name.
     * If a number, can be signed or unsigned.
     */
    fill?: number | string;
    /**
     * - If the op is `STRINGZ` the string (no null added).
     */
    string?: string;
    /**
     * - Base register
     */
    br?: number;
    /**
     * - Destination register
     */
    dr?: number;
    /**
     * - Source register
     */
    sr?: number;
    /**
     * - First source register
     */
    sr1?: number;
    /**
     * - Second source register
     */
    sr2?: number;
    /**
     * - A direct value, signed
     */
    direct?: number;
    /**
     * - If the op is `BR`, a three-bit number for the nzp flags
     */
    nzp?: number;
    /**
     * - An operand label name
     */
    label?: string;
};
export type AST = {
    /**
     * - The origin offset to prefix onto generated code
     */
    orig?: number;
    /**
     * - A mapping from symbol names to their
     * program counter offsets, measured in 16-bit words.
     */
    symbols?: any;
    /**
     * - The ending program counter offset, measured in
     * 16-bit words.
     */
    end?: number;
    /**
     * - The instructions that were parsed.
     */
    instructions?: Instruction[];
};

declare class peg$SyntaxError {
    constructor(message: string, expected: Expectation[], found: string, location: LocationRange);
    format(sources: SourceText[]): string;
}
declare namespace peg$SyntaxError {
    function buildMessage(expected: Expectation[], found: string): string;
}
declare function peg$parse(input: string, options?: ParserOptions): AST;
export { peg$SyntaxError as SyntaxError, peg$parse as parse };

export type Expectation = import("peggy").parser.Expectation;
export type LocationRange = import("peggy").LocationRange;
export type SourceText = import("peggy").SourceText;
export type ParserOptions = import("peggy").ParserOptions;
