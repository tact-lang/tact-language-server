import {TactFile} from "@server/languages/tact/psi/TactFile"
import * as lsp from "vscode-languageserver"
import {createTactParser} from "@server/parser"
import {getOffsetFromPosition} from "@server/document-store"
import {asParserPoint} from "@server/utils/position"
import {NamedNode} from "@server/languages/tact/psi/TactNode"
import {Reference} from "@server/languages/tact/psi/Reference"
import {CompletionContext} from "@server/languages/tact/completion/CompletionContext"
import {getDocumentSettings} from "@server/settings/settings"
import {CompletionResult} from "@server/languages/tact/completion/WeightedCompletionItem"
import type {CompletionProvider} from "@server/languages/tact/completion/CompletionProvider"
import {SnippetsCompletionProvider} from "@server/languages/tact/completion/providers/SnippetsCompletionProvider"
import {KeywordsCompletionProvider} from "@server/languages/tact/completion/providers/KeywordsCompletionProvider"
import {AsKeywordCompletionProvider} from "@server/languages/tact/completion/providers/AsKeywordCompletionProvider"
import {ImportPathCompletionProvider} from "@server/languages/tact/completion/providers/ImportPathCompletionProvider"
import {MapTypeCompletionProvider} from "@server/languages/tact/completion/providers/MapTypeCompletionProvider"
import {BouncedTypeCompletionProvider} from "@server/languages/tact/completion/providers/BouncedTypeCompletionProvider"
import {GetterCompletionProvider} from "@server/languages/tact/completion/providers/GetterCompletionProvider"
import {ContractDeclCompletionProvider} from "@server/languages/tact/completion/providers/ContractDeclCompletionProvider"
import {TopLevelFunctionCompletionProvider} from "@server/languages/tact/completion/providers/TopLevelFunctionCompletionProvider"
import {TopLevelCompletionProvider} from "@server/languages/tact/completion/providers/TopLevelCompletionProvider"
import {MemberFunctionCompletionProvider} from "@server/languages/tact/completion/providers/MemberFunctionCompletionProvider"
import {MessageMethodCompletionProvider} from "@server/languages/tact/completion/providers/MessageMethodCompletionProvider"
import {TlbSerializationCompletionProvider} from "@server/languages/tact/completion/providers/TlbSerializationCompletionProvider"
import {OverrideCompletionProvider} from "@server/languages/tact/completion/providers/OverrideCompletionProvider"
import {TraitOrContractFieldsCompletionProvider} from "@server/languages/tact/completion/providers/TraitOrContractFieldsCompletionProvider"
import {TraitOrContractConstantsCompletionProvider} from "@server/languages/tact/completion/providers/TraitOrContractConstantsCompletionProvider"
import {SelfCompletionProvider} from "@server/languages/tact/completion/providers/SelfCompletionProvider"
import {ReturnCompletionProvider} from "@server/languages/tact/completion/providers/ReturnCompletionProvider"
import {ReferenceCompletionProvider} from "@server/languages/tact/completion/providers/ReferenceCompletionProvider"
import {AsmInstructionCompletionProvider} from "@server/languages/tact/completion/providers/AsmInstructionCompletionProvider"
import {PostfixCompletionProvider} from "@server/languages/tact/completion/providers/PostfixCompletionProvider"
import {TypeTlbSerializationCompletionProvider} from "@server/languages/tact/completion/providers/TypeTlbSerializationCompletionProvider"
import {CompletionItemAdditionalInformation} from "@server/languages/tact/completion/ReferenceCompletionProcessor"
import {findTactFile} from "@server/files"
import {index} from "@server/languages/tact/indexes"
import {FileDiff} from "@server/utils/FileDiff"

