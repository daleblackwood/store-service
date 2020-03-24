declare namespace utils {
    /**
     * Looks up the dot path of an object
     * @param obj the object to look at
     * @param path the dot path to retreive
     */
    function lookup<T = any>(obj: any, path: string): T | null;
    /**
     * sets a value on an arbitrary object
     * @param obj
     * @param path
     * @param value
     */
    function set(obj: any, path: string, value: any): void;
    /**
     * converts an alpha-numeric string to PascalCase for dictionary indexing
     * @param key key a string for converting to PascalCase
     * @returns a PascalCase string
     */
    function pascalCase(key: string): string;
    /**
     * @returns true if string is pascal case
     */
    function isPascalCase(s: string): boolean;
    /**
     * @returns true if string `is.a.dot.path`
     */
    function isDotPath(s: string): boolean;
    /**
     * checks to see if objects are equivalent up to a certain depth
     * uses strict equality under the specified depth
     * @param a the first of the two objects to compare
     * @param b the second of the two objects to compare
     * @param depth the depth to compare
     */
    function objectsMatch(a: any, b: any, depth?: number): boolean;
    /**
     * converts an arbitrary alpha-numeric string into an
     * array of words
     * @param key a string for converting to words
     * @returns an array of words
     */
    function toWords(key: string): string[];
}
export = utils;
