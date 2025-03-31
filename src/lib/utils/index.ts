export const parseCSVFile = async <T>(file: File, titles: string[]): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      if (!event.target?.result) {
        reject(new Error("读取文件失败"));
        return;
      }

      const csvText = event.target.result as string;

      // 处理换行符（兼容 Windows 的 \r\n）
      const rows = csvText
        .split(/\r?\n/)
        .map((row) => row.trim())
        .filter((row) => row !== "");

      if (rows.length <= 1) {
        reject(new Error("CSV 文件没有数据"));
        return;
      }

      // 忽略第一行（表头），只解析数据行
      const dataRows = rows.slice(1);

      // 解析数据行
      const data = dataRows.map((row) => {
        const values = row.split(",").map((value) => value.trim());
        return Object.fromEntries(titles.map((title, index) => [title, values[index] || ""]));
      }) as unknown as T[];

      resolve(data);
    };

    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsText(file);
  });
};

export const exportToCSV = (data: Record<string, any>[], headers: string[], filename: string = "data.csv") => {
  if (data.length === 0) {
    console.warn("数据为空，无法导出 CSV");
    return;
  }

  const csvRows: string[] = [];

  // 添加数据行（直接转换 data 数组，不加引号）
  data.forEach(row => {
    const values = Object.values(row).map(value => String(value||"").replace(/"/g, '""')); // 处理特殊字符
    csvRows.push(values.join(",")); 
  });

  // 添加表头（第一行）
  if(headers?.length >0){
    csvRows.unshift(headers.join(",")); 
  }

  // 生成 CSV 字符串
  const csvString = csvRows.join("\n");

  // 创建 Blob 并生成下载链接
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;

  // 触发下载
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