export async function provideTactCompletion(
    file: TactFile,
    params: lsp.CompletionParams,
    uri: string,
): Promise<lsp.CompletionItem[]> {
    const content = file.content
    const parser = createTactParser()

    const offset = getOffsetFromPosition(
        content,
        params.position.line,
        params.position.character + 1,
    )
    const start = content.slice(0, offset)
    const end = content.slice(offset)

    // Let's say we want to get autocompletion in the following code:
    //
    //   fun foo(p: Builder) {
    //      p.
    //   } // ^ caret here
    //
    // Regular parsers, including those that can recover from errors, will not
    // be able to parse this code well enough for us to recognize this situation.
    // Some Language Servers try to do this, but they end up with a lot of
    // incomprehensible and complex code that doesn't work well.
    //
    // The approach we use is very simple; instead of parsing the code above,
    // we transform it into:
    //
    //    fun foo(p: Builder) {
    //       p.dummyIdentifier
    //    } // ^ caret here
    //
    // Which will be parsed without any problems now.
    //
    // Now that we have valid code, we can use `Reference.processResolveVariants`
    // to resolve `DummyIdentifier` into a list of possible variants, which will
    // become the autocompletion list. See `Reference` class documentation.
    const newContent = `${start}DummyIdentifier${end}`
    const tree = parser.parse(newContent)
    if (!tree) return []

    const cursorPosition = asParserPoint(params.position)
    const cursorNode = tree.rootNode.descendantForPosition(cursorPosition)
    if (
        cursorNode === null ||
        (cursorNode.type !== "identifier" &&
            cursorNode.type !== "type_identifier" &&
            cursorNode.type !== "string" &&
            cursorNode.type !== "tvm_instruction")
    ) {
        return []
    }

    const element = new NamedNode(cursorNode, new TactFile(uri, tree, newContent))
    const ref = new Reference(element)

    const ctx = new CompletionContext(
        newContent,
        element,
        params.position,
        params.context?.triggerKind ?? lsp.CompletionTriggerKind.Invoked,
        await getDocumentSettings(uri),
    )

    const result = new CompletionResult()
    const providers: CompletionProvider[] = [
        new SnippetsCompletionProvider(),
        new KeywordsCompletionProvider(),
        new AsKeywordCompletionProvider(),
        new ImportPathCompletionProvider(),
        new MapTypeCompletionProvider(),
        new BouncedTypeCompletionProvider(),
        new GetterCompletionProvider(),
        new ContractDeclCompletionProvider(),
        new TopLevelFunctionCompletionProvider(),
        new TopLevelCompletionProvider(),
        new MemberFunctionCompletionProvider(),
        new MessageMethodCompletionProvider(),
        new TlbSerializationCompletionProvider(),
        new OverrideCompletionProvider(),
        new TraitOrContractFieldsCompletionProvider(),
        new TraitOrContractConstantsCompletionProvider(),
        new SelfCompletionProvider(),
        new ReturnCompletionProvider(),
        new ReferenceCompletionProvider(ref),
        new AsmInstructionCompletionProvider(),
        new PostfixCompletionProvider(),
        new TypeTlbSerializationCompletionProvider(),
    ]

    providers.forEach((provider: CompletionProvider) => {
        if (!provider.isAvailable(ctx)) return
        provider.addCompletion(ctx, result)
    })

    return result.sorted()
}

export async function provideTactCompletionResolve(
    item: lsp.CompletionItem,
): Promise<lsp.CompletionItem> {
    if (!item.data) return item
    const data = item.data as CompletionItemAdditionalInformation
    if (data.file === undefined || data.elementFile === undefined || data.name === undefined) {
        return item
    }

    const settings = await getDocumentSettings(data.file.uri)
    if (!settings.completion.addImports) return item

    const file = await findTactFile(data.file.uri)
    const elementFile = await findTactFile(data.elementFile.uri)

    // skip the same file element
    if (file.uri === elementFile.uri) return item
    const importPath = elementFile.importPath(file)
    // already imported
    if (file.alreadyImport(importPath)) return item
    // some files like stubs or stdlib imported implicitly
    if (elementFile.isImportedImplicitly()) return item
    // guard for multi projects
    if (index.hasSeveralDeclarations(data.name)) return item

    const positionToInsert = file.positionForNextImport()

    const extraLine = positionToInsert.line === 0 && file.imports().length === 0 ? "\n" : ""

    const diff = FileDiff.forFile(elementFile.uri)
    diff.appendAsPrevLine(positionToInsert.line, `import "${importPath}";${extraLine}`)

    return {
        ...item,
        additionalTextEdits: diff.toTextEdits(),
    }
}
