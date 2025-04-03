import * as changeCase from "change-case"
import {
    ContractTy,
    MapTy,
    MessageTy,
    OptionTy,
    PrimitiveTy,
    StructTy,
    Ty,
} from "@server/types/BaseTy"
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
                    if (tlb === "varuint16") {
                        return "VarUInteger 16"
                    }
                    if (tlb === "varuint32") {
                        return "VarUInteger 32"
                    }

                    return tlb
                }
                return "int257"
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

    if (ty instanceof MapTy) {
        return "^Cell"
    }

    if (ty instanceof OptionTy) {
        return `Maybe ${generateTlb(ty.innerTy)}`
    }

    if (ty instanceof MessageTy) {
        if (forField) {
            return ty.name()
        }

        const anchor = ty.anchor
        if (!anchor) {
            return ty.name()
        }

        const name = anchor.name()
        const opcode = anchor.opcode() ?? "0x-1"
        const header = `${changeCase.snakeCase(name)}#${opcode.slice(2)}`

        const fields = ty.fields().map(field => createTLBField(field))

        return header + "\n    " + fields.join("\n    ") + " = " + name
    }

    if (ty instanceof StructTy) {
        if (forField) {
            return ty.name()
        }

        const anchor = ty.anchor
        if (!anchor) {
            return ty.name()
        }

        const name = anchor.name()
        const fields = ty.fields().map(field => createTLBField(field))

        return "_ " + fields.join("\n  ") + " = " + name
    }

    if (ty instanceof ContractTy) {
        if (forField) {
            return ty.name()
        }

        const anchor = ty.anchor
        if (!anchor) {
            return ty.name()
        }

        const name = anchor.name()
        const fields = ty.fields().map(field => createTLBField(field))

        if (anchor.hasLazyInitializationBit()) {
            fields.splice(0, 0, "lazy_deployment_bit:Bool")
        }

        return "_ " + fields.join("\n  ") + " = " + name
    }

    return ""
}

function createTLBField(field: Field): string {
    const nameNode = field.nameNode()
    if (!nameNode) return ""
    const type = TypeInferer.inferType(nameNode)
    if (!type) return ""

    const tlbType = generateTlb(type)

    return `${field.name()}:${tlbType}`
}
