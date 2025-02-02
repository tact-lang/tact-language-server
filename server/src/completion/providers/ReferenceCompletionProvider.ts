import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItem} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"
import {Reference, ResolveState, ScopeProcessor} from "@server/psi/Reference"
import {ReferenceCompletionProcessor} from "@server/completion/ReferenceCompletionProcessor"
import {NamedNode, Node} from "@server/psi/Node"
import {FieldsOwner} from "@server/psi/Decls"

enum FieldsKind {
    ONLY_FIELDS = "ONLY_FIELDS",
    ALL = "ALL",
}

export class ReferenceCompletionProvider implements CompletionProvider {
    constructor(private ref: Reference) {}

    isAvailable(ctx: CompletionContext): boolean {
        return (
            !ctx.topLevelInTraitOrContract &&
            !ctx.topLevelInStructOrMessage &&
            !ctx.topLevel &&
            !ctx.inTlbSerialization &&
            !ctx.inParameter
        )
    }

    addCompletion(ctx: CompletionContext, elements: CompletionItem[]): void {
        const state = new ResolveState()
        const processor = new ReferenceCompletionProcessor(ctx)

        const kind = this.processFields(processor, state, ctx)

        // process usual autocompletion for only non instance expressions
        if (kind === FieldsKind.ALL) {
            this.ref.processResolveVariants(processor, state.withValue("completion", "true"))
        }

        elements.push(...processor.result.values())
    }

    processFields(
        processor: ScopeProcessor,
        state: ResolveState,
        ctx: CompletionContext,
    ): FieldsKind {
        const parent = ctx.element.node.parent
        // Foo { value: 10 }
        //     ^^^^^^^^^^^^^ looking for
        if (parent?.type !== "instance_argument") return FieldsKind.ALL

        // Foo { value: 10 }
        //       ^^^^^ this
        const name = parent?.childForFieldName("name")
        if (!name) return FieldsKind.ALL
        if (!name.equals(ctx.element.node)) return FieldsKind.ALL

        // Foo { value: 10 }
        // ^^^^^^^^^^^^^^^^^ this
        const grand = parent?.parent?.parent
        if (grand?.type !== "instance_expression") return FieldsKind.ALL

        // Foo { value: 10 }
        // ^^^ this
        const typeExpr = grand.childForFieldName("name")
        if (!typeExpr) return FieldsKind.ALL

        const resolvedType = Reference.resolve(new NamedNode(typeExpr, ctx.element.file))
        if (resolvedType === null) return FieldsKind.ALL
        if (!(resolvedType instanceof FieldsOwner)) return FieldsKind.ALL

        const fields = resolvedType.fields()

        const initializedFieldsNode = grand.childForFieldName("arguments")
        if (!initializedFieldsNode) return FieldsKind.ALL
        const initializedFields = initializedFieldsNode.children
            .filter(it => it?.type === "instance_argument")
            .filter(it => it !== null)

        const fieldNames = new Set<string>()
        fields.forEach(field => {
            fieldNames.add(field.name())
        })

        const alreadyInitialized = new Set<string>()
        initializedFields.forEach(it => {
            const name = it?.childForFieldName("name")
            if (!name) return
            const fieldName = name.text
            alreadyInitialized.add(fieldName)
        })

        for (const field of fields) {
            if (alreadyInitialized.has(field.name())) continue
            if (!processor.execute(field, state)) break
        }

        const variablesProcessor = new (class implements ScopeProcessor {
            execute(node: Node, state: ResolveState): boolean {
                if (node.node.type !== "identifier" && node.node.type !== "parameter") return true

                const name = node instanceof NamedNode ? node.name() : node.node.text
                if (!fieldNames.has(name) || alreadyInitialized.has(name)) {
                    // no such field for short initialization
                    // or already initialized
                    return true
                }

                return processor.execute(node, state)
            }
        })()

        this.ref.processBlock(variablesProcessor, state)

        return FieldsKind.ONLY_FIELDS
    }
}
