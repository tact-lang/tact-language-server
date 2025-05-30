//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as path from "path"
import type {Node as SyntaxNode, Tree} from "web-tree-sitter"
import {URI} from "vscode-uri"

export class File {
    public constructor(
        public readonly uri: string,
        public readonly tree: Tree,
        public readonly content: string,
    ) {}

    public get rootNode(): SyntaxNode {
        return this.tree.rootNode
    }

    public get path(): string {
        return uriToFilePath(this.uri)
    }

    public get name(): string {
        return path.basename(this.path, ".tact")
    }
}

export function uriToFilePath(uri: string): string {
    const normalizedUri = uri.replace(/\\/g, "/")
    return URI.parse(normalizedUri).fsPath
}
