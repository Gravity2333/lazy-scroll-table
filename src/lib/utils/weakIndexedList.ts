type PayloadStoreage = {
  position: number;
  // hash值
  uniqueHash?: string;
};
type Tag = symbol;
type Listener<T> = (value: T[]) => void;
const _WEAK_INDEX_MARK_ = Symbol('_WEAK_INDEX_MARK_');
const _WEAK_INDEX_UNI_KEY = Symbol('_WEAK_INDEX_UNI_KEY');
export const _WEAK_INDEX_ORIGIN_ACCESS_KEY_ = Symbol('_WEAK_INDEX_ORIGIN_ACCESS_KEY_');

function generateUUID() {
  let d = new Date().getTime(); //Timestamp
  let d2 = (performance && performance.now && performance.now() * 1000) || 0; //Time in microseconds since page-load or 0 if unsupported
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = Math.random() * 16; //random number between 0 and 16
    if (d > 0) {
      //Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      //Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** 索引弱列表 */
class WeakIndexedList<T extends Record<string, any>> {
  private posWeakMap: WeakMap<T, PayloadStoreage> = new WeakMap();
  private originDataList: T[] = [];
  private tag: Tag;
  private listensers: Listener<T>[] = [];
  // 给列表项打标记，表示当前对象已经被本weakList设置索引
  private markIndexdTag = (needIndexedItem: any) => {
    if (
      typeof needIndexedItem === 'object' &&
      !Object.prototype.hasOwnProperty.call(needIndexedItem, _WEAK_INDEX_MARK_)
    ) {
      // 设置标记
      Object.defineProperty(needIndexedItem, _WEAK_INDEX_MARK_, {
        value: this.tag,
        enumerable: false,
        writable: false,
        configurable: false,
      });
    }
  };

  // 生成唯一key
  private markUniqueKey = (needIndexedItem: any) => {
    if (
      typeof needIndexedItem === 'object' &&
      !Object.prototype.hasOwnProperty.call(needIndexedItem, _WEAK_INDEX_UNI_KEY)
    ) {
      // 设置标记
      Object.defineProperty(needIndexedItem, _WEAK_INDEX_UNI_KEY, {
        value: generateUUID(),
        enumerable: false,
        writable: false,
        configurable: false,
      });
    }
  };

  //mark origin
  private markOriginAccess = (needIndexedItem: any, meatData: PayloadStoreage) => {
    if (
      typeof needIndexedItem === 'object' &&
      !Object.prototype.hasOwnProperty.call(needIndexedItem, _WEAK_INDEX_ORIGIN_ACCESS_KEY_)
    ) {
      // 设置标记
      Object.defineProperty(needIndexedItem, _WEAK_INDEX_ORIGIN_ACCESS_KEY_, {
        value: meatData,
        enumerable: false,
        writable: false,
        configurable: false,
      });
    }
  };

  private checkIndexedTag = (needIndexedItem: any) => {
    // 设置标记
    if (
      !Reflect.has(needIndexedItem, _WEAK_INDEX_MARK_) ||
      Reflect.get(needIndexedItem, _WEAK_INDEX_MARK_) !== this.tag
    ) {
      console.error('本节点没有被本WeakIndexedList管理！');
      return false;
    }

    return true;
  };

  // 更新索引
  private updateItemsIndex = (updateFromIndex: number) => {
    if (updateFromIndex >= this.len) return;
    for (let i = updateFromIndex; i < this.len; i++) {
      const needReIndexItem = this.originDataList[i];
      if (!this.posWeakMap.has(needReIndexItem)) {
        this.posWeakMap.set(needReIndexItem, { position: i });
      } else {
        const payloadStorge = this.posWeakMap.get(needReIndexItem)!;
        payloadStorge.position = i;
      }
    }
  };

  static checkComplex = (needIndexedItem: any) => {
    if (typeof needIndexedItem !== 'object') {
      throw new Error('WeakIndexedList只能对复杂类型简历索引');
    }
  };

  /**
   *
   * @param list 初始化列表
   * @param uniqueKey 是否开启唯一key
   * @param generateHash 是否生成hash
   * @param _listeners 监听函数
   */
  constructor(
    list: T[] = [],
    uniqueKey = false,
    ...listeners: Listener<T>[]
  ) {
    // 创建标记
    this.tag = Symbol('WeakIndexedList.tag');
    // 构建weakMap索引
    list.forEach((needIndexedItem) => {
      // 推入数组
      this.push(needIndexedItem, uniqueKey);
    });
    this.listensers.push(...listeners);
  }

  /** 获取长度 */
  get len() {
    return this.originDataList.length;
  }

  /** 增加元素 */
  push = (needPushedItem: T, uniqueKey = false) => {
    WeakIndexedList.checkComplex(needPushedItem);
    const metaData: PayloadStoreage = { position: this.len };
    this.posWeakMap.set(needPushedItem, metaData);
    // mark origin access
    this.markOriginAccess(needPushedItem, metaData);
    // 打标记
    this.markIndexdTag(needPushedItem);
    // 设置key
    if (uniqueKey) {
      this.markUniqueKey(needPushedItem);
    }
    // 推入数组
    this.originDataList.push(needPushedItem);
    // 触发listener
    this.trigger();
  };

  /** 批量push */
  batchPush = (needPushedItems: T[], uniqueKey = false) => {
    needPushedItems.forEach((needPushedItem) => {
      WeakIndexedList.checkComplex(needPushedItem);
      const metaData: PayloadStoreage = { position: this.len };
      this.posWeakMap.set(needPushedItem, metaData);
      // mark origin access
      this.markOriginAccess(needPushedItem, metaData);
      // 打标记
      this.markIndexdTag(needPushedItem);
      // 设置key
      if (uniqueKey) {
        this.markUniqueKey(needPushedItem);
      }
      // 推入数组
      this.originDataList.push(needPushedItem);
    });
    // 触发listener
    this.trigger();
  };

  /** 从前方增加元素 */
  unshift = (needUnshiftedItem: T) => {
    WeakIndexedList.checkComplex(needUnshiftedItem);
    // 设置索引
    this.posWeakMap.set(needUnshiftedItem, { position: 0 });
    // 打标记
    this.markIndexdTag(needUnshiftedItem);
    // 推入数组
    this.originDataList.unshift(needUnshiftedItem);
    // 更新索引
    this.updateItemsIndex(0);
    // 触发listener
    this.trigger();
  };

  /** shift 从前方削去元素 */
  shift = () => {
    if (this.len <= 0) return;
    const shiftedItem = this.originDataList.shift();
    // 更新索引
    this.updateItemsIndex(0);
    // 触发listener
    this.trigger();
    return shiftedItem;
  };

  /** pop 从后方弹出 */
  pop = () => {
    if (this.len <= 0) return;
    const popedItem = this.originDataList.pop();
    // 触发listener
    this.trigger();
    return popedItem;
  };

  /** 通过索引获取 */
  get = (index: number) => {
    return this.originDataList[index];
  };

  /** 检查是否包含元素 */
  has = (needFindItem: T) => {
    WeakIndexedList.checkComplex(needFindItem);
    if (this.checkIndexedTag(needFindItem)) {
      return this.posWeakMap.has(needFindItem);
    }
    return false;
  };

  /** 获取索引 */
  getIndex = (needFindItem: T) => {
    WeakIndexedList.checkComplex(needFindItem);
    if (this.has(needFindItem)) {
      return this.posWeakMap.get(needFindItem)?.position;
    } else {
      return -1;
    }
  };

  /** 删除元素 */
  delete = (needDeletedItem: T) => {
    WeakIndexedList.checkComplex(needDeletedItem);
    if (this.has(needDeletedItem)) {
      const needDeleteIndex = this.getIndex(needDeletedItem);
      if (needDeleteIndex !== void 0 && needDeleteIndex >= 0) {
        // 删除节点
        this.originDataList.splice(needDeleteIndex, 1);
        this.updateItemsIndex(needDeleteIndex);
        // 触发listener
        this.trigger();
      }
      return;
    }
    console.error('待删除节点不存在');
  };

  /** 删除元素通过index */
  deleteByIndex = (needDeletedIndex: number) => {
    if (needDeletedIndex >= this.len) return;
    const needDeletedItem = this.get(needDeletedIndex);
    this.delete(needDeletedItem);
    // 触发listener
    this.trigger();
    return needDeletedItem;
  };

  /** 截取子列表 */
  slice = (start?: number | undefined, end?: number | undefined) => {
    return this.originDataList.slice(start, end) as T[];
  };

  /** 获取唯一key */
  getUniqueKey = (needFindItem: T) => {
    if (needFindItem[_WEAK_INDEX_UNI_KEY as any]) {
      return needFindItem[_WEAK_INDEX_UNI_KEY as any];
    } else {
      return void 0;
    }
  };

  /** 设置监听 */
  listen = (listener: Listener<T>) => {
    this.listensers.push(listener);
  };

  /** 触发 */
  trigger = () => {
    this.listensers.forEach((listener) => {
      listener(this.originDataList);
    });
  };

  /** 获取列表数据 */
  getOriginData = () => {
    return this.originDataList;
  };
}

export default WeakIndexedList;
