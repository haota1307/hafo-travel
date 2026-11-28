export function downloadCsv(name: string, rows: string[][]) {
  const escapeCell = (text: string) => {
    const value = /^\s*[=+@-]|^[\t\r\n]/.test(text) ? "'" + text : text;

    return '"' + value.replaceAll('"', '""') + '"';
  };
  const csv = rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name + ".csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
