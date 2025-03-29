import * as changeCase from "change-case"
import {MessageTy, OptionTy, PrimitiveTy, Ty} from "@server/types/BaseTy"
import {Field} from "@server/psi/Decls"
import {TypeInferer} from "@server/TypeInferer"

export function generateTlb(ty: Ty, forField: boolean = false): string {
    if (ty instanceof PrimitiveTy) {
        switch (ty.name()) {
            case "Int": {
                const tlb = ty.tlb
                if (tlb) {
                    if (tlb === "coins") {
                        return "Coins"
                    }
                    if (tlb === "varint16") {
                        return "VarInteger 16"
                    }
                    if (tlb === "varint32") {
                        return "VarInteger 32"
                    }

                    return tlb
                }
                return "Int"
            }
            case "Bool": {
                return "Bool"
            }
            case "Address": {
                return "MsgAddress"
            }
            case "Cell": {
                return "^Cell"
            }
            case "Slice": {
                return "^Cell"
            }
            case "Builder": {
                return "^Cell"
            }
            case "String": {
                return "^Cell"
            }
        }
    }

    if (ty instanceof OptionTy) {
        return `Maybe ${generateTlb(ty.innerTy)}`
    }

    if (ty instanceof MessageTy) {
        if (forField) {
            return ty.name()
        }

        const anchor = ty.anchor!
        const name = anchor.name()

        const value = Number.parseInt(anchor.value().slice(1, -1))
        const header = `${changeCase.snakeCase(name)}#${value.toString(16)}`

        const fields = ty.fields().map(field => createTLBField(field))

        return header + "\n    " + fields.join("\n    ") + " = " + name
    }

    return ""
}

function createTLBField(field: Field): string {
    const type = TypeInferer.inferType(field.nameNode()!)
    if (!type) return ""

    const tlbType = generateTlb(type)

    return `${field.name()}:${tlbType}`
}
