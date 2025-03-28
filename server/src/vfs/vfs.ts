import {connection} from "@server/connection"

export interface Vfs {
    readFile: (uri: string) => Promise<undefined | string>
}

let vfs: Vfs

export const readFile = async (uri: string): Promise<string | undefined> => vfs.readFile(uri)

export function createVfs(clientName: undefined | string): void {
    if (clientName?.includes("Code") || clientName?.includes("Codium")) {
        vfs = {
            readFile: async uri => {
                return connection.sendRequest<undefined | string>("tact.readFile", {uri})
            },
        }
        return
    }

    vfs = {
        readFile: async uri => {
            // eslint-disable-next-line unicorn/no-await-expression-member
            return (await import("node:fs/promises")).readFile(new URL(uri).pathname, "utf8")
        },
    }
}
