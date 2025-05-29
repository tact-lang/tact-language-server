//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type * as lsp from "vscode-languageserver/node"
import type {TactSettings} from "@server/settings/settings"
import {TlbNode} from "../psi/TlbNode"

export class CompletionContext {
    public element: TlbNode
    public position: lsp.Position
    public triggerKind: lsp.CompletionTriggerKind

    public isType: boolean = false

    public settings: TactSettings

    public constructor(
        element: TlbNode,
        position: lsp.Position,
        triggerKind: lsp.CompletionTriggerKind,
        settings: TactSettings,
    ) {
        this.element = element
        this.position = position
        this.triggerKind = triggerKind
        this.settings = settings

        if (element.node.type === "type_identifier") {
            this.isType = true
        }
    }
}
