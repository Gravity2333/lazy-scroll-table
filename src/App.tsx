// 规则最大的条数限制
export const TUPLE_MAX_COUNT = 10000;

const testColumns: LazyScrollTableColumm<Record<string, any>>[] = [
    {
      title: '源IP',
      dataIndex: 'sourceIp',
      cellRender: (text: any, record, { changeRow }) => {
        return (
          <input
            defaultValue={record.sourceIp}
            placeholder=""
            onChange={debounce((e: any) => {
              changeRow(record, 'sourceIp', e.target.value);
            }, 500)}
          />
        );
      },
    },
    {
      title: '源端口',
      dataIndex: 'sourcePort',
      cellRender: (text: any, record, { changeRow }) => {
        return (
          <input
            min="0"
            max="65535"
            style={{ width: '100%' }}
            defaultValue={record.sourcePort}
            placeholder=""
            onChange={debounce((e: any) => {
              changeRow(record, 'sourcePort', e);
            }, 500)}
          />
        );
      },
    },
    {
      title: '目的IP',
      dataIndex: 'destIp',
      cellRender: (text: any, record, { changeRow }) => {
        return (
          <input
            defaultValue={record.destIp}
            placeholder=""
            onChange={debounce((e: any) => {
              changeRow(record, 'destIp', e.target.value);
            }, 500)}
          />
        );
      },
    },
    {
      title: '目的端口',
      dataIndex: 'destPort',
      cellRender: (text: any, record, { changeRow }) => {
        return (
          <input
            min="0"
            max="65535"
            style={{ width: '100%' }}
            defaultValue={record.destPort}
            placeholder=""
            onChange={debounce((e: any) => {
              changeRow(record, 'destPort', e);
            }, 500)}
          />
        );
      },
    },
  ]

import LazyScrollTable from './lib/index'
import { LazyScrollTableColumm } from './lib/typings';
import { debounce } from './lib/utils/functional';
export default function App(){
    return <LazyScrollTable 
    maxRows={TUPLE_MAX_COUNT}
    columns={testColumns}/>
}