/**
 * Looks up the dot path of an object
 * @param obj the object to look at
 * @param path the dot path to retreive
 */
export function lookup<T = any>(obj: any, path: string): T|null {
  if (path.match(/\s/)) {
    throw new Error("Invalid object path " + path);
  }
  let result = obj;
  if (obj) {
    const pathBits = path.trim().split(".");
    for (const pathBit of pathBits) {
      result = result[pathBit];
      if (!result) {
        break;
      }
    }
  }
  return typeof result !== "undefined" ? result : null;
}

/**
 * sets a value on an arbitrary object
 * @param obj
 * @param path
 * @param value
 */
export function set(obj: any, path: string, value: any) {
  if (isDotPath(path) === false) {
    throw new Error("Invalid object path " + path);
  }
  const lastDotI = path.lastIndexOf(".");
  let key = path;
  if (lastDotI >= 0) {
    const subpath = path.substr(0, lastDotI);
    key = path.substr(lastDotI + 1);
    obj = lookup(obj, subpath);
  }
  if (!obj) {
    throw new Error("Can't set property on object at path " + path);
  }
  obj[key] = value;
}

const CCA = "a".charCodeAt(0);
const CCZ = "z".charCodeAt(0);
const CC0 = "0".charCodeAt(0);
const CC9 = "9".charCodeAt(0);
function isAlphaNum(c: string) {
  const n = c.charCodeAt(0);
  return (n >= CC0 && n <= CC9) || (n >= CCA && n <= CCZ);
}

/**
 * converts an alpha-numeric string to PascalCase for dictionary indexing
 * @param key key a string for converting to PascalCase
 * @returns a PascalCase string
 */
export function pascalCase(key: string) {
  return toWords(key).map(w => (
    w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()
  )).join("");
}

/**
 * @returns true if string is pascal case
 */
export function isPascalCase(s: string) {
  return s === pascalCase(s);
}

/**
 * @returns true if string `is.a.dot.path`
 */
export function isDotPath(s: string) {
  return !s.match(/[^0-9A-Za-z\.]/);
}

/**
 * checks to see if objects are equivalent up to a certain depth
 * uses strict equality under the specified depth
 * @param a the first of the two objects to compare
 * @param b the second of the two objects to compare 
 * @param depth the depth to compare
 * @returns true if the object structures match
 */
export function valuesMatch(src: any, dest: any, depth = 3) {
  return valueDiff(src, dest, depth) === undefined;
}

function consolodateKeys(...objs: Array<Record<string, any>>) {
  const keys: any = {};
  for (const obj of objs) {
    if (!obj || typeof obj !== "object") {
      throw new Error("Non-object value");
    }
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        keys[key] = true;
      }
    }
  }
  const result: string[] = [];
  for (const key in keys) {
    result.push(key);
  }
  return result;
}

/**
 * Calculates the difference between two object/value structures
 * @param src the first state of the object/value
 * @param dest the second state of the object/value
 * @param depth the depth to compare, performs reference match beyond depth
 * @returns the structured differences, new value or undefined if the same
 */
export function valueDiff(src: any, dest: any, depth = 3): any {
  if (typeof src === "string" || typeof src === "number" || typeof src === "boolean") {
    return src === dest ? undefined : dest;
  }
  if (typeof src === "function" || src instanceof Date) {
    return String(src) === String(dest) ? undefined : dest;
  }
  if ((src === null) !== (dest === null)) {
    return dest;
  }
  if (typeof src === "object") {
    if (typeof dest !== "object") {
      return dest;
    }

    const result: Record<string, any> = {};

    const allKeys = consolodateKeys(src, dest);
    for (const key of allKeys) {
      if (src.hasOwnProperty(key) === false) {
        result[key] = dest[key];
        continue;
      }
      if (dest.hasOwnProperty(key) === false) {
        result[key] = undefined;
        continue;
      }
      if (depth > 0) {
        const subdif = valueDiff(src[key], dest[key], depth - 1);
        if (subdif) {
          result[key] = subdif;
          continue;
        }
      } else {
        if (src[key] !== dest[key]) {
          result[key] = dest[key];
          continue;
        }
      }
    }
    if (consolodateKeys(result).length > 0) {
      return result;
    }
  }
  return undefined;
}

/**
 * converts an arbitrary alpha-numeric string into an
 * array of words
 * @param key a string for converting to words
 * @returns an array of words
 */
export function toWords(key: string) {
  if (typeof key !== "string") {
    throw new Error("Invalid key string " + key);
  }
  const result = [];
  let word = "";
  for (let i = 0; i < key.length; i++) {
    const c = key.charAt(i);
    if (!isAlphaNum(c.toLowerCase())) {
      continue;
    }
    word += c;
    const p = key.charAt(i + 1);
    if (word.length > 0 && isAlphaNum(c) && !isAlphaNum(p)) {
      result.push(word);
      word = "";
    }
  }
  return result;
}
