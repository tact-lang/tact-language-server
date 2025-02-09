export function crc16(buffer: Buffer) {
    let crc = 0xff_ff
    let odd = 0

    for (const element of buffer) {
        crc = crc ^ element
        for (let j = 0; j < 8; j++) {
            odd = crc & 0x00_01
            crc = crc >> 1
            if (odd) {
                crc = crc ^ 0xa0_01
            }
        }
    }

    return crc
}
