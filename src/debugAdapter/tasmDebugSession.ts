import {
    Breakpoint,
    InitializedEvent,
    LoggingDebugSession,
    OutputEvent,
    StoppedEvent,
    Thread,
    StackFrame,
    Scope,
    TerminatedEvent,
    Source,
} from "@vscode/debugadapter"
import {DebugProtocol} from "@vscode/debugprotocol"
import * as fs from "fs/promises"
import * as path from "path"
import {LaunchRequestArguments, TraceInfo, StackElement} from "./types"

export class TasmDebugSession extends LoggingDebugSession {
    private static THREAD_ID = 1
    private currentStep: number = 0
    private traceInfo: TraceInfo | undefined
    private launchArgs: LaunchRequestArguments | undefined

    private variableHandles = new Map<number, StackElement[]>()
    private nextVariableHandle = 1000

    private breakPoints = new Map<string, DebugProtocol.SourceBreakpoint[]>()

    private lineToStepsMap = new Map<string, Map<number, number[]>>()

    constructor() {
        super("tasm-debug.log")
        this.setDebuggerLinesStartAt1(true)
        this.setDebuggerColumnsStartAt1(true)
    }

    /**
     * The 'initialize' request is the first request called by the frontend
     * to interrogate the features the debug adapter provides.
     */
    protected override initializeRequest(
        response: DebugProtocol.InitializeResponse,
        args: DebugProtocol.InitializeRequestArguments,
    ): void {
        response.body = response.body ?? {}

        response.body.supportsConfigurationDoneRequest = true
        response.body.supportsStepBack = true
        response.body.supportsRestartRequest = true

        response.body.supportsInstructionBreakpoints = true
        response.body.supportsConditionalBreakpoints = false
        response.body.supportsHitConditionalBreakpoints = false
        response.body.supportsLogPoints = false

        this.sendResponse(response)
        this.sendEvent(new InitializedEvent())
    }

    /**
     * Called at the end of the configuration sequence.
     * Indicates that all configuration is done and the debug adapter can
     * continue processing requests.
     */
    protected override configurationDoneRequest(
        response: DebugProtocol.ConfigurationDoneResponse,
        args: DebugProtocol.ConfigurationDoneArguments,
    ): void {
        super.configurationDoneRequest(response, args)
    }

