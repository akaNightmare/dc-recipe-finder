import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const file of walk(path.join(root, 'src'))) {
  if (!file.endsWith('.generated.ts')) {
    continue;
  }

  let source = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);

  const fixed = source.replace(
    /import \* from '(\.\/[^']+\.generated)';/g,
    (_, relativeImport) => {
      const importedPath = path.join(dir, `${relativeImport}.ts`);
      const importedSource = fs.readFileSync(importedPath, 'utf8');
      const docs = [
        ...importedSource.matchAll(/export const (\w+FragmentDoc)/g),
      ].map((match) => match[1]);

      if (docs.length === 0) {
        throw new Error(`No fragment docs found in ${importedPath}`);
      }

      return `import { ${docs.join(', ')} } from '${relativeImport}';`;
    },
  );

  if (fixed !== source) {
    fs.writeFileSync(file, fixed);
  }
}

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else {
      yield fullPath;
    }
  }
}
