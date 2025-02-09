import type {InitFunction, MessageFunction} from "@server/psi/Decls"
import {Expression} from "@server/psi/Node"
import {BouncedTy, MessageTy} from "@server/types/BaseTy"

const CODE_FENCE = "```"

export function generateInitDoc(func: InitFunction): string | null {
    const name = func.nameLike()

    const doc = `Constructor function \`init()\` runs on deployment of the contract.
If a contract has any persistent state variables without default values specified, it must initialize them in this function.`

    const link = "https://docs.tact-lang.org/book/contracts/#init-function"
    return defaultResult(name, doc, link)
}

export function generateReceiverDoc(func: MessageFunction): string | null {
    const name = func.nameLike()

    const kind = func.kindIdentifier()?.text
    if (!kind) return null

    const link =
        kind === "receive"
            ? "https://docs.tact-lang.org/book/receive/"
            : kind === "bounced"
              ? "https://docs.tact-lang.org/book/bounced/"
              : "https://docs.tact-lang.org/book/external/"

    // receive() {}
    //        ^^
    const param = func.parameter()
    if (!param) {
        const doc = "Called when an empty message is sent to the contract"
        return defaultResult(name, doc, link)
    }

    // receive("message") {}
    //         ^^^^^^^^^
    if (param.type === "string") {
        const doc =
            'Called when a text message with a specific comment is sent to the contract (maximum "message" length is 123 bytes)'
        return defaultResult(name, doc, link)
    }

    const typeNode = param.childForFieldName("type")
    if (!typeNode) return null
    const type = new Expression(typeNode, func.file).type()
    if (!type) return null

    // receive(str: String) {}
    //              ^^^^^^
    if (type.name() === "String") {
        const doc = "Called when an arbitrary text message is sent to the contract"
        return defaultResult(name, doc, link)
    }

    // receive(msg: ChangeOwner) {}
    //              ^^^^^^^^^^^
    if (type instanceof MessageTy) {
        const doc = `Called when a binary message of type \`${type.name()}\` is sent to the contract`
        return defaultResult(name, doc, link)
    }

    // bounced(msg: bounced<ChangeOwner>) {}
    //              ^^^^^^^^^^^^^^^^^^^^
    if (type instanceof BouncedTy) {
        const doc = `Called when a binary message of type \`${type.innerTy.name()}\` is sent to the contract`
        return defaultResult(name, doc, link)
    }

    // external(msg: Slice) {}
    //               ^^^^^
    if (type.name() === "Slice") {
        const doc = "Called when binary message of unknown type is sent to the contract"
        return defaultResult(name, doc, link)
    }

    return defaultResult(name, "", link)
}

function defaultResult(name: string, doc: string, link: string) {
    return (
        `${CODE_FENCE}tact\n${name} {}\n${CODE_FENCE}` +
        "\n" +
        doc +
        "\n\nLearn more in documentation: " +
        link
    )
}
