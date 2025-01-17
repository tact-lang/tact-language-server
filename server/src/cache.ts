import {LRUMap} from "./utils/lruMap"
import {Ty} from "./types/BaseTy"
import {NamedNode} from "./psi/Node"

export interface CacheConfig {
    size: number
}

export class Cache<TKey, TValue> {
    private data: LRUMap<TKey, TValue>

    constructor(config: CacheConfig) {
        this.data = new LRUMap({
            size: config.size,
            dispose: _entries => {},
        })
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
    public readonly resolveCache: Cache<number, NamedNode | null>

    constructor() {
        this.typeCache = new Cache({size: 10000})
        this.resolveCache = new Cache({size: 10000})
    }

    public clear(): void {
        console.log("Clearing caches")
        console.log("Type cache size:", this.typeCache.size)
        console.log("Resolve cache size:", this.resolveCache.size)

        this.typeCache.clear()
        this.resolveCache.clear()
    }
}

export const CACHE = new CacheManager()
