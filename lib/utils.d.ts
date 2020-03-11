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
/**
 * @returns true if string `is.a.dot.path`
 */
export declare function isDotPath(s: string): boolean;
/**
 * checks to see if objects are equivalent up to a certain depth
 * uses strict equality under the specified depth
 * @param a the first of the two objects to compare
 * @param b the second of the two objects to compare
 * @param depth the depth to compare
 * @returns true if the object structures match
 */
export declare function valuesMatch(src: any, dest: any, depth?: number): boolean;
/**
 * Calculates the difference between two object/value structures
 * @param src the first state of the object/value
 * @param dest the second state of the object/value
 * @param depth the depth to compare, performs reference match beyond depth
 * @returns the structured differences, new value or undefined if the same
 */
export declare function valueDiff(src: any, dest: any, depth?: number): any;
/**
 * converts an arbitrary alpha-numeric string into an
 * array of words
 * @param key a string for converting to words
 * @returns an array of words
 */
export declare function toWords(key: string): string[];
