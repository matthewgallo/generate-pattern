import ts from 'typescript';

// Returns true if a given import is external
export const isExternalImport = (
  fileName: string,
  importPath: string,
  tsHost
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
      const resolvedModule = ts.resolveModuleName(
        importPath,
        fileName,
        program.getCompilerOptions(),
        ts.sys
      );

      return resolvedModule.resolvedModule?.isExternalLibraryImport ?? false;
    }
  }

  return false;
};
