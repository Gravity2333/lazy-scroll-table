import { debounce } from "@/lib/utils/functional";
import WeakIndexedList from "@/lib/utils/weakIndexedList";
import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { unstable_batchedUpdates } from "react-dom";
import type { LazyScrollOperate, LazyScrollTableColumm } from "./typings";
import styles from "./index.less";
// import { Button, message, Popconfirm, Spin } from "antd";
// import {
//   DownloadOutlined,
//   MinusCircleOutlined,
//   PlusOutlined,
// } from "@ant-design/icons";
import { exportToCSV, parseCSVFile } from "./utils";
import Button from "./components/Button";
import { DownloadOutlined, MinusCircleOutlined, PlusOutlined } from "./components/icons";
import useRefresh from "./hooks/useRefresh";
import message from "./utils/message";
import Popconfirm from "./components/PopConfirm";
// import Import from "../Import";

const __DEV__ = process.env.NODE_ENV === "development";
/** 虚拟滚动表格 */
// 批量导入配置
type ImportBatchConfig = {
  /** 导入时替换header内容 */
  headerReplaceList: string[];
  /** 模板下载地址 */
  tempDownloadUrl: string;
};

// 批量导出配置
type ExportBatchConfig = {
  /** 导出时替换header内容 */
  headerReplaceList: string[];
  /** export文件名称 */
  exportFileName: string;
};

type LazyScrollTableProps<T> = {
  value?: T[];
  onChange?: (e: T[]) => void;
  /** 最大支持行数 */
  maxRows?: number;
  /** 批量导入模式 */
  importBatchConfig?: ImportBatchConfig | false;
  /** 批量导出配置 */
  exportBatchConfig?: ExportBatchConfig | false;
  /* 表格列 */
  columns: LazyScrollTableColumm<T>[];
  /** onDelete 删除回调 */
  onDelete?: (e: T) => void;
  /** onAdd 增加回调 */
  onAdd?: (e: T) => void;
  /** 显示总数 */
  showTotal?: boolean;
  /** 显示回到顶部/底部按钮 */
  showReturnBtn?: boolean;
  /** 展示Add按钮 */
  showAddBtn?: boolean;
  /** 是否可删除 */
  allowDelete?: boolean;
  /** 滚动窗口尺寸, 默认10条 */
  windowSize?: number;
  /** rowHeight 行高 默认40px */
  rowHeight?: number;
  /** 预先渲染长度 默认50行 */
  preRenderRows?: number;
  /** 自动更新 默认开启状态，如果需要使用外部状态（form表单）驱动更新，请设置false */
  autoRefresh?: boolean;
};

/** 行属性 */
type LazyScrollTableRowProps<T> = {
  rowData: T;
  columns: LazyScrollTableColumm<T>[];
  index: number;
  allowDelete?: boolean;
};

interface ShareContextType extends LazyScrollOperate {}

/** 共享Context */
const ShareContext = createContext<ShareContextType>({} as any);

/** 每一条高度 */
const DEFAULT_ROW_HEIGHT = 40;

/** 默认滚动区域条目数量 */
const DEFAULT_WINDOW_SIZE = 10;

/** PRE_RENER 预先渲染数量 */
const DEFAULT_VRITUAL_SCROLL_PRE_RENDER_NUM = 50;

/** 默认最大滚动数量 */
const DEFAULT_ROW_MAX_COUNT = 10000;

/** 滚动方向 */
enum E_SCROLL_DIRECTION {
  BOTTOM = "bottom",
  TOP = "top",
}

const LazyScrollTableRow = React.memo(
  <T extends Record<string, any>>(props: LazyScrollTableRowProps<T>) => {
    const { rowData, columns, index, allowDelete = true } = props;
    const { addRow, changeRow, deleteRow } = useContext(ShareContext);
    const [loading, startTransition] = useTransition();
    return (
      <div className={styles["lazy-scroll-table__row"]}>
        <span className={styles["lazy-scroll-table__row__index"]}>
          {index + 1}
        </span>
        <div className={styles["lazy-scroll-table__row__center"]}>
          {columns.map((column) => {
            return (
              <div className={styles["lazy-scroll-table__row__center__cell"]}>
                {column.cellRender
                  ? column.cellRender(rowData[column.dataIndex], rowData, {
                      addRow,
                      changeRow,
                      deleteRow,
                    })
                  : rowData[column.dataIndex]}
              </div>
            );
          })}
        </div>
        <span
          className={styles["lazy-scroll-table__row__tool"]}
          onClick={() => {
            deleteRow(rowData);
          }}
        >
          {allowDelete
            ? (() => {
                if (loading) return "loading...";
                return <MinusCircleOutlined style={{ cursor: "pointer" }} />;
              })()
            : null}
        </span>
      </div>
    );
  }
) as <T extends Record<string, any>>(
  props: LazyScrollTableRowProps<T>
) => JSX.Element;

