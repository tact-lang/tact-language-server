//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {Ty} from "@server/languages/tact/types/BaseTy"
import {TlbNode} from "@server/languages/tlb/psi/TlbNode"

export class Cache<TKey, TValue> {
    private readonly data: Map<TKey, TValue>

    public constructor() {
        this.data = new Map()
    }

    public cached(key: TKey, cb: () => TValue): TValue {
        const cached = this.data.get(key)
        if (cached !== undefined) {
            return cached
        }

        const value = cb()
        this.data.set(key, value)
        return value
    }

    public clear(): void {
        this.data.clear()
    }

    public get size(): number {
        return this.data.size
    }
}

export class CacheManager {
    public readonly typeCache: Cache<number, Ty | null>
    public readonly resolveCache: Cache<number, TlbNode | null>

    public constructor() {
        this.typeCache = new Cache()
        this.resolveCache = new Cache()
    }

    public clear(): void {
        console.info(
            `Clearing caches (types: ${this.typeCache.size}, resolve: ${this.resolveCache.size})`,
        )
        this.typeCache.clear()
        this.resolveCache.clear()
    }
}

export const TLB_CACHE = new CacheManager()
