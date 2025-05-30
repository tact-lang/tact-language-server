import type {Node as SyntaxNode} from "web-tree-sitter"
import {FuncNamedNode} from "./FuncNode"

export class FuncFunction extends FuncNamedNode {
    public body(): SyntaxNode | null {
        return this.node.childForFieldName("body")
    }

    public returnType(): SyntaxNode | null {
        return this.node.childForFieldName("return_type")
    }

    public override nameNode(): SyntaxNode | null {
        return this.node.childForFieldName("name")
    }

    public argumentsNode(): SyntaxNode | null {
        return this.node.childForFieldName("arguments")
    }
}

export class FuncParameter extends FuncNamedNode {
    public typeNode(): SyntaxNode | null {
        return this.node.childForFieldName("type")
    }
}

export class FuncVariable extends FuncNamedNode {
    // For local variables (let statements, foreach, etc.)
}

export class FuncGlobalVariable extends FuncNamedNode {
    public typeNode(): SyntaxNode | null {
        return this.node.childForFieldName("type")
    }
}

export class FuncConstant extends FuncNamedNode {
    public typeNode(): SyntaxNode | null {
        return this.node.childForFieldName("type")
    }

    public valueNode(): SyntaxNode | null {
        return this.node.childForFieldName("value")
    }
}
