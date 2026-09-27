import * as React from "react";

export interface ChartDataTableProps {
  caption: string;
  columns: readonly string[];
  rows: ReadonlyArray<ReadonlyArray<React.ReactNode>>;
}

/**
 * Tabela com os dados do gráfico, só para leitores de tela: a identidade das
 * séries nunca depende apenas da cor e os valores ficam acessíveis sem hover.
 */
export function ChartDataTable({ caption, columns, rows }: ChartDataTableProps) {
  if (!rows.length) return null;
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) =>
              cellIndex === 0 ? (
                <th key={cellIndex} scope="row">
                  {cell}
                </th>
              ) : (
                <td key={cellIndex}>{cell}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
