//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
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
import {highest32ofSha256, sha256} from "@server/compiler/sha256"

export function messageOpcode(message: MessageTy): undefined | bigint {
    const signature = generateCompilerTlb(message)
    if (!signature) return undefined
    return calculateMessageOpcode(signature)
}

export function generateCompilerTlb(ty: Ty): undefined | string {
    if (ty instanceof PrimitiveTy) {
        const tlb = ty.tlb
        switch (ty.name()) {
            case "Int": {
                if (tlb) {
                    if (tlb === "coins") {
                        return "coins"
                    }
                    if (tlb === "varint16") {
                        return "varint16"
                    }
                    if (tlb === "varint32") {
                        return "varint32"
                    }
                    if (tlb === "varuint16") {
                        return "varuint16"
                    }
                    if (tlb === "varuint32") {
                        return "varuint32"
                    }

                    return tlb
                }
                return "int257"
            }
            case "Bool": {
                return "bool"
            }
            case "Address": {
                return "address"
            }
            case "Cell": {
                if (tlb === "remaining") {
                    return "remainder<cell>"
                }
                return "^cell"
            }
            case "Slice": {
                if (tlb === "remaining") {
                    return "remainder<slice>"
                }
                if (tlb?.startsWith("bytes")) {
                    return "fixed_" + tlb
                }
                return "^slice"
            }
            case "Builder": {
                if (tlb === "remaining") {
                    return "remainder<builder>"
                }
                return "^builder"
            }
            case "String": {
                return "^string"
            }
        }
    }

    if (ty instanceof MapTy) {
        const keyTypeTlb = generateCompilerTlb(ty.keyTy)
        const valueTypeTlb = generateCompilerTlb(ty.valueTy)

        if (!keyTypeTlb || !valueTypeTlb) {
            return undefined
        }

        const normalizedKey = keyTypeTlb === "int257" ? "int" : keyTypeTlb
        const normalizedValue = valueTypeTlb === "int257" ? "int" : valueTypeTlb

        return "dict<" + normalizedKey + ", " + normalizedValue + ">"
    }

    if (ty instanceof OptionTy) {
        const innerTypeTlb = generateCompilerTlb(ty.innerTy)
        if (!innerTypeTlb) {
            return undefined
        }
        if (ty.innerTy.name() === "Address") {
            return innerTypeTlb
        }
        return `Maybe ${innerTypeTlb}`
    }

    if (ty instanceof MessageTy || ty instanceof StructTy || ty instanceof ContractTy) {
        const anchor = ty.anchor
        if (!anchor) {
            return ty.name()
        }

        const name = anchor.name()
        const fields = ty.fields().map(field => createTLBField(field))
        if (fields.includes(undefined)) {
            return undefined
        }

        return name + "{" + fields.join(",") + "}"
    }

    return ""
}

function createTLBField(field: Field): undefined | string {
    const nameNode = field.nameNode()
    if (!nameNode) return undefined
    const type = TypeInferer.inferType(nameNode)
    if (!type) return undefined

    const tlbType = generateCompilerTlb(type)

    return `${field.name()}:${tlbType}`
}

function calculateMessageOpcode(signature: string): bigint {
    return highest32ofSha256(sha256(signature))
}
