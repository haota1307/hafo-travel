const {
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} = require('node:fs');
const { dirname, join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
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
      .map((statement) =>
        printer.printNode(ts.EmitHint.Unspecified, statement, source),
      )
      .join('\n');
    const declarations = statements
      .filter((statement) => !ts.isImportDeclaration(statement))
      .map((statement) =>
        printer.printNode(ts.EmitHint.Unspecified, statement, source),
      )
      .join('\n\n');
    const content = imports + '\n\n' + declarations;
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
