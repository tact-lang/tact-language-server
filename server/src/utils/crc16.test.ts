import {crc16} from "./crc16"

describe("crc16", () => {
    it("calculates CRC16 for strings", () => {
        expect(crc16("123456789")).toBe(0x31_c3)
        expect(crc16("hello world")).toBe(0x3b_e4)
        expect(crc16("Test")).toBe(0xac_48)
    })

    it("calculates CRC16 for byte arrays", () => {
        expect(crc16(Uint8Array.from([1, 2, 3, 4]))).toBe(0x0d_03)
        expect(crc16(Uint8Array.from([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc]))).toBe(0xa6_50)
    })
})
