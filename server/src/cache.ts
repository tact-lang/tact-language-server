import {LRUMap} from "./utils/lruMap";
import {Ty} from "./types/BaseTy";
import {NamedNode} from "./psi/Node";

function dispose<K, V>(_entries: [K, V][]) {
}

export class CacheManager {
    public typeCache: Cache<number, Ty | null> = new Cache()
    public resolveCache: Cache<number, NamedNode | null> = new Cache()

    public clear() {
        console.log('clear cache')
        this.typeCache.clear()
        this.resolveCache.clear()
    }
}

export class Cache<TKey, TValue> {
    private data: LRUMap<TKey, TValue> = new LRUMap({size: 10000, dispose: dispose})

    public cached(key: TKey, cb: () => TValue) {
        const cached = this.data.get(key);
        if (cached !== undefined) {
            console.log('cache hit: size:', this.data.size)
            return cached
        }

        const inferred = cb()
        this.data.set(key, inferred)
        return inferred
    }

    public clear() {
        this.data.clear()
    }
}

export const CACHE = new CacheManager()
