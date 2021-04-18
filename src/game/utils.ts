export function clone<T>(obj: T) : T {
    if (typeof obj !== "object") return obj;
    if (typeof (Object.getPrototypeOf(obj).clone) == "function") 
        return Object.getPrototypeOf(obj).clone.call(obj);
    if (obj == null) return null;
    return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj as unknown as object) as T;
}

export type Object<K, V> =
    K extends number ? {[key: number]: V} :
    K extends string ? {[key: string]: V} : {[key: string]: V, [key: number]: V};

export function objectFrom<K, V>(entries: Iterable<[K, V]>) : Object<K, V> {
    let obj = {} as unknown;
    for (let [key, value] of entries) {
        obj[key] = value;
    }
    return obj as Object<K, V>;
}

export function toJSON<T>(this: T, force?: boolean) : object {
    if (this == null) return null;

    if (this instanceof Set) {
        return Array.from(this) as object;
    }

    if (this instanceof Map) {
        return objectFrom(this) as object;
    }

    if ((this as any).toJSON == toJSON || force) {
        let obj = {} as any;
        for (let key in this) {
            if (this[key] instanceof Function) continue;
            obj[key] = toJSON.call(this[key]);
        }
        return obj as object;
    }

    return this as unknown as object;
}

export class DefaultMap<K, V> extends Map<K, V> {
    default: V
    constructor(default_: V) {
        super();
        this.default = default_;
    }

    get(key: K): V {
        if (this.has(key)) return super.get(key);
        return clone(this.default);
    }
}

export function xhr(method: string, url: string) : Promise<string> {
    return new Promise(function(resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.onload = function() {
            resolve(xhr.responseText);
        }
        xhr.onerror = function() {
            reject();
        }
        xhr.open(method, url);
        xhr.send();
    });
}

export function objectID(object: any) : string {
    if (!("__uniqueID" in object)) {
        let uniqueID = Math.random().toString(36).slice(2);
        Object.defineProperty(object, "__uniqueID", {
            get: function() {
                return uniqueID;
            },
            enumerable: false,
        });
    }

    return object.__uniqueID;
}

import * as store from 'svelte/store';
export function storageStore<T>(key: string, defaultValue: T): store.Writable<T> {
    if (typeof localStorage == "undefined") {
        return store.writable<T>(defaultValue);
    }
    let s = store.writable<T>(localStorage.get(key) || defaultValue);

    s.subscribe(function(value) {
        localStorage.set(key, value);
    })
    return s;
}