    protected override async launchRequest(
        response: DebugProtocol.LaunchResponse,
        args: LaunchRequestArguments,
        request?: DebugProtocol.Request | undefined,
    ): Promise<void> {
        this.launchArgs = args
        this.log(`Launch arguments: ${JSON.stringify(args)}`)

        if (!args.tasmPath || !args.tracePath) {
            this.sendErrorResponse(
                response,
                1001,
                "tasmPath and tracePath must be provided in launch configuration.",
            )
            return
        }

        try {
            const traceContent = await fs.readFile(args.tracePath, "utf-8")
            this.traceInfo = JSON.parse(traceContent) as TraceInfo
            this.log(`Loaded trace file with ${this.traceInfo.steps.length} steps.`)

            this.buildLineToStepsMap()

            this.currentStep = 0
            this.sendResponse(response)

            if (args.stopOnEntry !== false) {
                this.sendEvent(new StoppedEvent("entry", TasmDebugSession.THREAD_ID))
            } else {
                this.continue()
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            this.log(`Error loading trace file: ${errorMessage}`)
            this.sendErrorResponse(
                response,
                1002,
                `Failed to load trace file '${args.tracePath}': ${errorMessage}`,
            )
        }
    }

    protected override threadsRequest(response: DebugProtocol.ThreadsResponse): void {
        response.body = {
            threads: [new Thread(TasmDebugSession.THREAD_ID, "main thread")],
        }
        this.sendResponse(response)
    }

    private clearVariableHandles() {
        this.variableHandles.clear()
        this.nextVariableHandle = 1000
    }

    protected override stackTraceRequest(
        response: DebugProtocol.StackTraceResponse,
        args: DebugProtocol.StackTraceArguments,
    ): void {
        this.clearVariableHandles()

        if (
            !this.traceInfo ||
            !this.launchArgs?.tasmPath ||
            this.currentStep >= this.traceInfo.steps.length
        ) {
            response.body = {stackFrames: [], totalFrames: 0}
            this.sendResponse(response)
            return
        }

        const currentStepData = this.traceInfo.steps[this.currentStep]
        const stackFrames: StackFrame[] = []

        const tasmPath = this.launchArgs.tasmPath
        const source = new Source(
            path.basename(tasmPath),
            this.convertDebuggerPathToClient(tasmPath),
        )

        let line = 0
        let column = 1

        if (currentStepData.loc) {
            line = this.convertDebuggerLineToClient(currentStepData.loc.line ?? 0)
            column = this.convertDebuggerColumnToClient(1)
        } else {
            line = 0
        }

        this.log(
            `Stack frame: ${source.path}, Line: ${line}, Col: ${column}, Step: ${this.currentStep + 1}`,
            "verbose",
        )

        stackFrames.push(
            new StackFrame(
                0,
                `${currentStepData.instructionName} (Step ${this.currentStep + 1})`,
                source,
                line,
                column,
            ),
        )

        response.body = {
            stackFrames: stackFrames,
            totalFrames: 1,
        }
        this.sendResponse(response)
    }

    protected override scopesRequest(
        response: DebugProtocol.ScopesResponse,
        args: DebugProtocol.ScopesArguments,
    ): void {
        response.body = {
            scopes: [new Scope("Stack", 1, false)],
        }
        this.sendResponse(response)
    }

    protected override variablesRequest(
        response: DebugProtocol.VariablesResponse,
        args: DebugProtocol.VariablesArguments,
        request?: DebugProtocol.Request,
    ): void {
        const variables: DebugProtocol.Variable[] = []
        const ref = args.variablesReference

        let elementsToFormat: StackElement[] | undefined

        if (ref === 1) {
            if (this.traceInfo && this.currentStep < this.traceInfo.steps.length) {
                elementsToFormat = this.traceInfo.steps[this.currentStep].stack
            }
        } else {
            elementsToFormat = this.variableHandles.get(ref)
        }

        if (elementsToFormat) {
            elementsToFormat.forEach((element, index) => {
                let variableHandle = 0
                let displayValue = this.formatStackElement(element)

                if (element.type === "Tuple") {
                    if (element.elements.length > 0) {
                        variableHandle = this.nextVariableHandle++
                        this.variableHandles.set(variableHandle, element.elements)
                        displayValue = `Tuple[${element.elements.length}]`
                    } else {
                        displayValue = `Tuple[0]`
                    }
                }

                variables.push({
                    name: `[${elementsToFormat?.length - 1 - index}]`,
                    value: displayValue,
                    variablesReference: variableHandle,
                    type: element.type,
                })
            })
        }

        response.body = {
            variables: variables,
        }
        this.sendResponse(response)
    }

    protected override continueRequest(
        response: DebugProtocol.ContinueResponse,
        args: DebugProtocol.ContinueArguments,
    ): void {
        this.continue()
        this.sendResponse(response)
    }

    protected override nextRequest(
        response: DebugProtocol.NextResponse,
        args: DebugProtocol.NextArguments,
    ): void {
        if (this.traceInfo) {
            this.currentStep++
            this.clearVariableHandles()
            if (this.currentStep < this.traceInfo.steps.length) {
                this.sendResponse(response)
                this.sendEvent(new StoppedEvent("step", TasmDebugSession.THREAD_ID))
            } else {
                this.currentStep = this.traceInfo.steps.length - 1
                this.sendResponse(response)
                this.sendEvent(new TerminatedEvent())
            }
        } else {
            this.sendErrorResponse(response, 1003, "No trace info loaded.")
        }
    }

    protected override stepBackRequest(
        response: DebugProtocol.StepBackResponse,
        args: DebugProtocol.StepBackArguments,
        request?: DebugProtocol.Request,
    ) {
        if (this.traceInfo) {
            this.currentStep--
            this.clearVariableHandles()
            if (this.currentStep >= 0) {
                this.sendResponse(response)
                this.sendEvent(new StoppedEvent("step", TasmDebugSession.THREAD_ID))
            } else {
                this.currentStep = 0
                this.sendResponse(response)
                this.sendEvent(new TerminatedEvent())
            }
        } else {
            this.sendErrorResponse(response, 1003, "No trace info loaded.")
        }
    }

    protected override restartRequest(
        response: DebugProtocol.RestartResponse,
        args: DebugProtocol.RestartArguments,
    ): void {
        this.currentStep = 0
        this.clearVariableHandles()
        this.sendResponse(response)
        this.sendEvent(new StoppedEvent("entry", TasmDebugSession.THREAD_ID))
    }

    protected override disconnectRequest(
        response: DebugProtocol.DisconnectResponse,
        args: DebugProtocol.DisconnectArguments,
        request?: DebugProtocol.Request,
    ): void {
        this.log("Disconnect request received.")
        super.disconnectRequest(response, args, request)
    }

    private log(
        message: string,
        category: "console" | "stdout" | "stderr" | "telemetry" | "verbose" = "console",
    ): void {
        this.sendEvent(new OutputEvent(`${message}\n`, category))
    }

    private formatStackElement(element: StackElement): string {
        switch (element.type) {
            case "Null":
                return `()`
            case "Integer":
                return `${element.value}`
            case "Cell":
                return `Cell{${element.boc}}`
            case "Slice":
                const sliceInfo = `bits: ${element.startBit}..${element.endBit} refs: ${element.startRef}..${element.endRef}`
                return `Slice{${element.boc} ${sliceInfo}}`
            case "Builder":
                return `Builder{${element.boc}}`
            case "Continuation":
                return `Cont{${element.boc}}`
            case "Address":
                return `addr:${element.value}`
            case "Tuple":
                return `Tuple[${element.elements.length}]`
            case "Unknown":
                return `Unknown{${element.value}}`
            default:
                return `UnknownType`
        }
    }

    private buildLineToStepsMap(): void {
        this.lineToStepsMap.clear()
        if (!this.traceInfo || !this.launchArgs?.tasmPath) return

        const normTasmPath = this.normalizePath(this.launchArgs.tasmPath)
        const tasmLineMap = new Map<number, number[]>()

        this.traceInfo.steps.forEach((step, index) => {
            if (step.loc && step.loc.line) {
                const line = step.loc.line
                if (!tasmLineMap.has(line)) {
                    tasmLineMap.set(line, [])
                }
                tasmLineMap.get(line)!.push(index)
            }
        })
        this.lineToStepsMap.set(normTasmPath, tasmLineMap)
        this.log(`Built line-to-step map for ${normTasmPath}`)
    }

    private normalizePath(filePath: string): string {
        if (path.isAbsolute(filePath)) {
            return path.normalize(filePath)
        }
        const workspaceFolders = this.getWorkspaceFoldersSync()
        const workspaceRoot = workspaceFolders?.[0]?.uri.slice(7)
        if (workspaceRoot) {
            return path.normalize(path.resolve(workspaceRoot, filePath))
        }
        return path.normalize(filePath)
    }

    private getWorkspaceFoldersSync(): {name: string; uri: string}[] | undefined {
        const cwd = process.cwd()
        const workspaceUri = this.convertDebuggerPathToClient(cwd)
        const fileUri = workspaceUri.startsWith("file://") ? workspaceUri : `file://${workspaceUri}`
        return [{name: path.basename(cwd), uri: fileUri}]
    }

    protected override async setBreakPointsRequest(
        response: DebugProtocol.SetBreakpointsResponse,
        args: DebugProtocol.SetBreakpointsArguments,
    ): Promise<void> {
        const clientLines = args.lines || []
        const sourcePath = args.source.path

        if (!sourcePath || !this.launchArgs?.tasmPath) {
            this.sendErrorResponse(
                response,
                3010,
                "setBreakpointsRequest: missing source path or tasmPath not launched",
            )
            return
        }

        const normClientPath = this.normalizePath(sourcePath)
        const normTasmPath = this.normalizePath(this.launchArgs.tasmPath)

        if (normClientPath !== normTasmPath) {
            this.log(`Ignoring breakpoints request for file not being debugged: ${normClientPath}`)
            response.body = {breakpoints: []}
            this.sendResponse(response)
            return
        }

        this.breakPoints.delete(normTasmPath)
        const requestedBps = args.breakpoints || []
        const actualBreakpoints: DebugProtocol.Breakpoint[] = []

        const sourceBreakpoints: DebugProtocol.SourceBreakpoint[] = requestedBps.map(bp => ({
            line: bp.line,
            column: bp.column,
            condition: bp.condition,
            hitCondition: bp.hitCondition,
            logMessage: bp.logMessage,
        }))
        this.breakPoints.set(normTasmPath, sourceBreakpoints)

        const tasmLineMap = this.lineToStepsMap.get(normTasmPath)
        for (const bp of sourceBreakpoints) {
            const line = this.convertClientLineToDebugger(bp.line)
            const isVerified = !!(tasmLineMap && tasmLineMap.has(line))

            const vscodeBreakpoint = new Breakpoint(isVerified, line)
            actualBreakpoints.push(vscodeBreakpoint)
        }

        response.body = {
            breakpoints: actualBreakpoints,
        }
        this.sendResponse(response)
        this.log(
            `Set ${actualBreakpoints.length} breakpoints for ${normTasmPath}. Verified: ${actualBreakpoints.filter(bp => bp.verified).length}`,
        )
    }

    private continue(): void {
        if (!this.traceInfo || !this.launchArgs?.tasmPath) {
            this.log("Cannot continue: No trace info loaded or TASM path missing.", "stderr")
            this.sendEvent(new TerminatedEvent())
            return
        }

        const normTasmPath = this.normalizePath(this.launchArgs.tasmPath)
        const breakpointsInFile = this.breakPoints.get(normTasmPath)

        for (let i = this.currentStep + 1; i < this.traceInfo.steps.length; i++) {
            const step = this.traceInfo.steps[i]
            // Check breakpoints based on step.loc.line (TASM line)
            if (step.loc && step.loc.line && breakpointsInFile) {
                const line = step.loc.line // Assuming 1-based line from trace
                const hitBreakpoint = breakpointsInFile.find(
                    bp => this.convertClientLineToDebugger(bp.line) === line,
                )
                if (hitBreakpoint) {
                    this.log(
                        `Breakpoint hit at ${path.basename(normTasmPath)}:${line} (Step ${i + 1})`,
                    )
                    this.currentStep = i
                    this.clearVariableHandles()
                    this.sendEvent(new StoppedEvent("breakpoint", TasmDebugSession.THREAD_ID))
                    return
                }
            }
        }

        this.log("No breakpoints hit, running to end of trace.")
        this.currentStep = this.traceInfo.steps.length - 1
        this.clearVariableHandles()
        this.sendEvent(new TerminatedEvent())
    }
}
