//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio

import {CompletionProvider} from "@server/languages/tlb/completion/CompletionProvider"
import {CompletionContext} from "@server/languages/tlb/completion/CompletionContext"
import {
    CompletionResult,
    CompletionWeight,
} from "@server/languages/tlb/completion/WeightedCompletionItem"
import {CompletionItemKind} from "vscode-languageserver-types"

export class BuiltinTypesCompletionProvider implements CompletionProvider {
    private readonly types: [string, string][] = [
        ["#", "Nat, 32-bit unsigned integer"],
        ["##", "Nat: unsigned integer with `x` bits."],
        [
            "#<",
            "Nat: unsigned integer less than `x` bits, stored as `lenBits(x - 1)` bits up to 31 bits.",
        ],
        [
            "#<=",
            "Nat: unsigned integer less than or equal to x bits, stored as lenBits(x) bits up to 32 bits.",
        ],
        ["Any", "remaining bits and references."],
        ["Cell", "remaining bits and references."],
        ["Int", "257 bits"],
        ["UInt", "256 bits"],
        ["Bits", "1023 bits"],
        ["bits", "X bits"],
        ["uint", ""],
        ["uint8", ""],
        ["uint16", ""],
        ["uint32", ""],
        ["uint64", ""],
        ["uint128", ""],
        ["uint256", ""],
        ["int", ""],
        ["int8", ""],
        ["int16", ""],
        ["int32", ""],
        ["int64", ""],
        ["int128", ""],
        ["int256", ""],
        ["int257", ""],
    ]

    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.isType
    }

    public addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        for (const [type, description] of this.types) {
            result.add({
                label: type,
                labelDetails: {
                    detail: ` ${description}`,
                },
                kind: CompletionItemKind.Struct,
                weight: CompletionWeight.CONTEXT_ELEMENT,
            })
        }
    }
}
