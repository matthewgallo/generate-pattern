import { readdir } from 'node:fs/promises';
import { readFileSync, rmSync, lstatSync } from 'fs';
import { parseImports } from 'parse-imports';

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

const removeDuplicatesFromArr = (data, key) => [
  ...new Map(data.map((x) => [key(x), x])).values(),
];

// Parses an array of files given a dir and will find all of the
// packages that are imported in those files
export const readTempJSFileImports = async (tempDir: string) => {
  const jsFileList = await readdir(tempDir, { recursive: true });
  if (jsFileList.length > 0) {
    const allImports = [];
    await asyncForEach(jsFileList, async (jsFile: string) => {
      const name = `${tempDir}/${jsFile}`;
      const isDir = lstatSync(name).isDirectory();
      // We only want files, so if we find a dir we should not do anything
      if (isDir) return;
      const code = readFileSync(name, 'utf8');
      const imports = [...(await parseImports(code))];
      allImports.push(imports);
    });
    const flattenedImports = allImports.flat();
    const externalImports = flattenedImports.filter(
      (i) => i.moduleSpecifier.type === 'package'
    );
    const finalPackages = removeDuplicatesFromArr(
      externalImports,
      (i) => i.moduleSpecifier.value
    );
    const externalImportList = finalPackages.map(
      (a: { moduleSpecifier: { value: string } }) => a.moduleSpecifier.value
    );
    // Delete temp dir
    rmSync(tempDir, { recursive: true, force: true });
    return externalImportList.filter((d) => d !== '@carbon/react/icons');
  }
};
