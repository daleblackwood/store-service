/**
 * Looks up the dot path of an object
 * @param obj the object to look at
 * @param path the dot path to retreive
 */
export declare function lookup<T = any>(obj: any, path: string): T | null;
/**
 * sets a value on an arbitrary object
 * @param obj
 * @param path
 * @param value
 */
export declare function set(obj: any, path: string, value: any): void;
/**
 * converts an alpha-numeric string to PascalCase for dictionary indexing
 * @param key key a string for converting to PascalCase
 * @returns a PascalCase string
 */
export declare function pascalCase(key: string): string;
/**
 * @returns true if string is pascal case
 */
export declare function isPascalCase(s: string): boolean;
export declare function isDotPath(s: string): boolean;
export declare function objectsMatch(a: any, b: any, depth?: number): boolean;
