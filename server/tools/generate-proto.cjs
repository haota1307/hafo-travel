const {
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} = require('node:fs');
const { dirname, join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadSync } = require('@grpc/proto-loader');
const ts = require('typescript');
const prettier = require('prettier');

async function generate() {
  const root = resolve(__dirname, '..');
  const input = join(root, 'libs/interfaces/src/lib/proto');
  const output = join(root, 'libs/interfaces/src/lib/grpc');
  const files = readdirSync(input, { recursive: true }).filter((file) =>
    file.endsWith('.proto'),
  );
  const buf = join(
    dirname(require.resolve('@bufbuild/buf/package.json')),
    'bin/buf',
  );
  const template = {
    version: 'v2',
    plugins: [
      {
        local: [
          process.execPath,
          require.resolve('ts-proto/protoc-gen-ts_proto'),
        ],
        out: output,
        opt: [
          'nestJs=true',
          'addGrpcMetadata=true',
          'useOptionals=messages',
          'unrecognizedEnum=false',
          'annotateFilesWithVersion=false',
        ],
        strategy: 'all',
      },
    ],
  };

  mkdirSync(output, { recursive: true });

  const result = spawnSync(
    process.execPath,
    [buf, 'generate', input, '--template', JSON.stringify(template)],
    { cwd: root, stdio: 'inherit', windowsHide: true },
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  for (const file of files) {
    const target = join(output, file.replace(/\.proto$/, '.ts'));
    const source = ts.createSourceFile(
      target,
      readFileSync(target, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    const printer = ts.createPrinter({ removeComments: true });
    const statements = source.statements.filter(
      (statement) =>
        !ts.isFunctionDeclaration(statement) &&
        !(
          ts.isImportDeclaration(statement) &&
          statement.moduleSpecifier.text === '@nestjs/microservices'
        ),
    );
    const imports = statements
      .filter(ts.isImportDeclaration)
      .sort((left, right) => {
        const leftPath = left.moduleSpecifier.text;
        const rightPath = right.moduleSpecifier.text;

        return (
          Number(leftPath.startsWith('.')) -
            Number(rightPath.startsWith('.')) ||
          leftPath.localeCompare(rightPath)
        );
      })
      .map((statement, index, imports) => {
        const isRelative = statement.moduleSpecifier.text.startsWith('.');
        const previousIsRelative =
          index > 0 && imports[index - 1].moduleSpecifier.text.startsWith('.');
        const separator =
          index > 0 && isRelative !== previousIsRelative ? '\n' : '';

        return (
          separator +
          printer.printNode(ts.EmitHint.Unspecified, statement, source)
        );
      })
      .join('\n');
    const declarations = statements
      .filter((statement) => !ts.isImportDeclaration(statement))
      .map((statement) =>
        printer.printNode(ts.EmitHint.Unspecified, statement, source),
      )
      .join('\n\n');
    const definitions = loadSync(join(input, file), { includeDirs: [input] });
    const constants = statements
      .filter(ts.isVariableStatement)
      .flatMap((statement) => statement.declarationList.declarations);
    const packageName = constants.find(
      (declaration) => declaration.name.text === 'protobufPackage',
    ).initializer.text;
    const methods = constants
      .filter((declaration) => declaration.name.text.endsWith('_SERVICE_NAME'))
      .map((declaration) => {
        const service =
          definitions[`${packageName}.${declaration.initializer.text}`];
        const name = declaration.name.text.replace(/_NAME$/, '_METHODS');
        const entries = Object.keys(service).map((method) => {
          const key = method
            .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
            .toUpperCase();

          return `${key}: '${method}'`;
        });

        return `export const ${name} = {\n${entries.join(',\n')}\n} as const;`;
      })
      .join('\n\n');
    const content = [imports, declarations, methods]
      .filter(Boolean)
      .join('\n\n');
    const config = await prettier.resolveConfig(target);

    writeFileSync(
      target,
      await prettier.format(content, { ...config, filepath: target }),
    );
  }
}

generate().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
