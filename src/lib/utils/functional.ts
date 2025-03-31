export function pip(funcs: any[]) {
  return (input: any) => {
    return funcs.reduce((prev, curr) => {
      return curr(prev);
    }, input);
  };
}

export function compose(funcs: any[]) {
  return (input: any) => {
    return funcs.reduceRight((prev, curr) => {
      return curr(prev);
    }, input);
  };
}

export function curry(func: any, args: any[] = []) {
  return (param: any) => {
    if (args.length >= func.length - 1) {
      return func(...args, param);
    } else {
      return curry(func, [...args, param]);
    }
  };
}

export function debounce(func: any, delay: number) {
  let timeoutObj: any = "";
  return (...args: any) => {
    clearTimeout(timeoutObj);
    timeoutObj = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

export function throttle(func: any, delay: number) {
  let timeoutObj: any = "";
  return (...args: any) => {
    if (!timeoutObj) {
      func(...args);
      timeoutObj = setTimeout(() => {
        timeoutObj = "";
      }, delay);
    }
  };
}

interface ICache {
  status: "pending" | "fulfilled" | "rejected";
  data?: any;
  error?: string;
}

type IAsyncFunc = (syncFunc: any, resolve: any) => void;

/**代数效应
 * 创建一个异步处理函数
 * @param inputAsyncFunc: 异步函数
 * @return 使用该函数的异步运行函数
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function createAsyncAlgebraicEffect() {
  return function runAsync(func: IAsyncFunc) {
    return new Promise<any>((resolve) => {
      const caches: ICache[] = [];
      let workInProgressIndex = 0;
      function asyncFunc(inputAsyncFunc: () => Promise<any>, ...rest: any[]) {
        const currentCache = caches[workInProgressIndex];
        if (currentCache) {
          if (currentCache.status === "fulfilled") {
            workInProgressIndex++;
            // 缓存中存在数据 交付
            return currentCache.data;
          } else if (currentCache.status === "rejected") {
            throw new Error(currentCache.error);
          }
        } else {
          // 不存在数据，发送请求并且throw promise
          const result: ICache = {
            status: "pending",
          };
          caches[workInProgressIndex++] = result;
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
          throw inputAsyncFunc(...rest).then(
            (res: any) => {
              result.status = "fulfilled";
              result.data = res;
            },
            (err: string) => {
              result.status = "rejected";
              result.error = err;
            }
          );
        }
      }

      function handleCatch(handleFunc: IAsyncFunc) {
        try {
          handleFunc(asyncFunc, resolve);
        } catch (p) {
          if (p instanceof Promise) {
            const handleThen = () => {
              workInProgressIndex = 0;
              handleCatch(handleFunc);
            };
            p.then(handleThen, handleThen);
          }
        }
      }

      handleCatch(func);
    });
  };
}

/** 同步缓存函数类型 */
type CacheFunction<T> = (...args: any[]) => T;

/** 异步缓存函数类型 */
type AsyncCacheFuntion<T> = (...args: any[]) => Promise<T>;

/**
 * 缓存函数实现
 * @param callasync
 * @param executer
 * @returns
 */
function _cacheFnImpl<T>(
  callasync: boolean = false,
  executer: CacheFunction<T> | AsyncCacheFuntion<T>
) {
  if (typeof executer !== "function") {
    throw new Error("executer is not a function!");
  }

  /** 闭包保存缓存内容 */
  let fnResult: T | null = null;

  return (...args: any[]) => {
    if (fnResult !== null) {
      /** 命中缓存 直接返回 */
      return callasync
        ? (Promise.resolve(fnResult) as Promise<T>)
        : (fnResult as T);
    }

    /** 首次请求 */
    if (callasync) {
      /** 异步 返回promise */
      return new Promise((resolve) => {
        resolve(executer(...args));
      }).then((resFromExecutor: any) => {
        fnResult = resFromExecutor;
        return fnResult;
      }) as Promise<T>;
    }

    /** 同步函数 直接返回 */
    fnResult = executer(...args) as T;
    return fnResult as T;
  };
}

/** 同步缓存高阶函数
 * @param executor 同步执行器函数
 * @returns 同步缓存函数
 */
export const cacheFn = _cacheFnImpl.bind(null, false) as <T>(
  executor: CacheFunction<T>
) => CacheFunction<T>;

/** 异步缓存高阶函数
 * @param executor 异步执行器函数
 * @returns 异步缓存函数
 */
export const cacheFnAsync = _cacheFnImpl.bind(null, true) as unknown as <T>(
  executor: AsyncCacheFuntion<T>
) => AsyncCacheFuntion<T>;

// TrieNode 类定义
class TrieNode {
  children: Record<string, TrieNode>;
  items: { key: string; value: string }[];

  constructor() {
    this.children = {};
    this.items = [];
  }
}

// Trie 类定义
class Trie {
  root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  // 插入字符串和相关的项 (key, value)
  insert(value: string, key: string) {
    let node = this.root;

    // 遍历 value 中的字符，建立 Trie 结构
    for (const char of value.toLowerCase()) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }

    // 将项 (key, value) 存储在该节点
    node.items.push({ key, value });
  }

  // 根据前缀搜索匹配的项
  search(prefix: string): { key: string; value: string }[] {
    let node = this.root;

    // 遍历前缀字符串
    for (const char of prefix.toLowerCase()) {
      if (!node.children[char]) {
        return []; // 如果没有匹配的子节点，返回空数组
      }
      node = node.children[char];
    }

    return this._collect(node); // 查找所有匹配的项
  }

  // 收集从当前节点出发的所有项
  private _collect(node: TrieNode): { key: string; value: string }[] {
    let items = [...node.items];
    for (const child of Object.values(node.children)) {
      items = [...items, ...this._collect(child)];
    }
    return items;
  }
}

/** 高阶函数 前缀搜索方法 */
export const prefixSearch = async (
  requestData: () => Promise<any>,
  requestDataHandler: (requestData: any) => any = ({
    success,
    result,
  }: any) => {
    if (success) {
      return result;
    }
    return {};
  }
) => {
  // 构建 Trie 树并插入数据
  const _buildTrie = (data: Record<string, string>): Trie => {
    const trie = new Trie();

    for (const [key, value] of Object.entries(data)) {
      trie.insert(value, key); // 将 value 插入 Trie 树中，key 是关联的数据
    }

    return trie;
  };

  // 根据前缀搜索并返回匹配的对象
  const _searchTrie = (
    trie: Trie,
    searchString: string = ""
  ): Record<string, string> => {
    const results = trie.search(searchString);

    // 将结果转换为对象格式
    const resultObj: Record<string, string> = {};
    results.forEach(({ key, value }) => {
      resultObj[key] = value;
    });

    return resultObj;
  };

  return async (searchString: string) => {
    const _trie = _buildTrie(requestDataHandler(await requestData()));
    return _searchTrie(_trie, searchString);
  };
};