function LazyScrollTable<T extends Record<string, any>>(
  props: LazyScrollTableProps<T>
) {
  const {
    columns = [],
    value = [],
    onChange = () => {
      if (__DEV__) {
        console.error(
          "LazyScrollTable组件错误，是否未传递onChange函数或忘记放入到FormItem中"
        );
      }
    },
    onDelete = () => {
      if (__DEV__) {
        console.error("LazyScrollTable组件错误，是否未传递onDelete函数");
      }
    },
    onAdd = () => {
      if (__DEV__) {
        console.error("LazyScrollTable组件错误，是否未传递onAdd函数");
      }
    },
    maxRows = DEFAULT_ROW_MAX_COUNT,
    importBatchConfig = {
      headerReplaceList: [],
      tempDownloadUrl: "",
    },
    exportBatchConfig = {
      headerReplaceList: [],
      exportFileName: "表格行",
    },
    showTotal = true,
    showReturnBtn = true,
    showAddBtn = true,
    allowDelete = true,
    windowSize = DEFAULT_WINDOW_SIZE,
    rowHeight = DEFAULT_ROW_HEIGHT,
    preRenderRows = DEFAULT_VRITUAL_SCROLL_PRE_RENDER_NUM,
    autoRefresh = true,
  } = props;
  const virtualScrllHeight = windowSize * rowHeight;
  const { refresh } = useRefresh();
  /** 使用weakIndexedList维护大量Row Data 可以快速找到索引 完成删除 修改等操作 */
  const weakIndexedList = useRef<WeakIndexedList<T>>(
    new WeakIndexedList<T>(value || [], true, (newTuplues) => {
      if (autoRefresh) {
        refresh();
      }
      onChange([...newTuplues]);
    })
  );
  /** 默认初始化Row Value */
  const initialRowValue = useMemo(() => {
    return columns.reduce((memo, column) => {
      memo[column.dataIndex] = void 0;
      return memo;
    }, {});
  }, [columns]);
  /** 内容区域Ref */
  const contentRef = useRef<any>();
  /** 展示窗口开始指针 */
  const displayWindowStart = useRef<number>(0);
  /** 渲染区域开始指针 */
  const [renderAreaStart, setRenderAreaStart] = useState<number>(0);
  /** 渲染区域结束指针 */
  const [renderAreaEnd, setRenderAreaEnd] = useState<number>(preRenderRows);
  /** transition hooks */
  const [, commonStartTransition] = useTransition();
  /** 上传数据loading */
  const [upLoadTuplueLoading, startUpLoadTuplueTransition] = useTransition();
  /** 更新渲染区 */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateRenderArea = useCallback(
    (direction: E_SCROLL_DIRECTION) => {
      const showStart = displayWindowStart.current;
      const showEnd = displayWindowStart.current + windowSize;
      if (
        (direction === E_SCROLL_DIRECTION.TOP &&
          showStart < renderAreaStart + (1 / 2) * preRenderRows) ||
        (direction === E_SCROLL_DIRECTION.BOTTOM &&
          showEnd > renderAreaEnd - (1 / 2) * preRenderRows)
      ) {
        const _start = displayWindowStart.current - preRenderRows;
        const _end = displayWindowStart.current + preRenderRows;
        // 注意这个大坑 React17 版本在 事件处理函数 或 生命周期方法 内才会批量更新
        // React18 采用lane模型之后才能做到任意位置批量更新
        // 所以这里设置区域位置的两个setter会被拆分到两个更新中，导致
        // 如果 当前位置为 50 -100 如果向下滑动到 1000
        // 第一次更新 1000 - 100
        // 第二次更新 1000 - 1100 这样会导致数组空一次，导致所有的已经渲染的子节点重新渲染
        // 如果当前位置为 8000 向上滚动到 1000 此时
        // 第一次更新 1000 - 8000
        // 第二次更新 1000-1100
        // 第一次就会渲染7000个组件 导致页面卡死！
        commonStartTransition(() => {
          unstable_batchedUpdates(() => {
            setRenderAreaStart(_start <= 0 ? 0 : _start);
            setRenderAreaEnd(
              _end >= weakIndexedList.current.len
                ? weakIndexedList.current.len
                : _end
            );
          });
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [renderAreaEnd, renderAreaStart]
  );
  /** 虚拟滚动展示的item */
  const renderAreaItems = useMemo(() => {
    return weakIndexedList.current?.slice(renderAreaStart, renderAreaEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderAreaEnd, renderAreaStart, weakIndexedList.current?.len]);

  /** 滚动区域高度 */
  const getScrollAreaHeight = () => {
    return weakIndexedList.current.len * rowHeight;
  };

  /**滚动到  顶部 / 底部  */
  const scrollTo = (direction: E_SCROLL_DIRECTION) => {
    switch (direction) {
      case E_SCROLL_DIRECTION.TOP:
        contentRef.current.scrollTop = 0;
        displayWindowStart.current = 0;
        updateRenderArea(E_SCROLL_DIRECTION.TOP);
        return;
      case E_SCROLL_DIRECTION.BOTTOM:
        const topDistance = (contentRef.current?.scrollHeight || 0) + rowHeight;
        if (contentRef.current?.scrollTop !== void 0) {
          contentRef.current.scrollTop = topDistance;
        }
        displayWindowStart.current = Math.floor(topDistance / rowHeight);
        updateRenderArea(E_SCROLL_DIRECTION.BOTTOM);
        return;
    }
  };

  /** 新增 Row */
  const addRow = useCallback(() => {
    const newRow = { ...initialRowValue } as any;
    weakIndexedList.current.push(newRow, true);
    onAdd(newRow);
    setTimeout(() => {
      scrollTo(E_SCROLL_DIRECTION.BOTTOM);
    }, 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 修改 Row */
  const changeRow = useCallback(
    (toBeChangedTupe: T, changeKey: string, newValue: string) => {
      Reflect.set(toBeChangedTupe, changeKey, newValue);
      weakIndexedList.current.trigger();
    },
    []
  );

  /** 删除Rows */
  const deleteRow = useCallback(
    (tobeDeletedItem: T) => {
      weakIndexedList.current.delete(tobeDeletedItem);
      onDelete(tobeDeletedItem);
    },
    [onDelete]
  );

  /** 共享value
   *  这里注意一下 Provider的vlue不要直接写成 value ={{}} 这样会导致子组件无意义的渲染
   *  请缓存value，子组件多的情况下，会导致渲染性能急剧下降
   */
  const SharedValue: ShareContextType = useMemo(() => {
    return {
      addRow,
      changeRow,
      deleteRow,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 导入函数 */
  const importFn: (formData: any, handleCloseModal: () => void) => void =
    useCallback(
      (formData, _closeModal) => {
        startUpLoadTuplueTransition(() => {
          const dataList = [];
          for (const [, fileObj] of formData.entries()) {
            dataList.push(fileObj);
          }
          const file = dataList[0];
          if (!file) {
            // message.error("文件读取失败！");
            return;
          }
          // message.loading("导入中...");
          (async () => {
            try {
              const fileData =
                (await parseCSVFile<T>(
                  file,
                  (importBatchConfig as ImportBatchConfig).headerReplaceList
                )) || [];
              const totalLen = weakIndexedList.current.len + fileData?.length;
              const canUpdateLen = maxRows - weakIndexedList.current.len;
              if (canUpdateLen <= 0) {
                throw new Error(`行数量超过限制！`);
              }
              weakIndexedList.current.batchPush(
                fileData.slice(0, canUpdateLen),
                true
              );
              if (totalLen > maxRows) {
                message.info({
                  content: `行数量超过限制，已加载前${canUpdateLen}条！`,
                });
              } else {
                message.success({ content: `导入成功！` });
              }
              _closeModal();
            } catch (err: any) {
              message.error({ content: err?.message });
            }
          })();
        });
      },
      [importBatchConfig, maxRows, startUpLoadTuplueTransition]
    );

  /** 注册scroll时间，注意这里需要使用useLayoutEffect 才能保证拿到Ref */
  useLayoutEffect(() => {
    if (contentRef.current) {
      const handleScroll = debounce((e: any) => {
        e.preventDefault();
        e.stopPropagation();
        const scrollTop = e.target.scrollTop;
        if (scrollTop >= getScrollAreaHeight()) return;
        const startIndex = Math.floor(scrollTop / rowHeight);
        const direction =
          startIndex >= displayWindowStart.current
            ? E_SCROLL_DIRECTION.BOTTOM
            : E_SCROLL_DIRECTION.TOP;
        displayWindowStart.current = startIndex;
        updateRenderArea(direction);
      }, 50);
      contentRef.current.addEventListener("scroll", handleScroll);
      return () => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        contentRef.current?.removeEventListener("scroll", handleScroll);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateRenderArea]);

  return (
    <>
      <style>
        {`
        .${styles["lazy-scroll-table"]}{
           --window-height: ${virtualScrllHeight}px;
           --item-height: ${rowHeight}px;
        }
        `}
      </style>
      <div
        className={`${styles["lazy-scroll-table"]} ${
          weakIndexedList.current.len === 0
            ? styles["lazy-scroll-table__empty"]
            : ""
        }`}
      >
        <header
          className={`${styles["lazy-scroll-table__header"]} ${
            weakIndexedList.current.len === 0
              ? styles["lazy-scroll-table__header__hide"]
              : ""
          }`}
        >
          <span
            key={"lazy-scroll-index-key"}
            className={styles["lazy-scroll-table__header__left"]}
          >
            #
          </span>
          <span className={styles["lazy-scroll-table__header__center"]}>
            {columns.map((column) => (
              <span
                key={column.dataIndex}
                className={styles["lazy-scroll-table__header__center__item"]}
              >
                {column.title}
              </span>
            ))}
          </span>
          <span
            key={"lazy-scroll-operate-key"}
            className={styles["lazy-scroll-table__header__right"]}
          >
            {showReturnBtn ? (
              <span
                className={styles["quick-to-top-btn"]}
                onClick={scrollTo.bind(null, E_SCROLL_DIRECTION.TOP)}
              />
            ) : null}
          </span>
        </header>
        <ShareContext.Provider value={SharedValue}>
          <div
            ref={contentRef}
            className={`${styles["lazy-scroll-table__content"]} `}
          >
            {weakIndexedList?.current?.len !== 0 ? (
              <div className={styles["lazy-scroll-table__content__loading"]}>
                <div className={styles.loadingContainer}>
                  <div className={styles.loader}>
                    <span />
                    <span />
                    <span />
                  </div>
                  {<span className={styles.text}>数据加载中</span>}
                </div>
              </div>
            ) : (
              ""
            )}
            <div
              style={{ height: `${getScrollAreaHeight()}px` }}
              className={styles["lazy-scroll-table__content__vritual-scroll"]}
            >
              <div
                id={"virtual-placeholder"}
                key="virtual-placeholder"
                className={styles["virtual-placeholder"]}
                style={{
                  marginTop: `${rowHeight * renderAreaStart}px`,
                }}
              />
              {renderAreaItems.map((item) => {
                return (
                  <LazyScrollTableRow<T>
                    index={weakIndexedList.current.getIndex(item) || 0}
                    rowData={item}
                    columns={columns}
                    key={weakIndexedList.current.getUniqueKey(item)}
                    allowDelete={allowDelete}
                  />
                );
              })}
            </div>
          </div>
          <footer
            className={`${styles["lazy-scroll-table__footer"]} ${
              weakIndexedList.current.len === 0
                ? styles["lazy-scroll-table__footer__empty"]
                : ""
            }`}
          >
            <div className={`${styles["lazy-scroll-table__footer__center"]}`}>
              {/* eslint-disable-next-line no-nested-ternary */}
              {showAddBtn ? (
                weakIndexedList.current.len < maxRows ? (
                  <Button type="primary" size="small" onClick={addRow}>
                    <PlusOutlined /> 新增
                  </Button>
                ) : (
                  <Button type="primary" size="small" disabled>
                    最多可增加{maxRows}个
                  </Button>
                )
              ) : null}
              {importBatchConfig !== false &&
              typeof importBatchConfig === "object" ? (
                <>
                  {/* <Import
                    loading={upLoadTuplueLoading}
                    modalTitle={`导入`}
                    buttonProps={{
                      size: "small",
                    }}
                    disabled={weakIndexedList.current.len >= maxRows}
                    customImportFunc={importFn}
                    tempDownloadUrl={
                      (importBatchConfig as ImportBatchConfig).tempDownloadUrl
                    }
                  /> */}
                </>
              ) : (
                <></>
              )}
              {exportBatchConfig !== false &&
              typeof exportBatchConfig === "object" ? (
                <Button
                  size="small"
                  disabled={weakIndexedList.current?.len <= 0}
                  onClick={() => {
                    const originDataList =
                      weakIndexedList.current.getOriginData();
                    exportToCSV(
                      originDataList,
                      (exportBatchConfig as ExportBatchConfig)
                        .headerReplaceList,
                      (exportBatchConfig as ExportBatchConfig).exportFileName
                    );
                  }}
                >
                  <DownloadOutlined /> 导出
                </Button>
              ) : null}
            </div>
            {showTotal ? (
              <div
                className={`${styles["lazy-scroll-table__footer__left"]} ${
                  weakIndexedList.current.len === 0
                    ? styles["lazy-scroll-table__footer__left__empty"]
                    : ""
                }`}
              >
                <span>总数: {weakIndexedList.current.len}</span>
              </div>
            ) : null}

            <div
              className={`${styles["lazy-scroll-table__footer__right"]} ${
                weakIndexedList.current.len === 0
                  ? styles["lazy-scroll-table__footer__right__empty"]
                  : ""
              }`}
            >
              {showReturnBtn ? (
                <span
                  className={styles["quick-to-bottom-btn"]}
                  onClick={scrollTo.bind(null, E_SCROLL_DIRECTION.BOTTOM)}
                />
              ) : null}
            </div>
          </footer>
        </ShareContext.Provider>
      </div>
    </>
  );
}

export default React.memo(LazyScrollTable);
