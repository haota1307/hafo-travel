import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
import { constructTable } from "@tanstack/react-table";

const requireTable = createRequire(
  import.meta.resolve("@tanstack/react-table"),
);
const { storeReactivityBindings } = requireTable(
  "@tanstack/table-core/store-reactivity-bindings",
);
const source = readFileSync(
  new URL(
    "../template/components/data-table/table-features.ts",
    import.meta.url,
  ),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const code = outputText.replace(
  /from (['"])@tanstack\/react-table\1/g,
  `from ${JSON.stringify(import.meta.resolve("@tanstack/react-table"))}`,
);
const { templateTableFeatures } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
);

test("Template table preserves sorting, filtering, pagination, faceting and selection on v9", () => {
  const table = constructTable({
    features: {
      ...templateTableFeatures,
      coreReactivityFeature: storeReactivityBindings(),
    },
    columns: [{ accessorKey: "name" }, { accessorKey: "rank" }],
    data: [
      { name: "Alpha", rank: 3 },
      { name: "Beta", rank: 1 },
      { name: "Gamma", rank: 2 },
    ],
    initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
    autoResetPageIndex: false,
  });
  const names = () =>
    table.getRowModel().rows.map((row) => row.getValue("name"));
  assert.deepEqual(names(), ["Alpha", "Beta"]);

  table.setSorting([{ id: "rank", desc: false }]);
  assert.deepEqual(names(), ["Beta", "Gamma"]);
  table.setPageIndex(1);
  assert.deepEqual(names(), ["Alpha"]);

  table.setPageIndex(0);
  table.getColumn("name").setFilterValue("Beta");
  assert.deepEqual(names(), ["Beta"]);
  assert.equal(table.getColumn("name").getFacetedUniqueValues().size, 3);

  table.toggleAllPageRowsSelected(true);
  assert.equal(table.getIsAllPageRowsSelected(), true);
  assert.deepEqual(
    table.getSelectedRowModel().rows.map((row) => row.getValue("name")),
    ["Beta"],
  );

  table.resetColumnFilters();
  table.setGlobalFilter("Gamma");
  assert.deepEqual(names(), ["Gamma"]);
  assert.equal(table.getSelectedRowModel().rows.length, 1);
});
