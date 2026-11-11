const { readdirSync, existsSync } = require('node:fs');
const { dirname, join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

const packagePath = require.resolve('@typescript/native/package.json');
const nativePackage = require(packagePath);
const compiler = resolve(dirname(packagePath), nativePackage.bin.tsc);
const configs = ['apps', 'libs'].flatMap((directory) =>
  readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      ['tsconfig.app.json', 'tsconfig.lib.json', 'tsconfig.spec.json']
        .map((filename) => join(directory, entry.name, filename))
        .filter((filename) => existsSync(filename)),
    ),
);

for (const config of configs) {
  const result = spawnSync(
    process.execPath,
    [compiler, '--project', config, '--noEmit', '--incremental', 'false'],
    { stdio: 'inherit', windowsHide: true },
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
