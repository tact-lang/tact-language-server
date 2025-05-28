//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
function makeCRC32TableBigInt(polynomial: bigint): BigInt64Array {
    let c
    const table = new BigInt64Array(256)
    for (let n = 0; n < table.length; n++) {
        c = BigInt(n)
        for (let k = 0; k < 8; k++) {
            c = c & 1n ? (c >> 1n) ^ BigInt(polynomial) : c >> 1n
        }
        table[n] = c
    }
    return table
}

// Reversed polynomial of ISO3309 CRC32
const CRC32C_TABLE_BIGINT = makeCRC32TableBigInt(0xed_b8_83_20n)

export function crc32BigInt(data: string | Uint8Array): bigint {
    if (typeof data === "string") {
        data = new TextEncoder().encode(data)
    }

    let crc = 0xff_ff_ff_ffn
    for (const byte of data) {
        crc = (CRC32C_TABLE_BIGINT[Number(crc ^ BigInt(byte)) & 0xff] ?? 0) ^ (crc >> 8n)
    }

    return crc ^ 0xff_ff_ff_ffn
}
