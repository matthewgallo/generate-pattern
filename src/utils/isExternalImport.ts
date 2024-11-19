import ts from 'typescript';

// TS compiler is not able to resolve the `motion` package
// so this is a work-around so that we can be sure to flag
// it as an external package that we need to install
const unresolvableList = ['motion'];

// Returns true if a given import is external
export const isExternalImport = (
  fileName: string,
  importPath: string,
  tsHost: ts.CompilerHost
): boolean => {
  const program = ts.createProgram([fileName], {}, tsHost);
  const sourceFile = program.getSourceFile(fileName);
  if (sourceFile) {
    const importDeclaration = sourceFile.statements.find((node) => {
      return (
        ts.isImportDeclaration(node) &&
        node.moduleSpecifier.getText() === `'${importPath}'`
      );
    });

    if (importDeclaration) {
      const result = ts.resolveModuleName(
        importPath,
        fileName,
        program.getCompilerOptions(),
        ts.sys
      );

      return (
        (result.resolvedModule?.isExternalLibraryImport ||
          unresolvableList.includes(importPath)) ??
        false
      );
    }
  }

  return false;
};
