export interface LazyScrollTableColumm<T> {
  title: JSX.Element | string;
  dataIndex: string;
  cellRender: (text: any, record: T, operates: LazyScrollOperate) => JSX.Element;
}

export interface LazyScrollOperate {
  addRow: () => void;
  changeRow: (toBeChangedTupe: any, changeKey: string, newValue: string) => void;
  deleteRow: (tobeDeletedItem: any) => void;
}
