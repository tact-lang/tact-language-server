import type {Node as SyntaxNode} from "web-tree-sitter"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import * as lsp from "vscode-languageserver"
import {ParameterInformation} from "vscode-languageserver"
import {CallLike, Expression, NamedNode, TactNode} from "@server/languages/tact/psi/TactNode"
import {Contract, Fun} from "@server/languages/tact/psi/Decls"
import {parentOfType} from "@server/languages/tact/psi/utils"
import {FieldsOwnerTy} from "@server/languages/tact/types/BaseTy"
import {Reference} from "@server/languages/tact/psi/Reference"
import {File} from "@server/psi/File"
import {asParserPoint} from "@server/utils/position"
import {findTactFile} from "@server/files"

export async function provideTactSignatureInfo(
    params: lsp.SignatureHelpParams,
): Promise<lsp.SignatureHelp | null> {
    const file = await findTactFile(params.textDocument.uri)

    const hoverNode = nodeAtPosition(params, file)
    if (!hoverNode) return null

    const res = findSignatureHelpTarget(hoverNode, file)
    if (!res) return null

    const {parametersInfo, rawArguments, isMethod, presentation, isStructField, structFieldIndex} =
        res

    if (isStructField) {
        return {
            signatures: [
                {
                    label: presentation,
                    parameters: parametersInfo,
                    activeParameter: structFieldIndex,
                },
            ],
        }
    }

    // The algorithm below uses the positions of commas and parentheses to findTo find the active parameter, it is enough to find the last comma, which has a position in the line less than the cursor position. In order not to complicate the algorithm, we consider the opening bracket as a kind of comma for the zero element. If the cursor position is greater than the position of any comma, then we consider that this is the last element. the active parameter.
    //
    // foo(1000, 2000, 3000)
    //    ^    ^     ^
    //    |    |     |______ argsCommas
    //    |    |____________|
    //    |_________________|
    //
    // To find the active parameter, it is enough to find the last comma, which has a position in
    // the line less than the cursor position. To simplify the algorithm, we consider the opening
    // bracket as a kind of comma for the zero element.
    // If the cursor position is greater than the position of any comma, then we consider that this
    // is the last parameter.
    //
    // TODO: support multiline calls and functions with self

    const argsCommas = rawArguments.filter(value => value.text === "," || value.text === "(")

    let currentIndex = 0
    for (const [i, argComma] of argsCommas.entries()) {
        if (argComma.endPosition.column > params.position.character) {
            // found comma after cursor
            break
        }
        currentIndex = i
    }

    if (isMethod) {
        // skip self
        currentIndex++
    }

    return {
        signatures: [
            {
                label: presentation,
                parameters: parametersInfo,
                activeParameter: currentIndex,
            },
        ],
    }
}

