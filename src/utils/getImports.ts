import { builtinModules } from 'module';
import ts from 'typescript';

// Returns array of imports for a given file path
export const getImports = (fileName: string, tsHost): string[] => {
  const sourceFile = tsHost.getSourceFile(
    fileName,
    ts.ScriptTarget.Latest,
    (msg) => {
      throw new Error(`Failed to parse ${fileName}: ${msg}`);
    }
  );
  if (!sourceFile) throw ReferenceError(`Failed to find file ${fileName}`);
  const importing: string[] = [];
  delintNode(sourceFile);
  return importing;

  function delintNode(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const moduleName = node.moduleSpecifier.getText().replace(/['"]/g, '');
      if (
        !moduleName.startsWith('node:') &&
        !builtinModules.includes(moduleName)
      )
        importing.push(moduleName);
    } else ts.forEachChild(node, delintNode);
  }
};
