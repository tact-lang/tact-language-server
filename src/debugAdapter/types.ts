import {DebugProtocol} from "@vscode/debugprotocol"

export type Loc = {
    file: string
    line: number
}

export type StackElement =
    | {type: "Null"}
    | {type: "Integer"; value: string}
    | {type: "Cell"; boc: string}
    | {
          type: "Slice"
          boc: string
          startBit: number
          endBit: number
          startRef: number
          endRef: number
      }
    | {type: "Builder"; boc: string}
    | {type: "Continuation"; boc: string}
    | {type: "Address"; value: string}
    | {type: "Tuple"; elements: StackElement[]}
    | {type: "Unknown"; value: string}

export type Step = {
    loc: Loc | undefined
    instructionName: string
    stack: StackElement[]
    gas?: number
}

export type TraceInfo = {
    steps: Step[]
}

/**
 * Interface for launch configuration arguments.
 */
export interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
    /** Path to the compiled .tasm file. */
    tasmPath: string
    /** Path to the trace info JSON file. */
    tracePath: string
    /** Enable logging of the Debug Adapter Protocol. */
    trace?: boolean
    /** Automatically stop target after launch. If not specified, target does not stop. */
    stopOnEntry?: boolean
    /** If VS Code should stop debugging after launch, or immediately continue. */
    noDebug?: boolean
}
