import {DebugSession} from "@vscode/debugadapter"
import {TasmDebugSession} from "./tasmDebugSession"

DebugSession.run(TasmDebugSession)
