#!/usr/bin/env node

import tiged from 'tiged';
import { select, confirm, input } from '@inquirer/prompts';
import { reactExamples } from './tanstack-react-list.js';
import { execSync } from 'child_process';
import Table from 'cli-table';
import path from 'path';
import { readdir } from 'node:fs/promises';
import { existsSync } from 'fs';
import { builtinModules } from 'module';

import ts from 'typescript';

const INLINE = 'Inline';
const FULL = 'Full Vite template';

const table = new Table({
  head: ['Framework', 'URL'],
  colWidths: [18, 90],
  style: { 'padding-left': 1 },
});

table.push(
  [
    'React',
    'https://github.com/carbon-design-system/tanstack-carbon/tree/main/react',
  ],
  [
    'Web components',
    'https://github.com/carbon-design-system/tanstack-carbon/tree/main/web-components',
  ]
);

const runPrompt = async () => {
  const answers = {
    pattern: await select({
      message: 'Select a data table pattern',
      choices: reactExamples,
    }),
    installDeps: await confirm({ message: 'Install required dependencies?' }),
    customPath: await input({
      message: 'Install path (default is the current directory)',
    }),
    type: await select({
      message: 'Select a pattern type',
      choices: [
        {
          name: FULL,
          value: FULL,
          description:
            'This will scaffold together a Vite template with the selected pattern',
        },
        {
          name: INLINE,
          value: INLINE,
          description:
            'This will include the pattern into an existing application',
        },
      ],
    }),
  };

  const { pattern, customPath, installDeps, type } = answers;

  const { url } = reactExamples.find((e) => e.value === pattern);

  const finalDestination =
    typeof customPath === 'string' && customPath.length > 0
      ? `${process.cwd()}/${customPath}`
      : process.cwd();

  // Requires that every example pattern has an Example dir inside src
  const finalSource = type !== INLINE ? url : `${url}/src/Example`;

  const emitter = tiged(finalSource, {
    disableCache: true,
    force: true,
    verbose: true,
  });

  emitter.on('info', (info) => {
    // console.log('***************************************************************');
    // console.log(info);
    // console.log('Message', info.message);
    // console.log('***************************************************************');
  });

  const successMessage = (type) => {
    console.log(table.toString());
    console.log(
      type === INLINE
        ? `Done, your new inline pattern is ready! ✨`
        : `Done, your new pattern, example app is ready! ✨`
    );
  };

  const buildFullPattern = () => {
    console.log('Building full pattern 🛠️');
    if (installDeps) {
      console.log('Installing dependencies 🛠️');
      try {
        execSync(`yarn --cwd ${finalDestination} install`, {
          encoding: 'utf-8',
        });
        console.log(
          'Full example pattern created, with dependencies installed ✅'
        );
        successMessage(type);
      } catch (error) {
        console.error('Error running Yarn command:', error);
      }
    } else {
      successMessage(type);
    }
  };

  // Collects all js/ts files and checks all of their imports
  // and gets only the external packages
  const readExampleImports = async () => {
    const fileList = await readdir(finalDestination, { recursive: true });
    const allJSAndTSFiles = [];
    const styleFiles = [];
    for (const file of fileList) {
      const name = `${finalDestination}/${file}`;
      if (
        path.extname(name) === '.tsx' ||
        path.extname(name) === '.ts' ||
        path.extname(name) === '.jsx' ||
        path.extname(name) === '.js'
      ) {
        allJSAndTSFiles.push(name);
      }
      if (path.extname(name) === '.scss' || path.extname(name) === '.css') {
        styleFiles.push(name);
      }
    }

    if (allJSAndTSFiles.length > 0) {
      const foundExternalPackages = [];
      // Gets imports for each js/ts file
      allJSAndTSFiles.forEach((filePath) => {
        const fileImports = getImports(filePath);
        if (fileImports.length > 0) {
          fileImports.map((i) => {
            // Checks if import is from an external package
            if (isExternalImport(filePath, i)) {
              foundExternalPackages.push(i);
            }
          });
        }
      });
      const uniquePackages = [...new Set(foundExternalPackages)];
      return installDependencies(
        uniquePackages.filter((d) => d !== '@carbon/react/icons')
      );
    }
  };

  // Recursively looks for a given file, going up directories until it is found or not
  // Used here to find a package.json to confirm where to install dependencies
  const findFileUpParent = (filename: string, startDir: string) => {
    let currentDir = startDir || process.cwd();
    while (currentDir !== path.parse(currentDir).root) {
      const filePath = path.join(currentDir, filename);
      if (existsSync(filePath)) {
        return filePath;
      }
      currentDir = path.dirname(currentDir);
    }
    return null;
  };

  const runPackageManagerInstall = (
    foundPackageLock: string,
    appDir: string,
    inlineDepList: string
  ) => {
    const npmInstallScript = `npm --prefix ${appDir} install ${inlineDepList}`;
    const yarnAddScript = `yarn --cwd ${appDir} add ${inlineDepList}`;
    console.log('Installing dependencies from inline pattern 🪄');
    // Use NPM if we find a package-lock.json file, otherwise we'll default to yarn
    execSync(foundPackageLock ? npmInstallScript : yarnAddScript, {
      encoding: 'utf-8',
    });
    console.log('Inline example created, with all necessary dependencies ✅');
    successMessage(type);
  };

  // This will find where to install dependencies and if it's
  // confirmed that we've found a package.json, we will install
  // the required dependencies
  const installDependencies = (depList: string[]) => {
    // Need to confirm package.json exists in order to install packages
    const packageJsonPath = findFileUpParent('package.json', finalDestination);
    if (packageJsonPath) {
      const appDirectory = path.dirname(packageJsonPath);
      const inlineDepList = depList.join(' ');
      try {
        const foundPackageLock = findFileUpParent(
          'package-lock.json',
          finalDestination
        );
        runPackageManagerInstall(foundPackageLock, appDirectory, inlineDepList);
      } catch (error) {
        console.log('Error install inline deps', error);
      }
    } else {
      console.log(
        'Could not find a package.json file. Skipping dependency install. 🚫'
      );
    }
  };

  const buildInlinePattern = () => {
    // inline pattern generation step chosen
    console.log('Building inline pattern 🛠️');
    if (installDeps) {
      try {
        // find what dependencies to install
        readExampleImports();
      } catch (error) {
        console.error('Error installing dependencies 🚫', error);
      }
    } else {
      successMessage(type);
    }
  };

  emitter.clone(finalDestination).then(() => {
    if (type === FULL) {
      buildFullPattern();
    } else {
      buildInlinePattern();
    }
  });
};

runPrompt();

const tsHost = ts.createCompilerHost(
  {
    allowJs: true,
    noEmit: true,
    isolatedModules: true,
    resolveJsonModule: false,
    moduleResolution: ts.ModuleResolutionKind.Classic, // we don't want node_modules
    incremental: true,
    noLib: true,
    noResolve: true,
  },
  true
);

// Returns array of imports for a given file path
const getImports = (fileName: string): string[] => {
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

// Returns true if a given import is external
const isExternalImport = (fileName: string, importPath: string): boolean => {
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