export function findSignatureHelpTarget(
    hoverNode: SyntaxNode,
    file: TactFile,
): {
    rawArguments: SyntaxNode[]
    parametersInfo: lsp.ParameterInformation[]
    presentation: string
    isMethod: boolean
    isStructField: boolean
    structFieldIndex: number
} | null {
    const findParameters = (element: NamedNode): TactNode[] => {
        if (element instanceof Contract) {
            const initFunction = element.initFunction()
            if (initFunction) {
                return initFunction.parameters()
            }
            return element.parameters()
        }

        const parameters = element.node.childForFieldName("parameters")
        if (!parameters) return []

        return parameters.children
            .filter(param => param?.type === "parameter")
            .filter(param => param !== null)
            .map(param => new TactNode(param, element.file))
    }

    const findSignatureHelpNode = (node: SyntaxNode): SyntaxNode | null => {
        const targetNodes = [
            "static_call_expression",
            "method_call_expression",
            "initOf",
            "instance_expression",
            "instance_argument",
            "instance_argument_list",
        ]
        const callNode = parentOfType(node, ...targetNodes)
        if (!callNode) return null

        // Foo { some: 10 }
        //     ^ this
        const isOpenBrace =
            callNode.type === "instance_argument_list" && callNode.firstChild?.equals(node)

        // Foo { some: 10 }
        // ^^^ this
        const isInstanceName =
            callNode.type === "instance_expression" &&
            callNode.childForFieldName("name")?.equals(node)

        // Search for parent call for the following case
        // ```
        // foo(Fo<caret>o { value: 10 })
        // ```
        if (isInstanceName || isOpenBrace) {
            return findSignatureHelpNode(callNode)
        }

        if (
            callNode.type === "instance_expression" ||
            callNode.type === "instance_argument" ||
            callNode.type === "instance_argument_list"
        ) {
            return callNode
        }

        const call = new CallLike(callNode, file)

        // check if the current node within arguments
        //
        // foo() // <cursor>
        //   .bar()
        // > no
        //
        // foo(<caret>)
        //   .bar()
        // > yes
        const args = call.rawArguments()
        const openBrace = args.at(0)
        const closeBrace = args.at(-1)
        if (!openBrace || !closeBrace) return null

        const startIndex = openBrace.startIndex
        const endIndexIndex = closeBrace.endIndex

        if (node.startIndex < startIndex || node.endIndex > endIndexIndex) {
            const parent = node.parent
            if (!parent) return null
            return findSignatureHelpNode(parent)
        }

        return callNode
    }

    const callNode = findSignatureHelpNode(hoverNode)
    if (!callNode) return null

    if (callNode.type === "instance_argument_list" || callNode.type === "instance_argument") {
        let name =
            callNode.childForFieldName("name") ??
            (hoverNode.type === "instance_argument"
                ? hoverNode.firstChild
                : hoverNode.previousNamedSibling)

        if (!name) return null
        if (name.type === "instance_argument") {
            name = name.firstChild
        }
        if (!name) return null

        const type = new Expression(name, file).type()
        if (!type) return null

        const instanceExpression = parentOfType(callNode, "instance_expression")
        if (!instanceExpression) return null

        const instanceName = instanceExpression.childForFieldName("name")
        if (!instanceName) return null

        const instanceType = new Expression(instanceName, file).type()
        if (!instanceType) return null
        if (!(instanceType instanceof FieldsOwnerTy)) return null

        const fields = instanceType.fields()
        const fieldPresentations = fields.map(
            field => `${field.name()}: ${field.typeNode()?.node.text ?? ""}`,
        )

        const fieldsInfo = fieldPresentations.map(
            name =>
                ({
                    label: name,
                }) as ParameterInformation,
        )

        const presentation = instanceType.name() + " { " + fieldPresentations.join(", ") + " }"

        return {
            rawArguments: [],
            parametersInfo: fieldsInfo,
            presentation: presentation,
            isMethod: false,
            isStructField: true,
            structFieldIndex: fields.findIndex(f => f.name() === name.text),
        }
    }

    const call = new CallLike(callNode, file)

    const res = Reference.resolve(call.nameNode())
    if (res === null) return null

    const parameters = findParameters(res)
    const parametersInfo: lsp.ParameterInformation[] = parameters.map(param => ({
        label: param.node.text,
    }))
    const parametersString = parametersInfo.map(el => el.label).join(", ")

    const rawArguments = call.rawArguments()

    if (callNode.type === "initOf") {
        return {
            rawArguments,
            parametersInfo,
            presentation: `init(${parametersString})`,
            isMethod: false,
            isStructField: false,
            structFieldIndex: 0,
        }
    }

    if (!(res instanceof Fun)) return null

    return {
        rawArguments,
        parametersInfo,
        presentation: `fun ${call.name()}(${parametersString})`,
        isMethod: callNode.type === "method_call_expression" && res.withSelf(),
        isStructField: false,
        structFieldIndex: 0,
    }
}

function nodeAtPosition(params: lsp.TextDocumentPositionParams, file: File): SyntaxNode | null {
    const cursorPosition = asParserPoint(params.position)
    return file.rootNode.descendantForPosition(cursorPosition)
}
