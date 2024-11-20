#!/usr/bin/env node

import ts from 'typescript';
import tiged from 'tiged';
import { select, confirm, input } from '@inquirer/prompts';
import { execSync } from 'child_process';
import { readdir } from 'node:fs/promises';
import path from 'path';

import { reactExamples } from './tanstack-react-list';
import { installDependencies } from './utils/installDependencies';
import { INLINE, FULL } from './constants';
import { successMessage } from './utils/successMessage';
import { readTempJSFileImports } from './utils/readTempJSFileImports';

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

  const { url } = reactExamples.find((e) => e.value === pattern)!;

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
    console.log('Finding dependencies to install 🔎');
    const fileList = await readdir(finalDestination, { recursive: true });
    const allJSAndTSFiles = [];
    const allImports = [];
    const styleFiles = [] as string[];
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
      allJSAndTSFiles.forEach((filePath) => {
        execSync(
          `npx tsc --jsx react --noCheck ${filePath} --outDir ${finalDestination}/temp --target esnext --module esnext --allowJs`,
          {
            encoding: 'utf-8',
          }
        );
      });
      const importsFromJsFiles = await readTempJSFileImports(
        `${finalDestination}/temp`
      );
      allImports.push(importsFromJsFiles);
    }

    return installDependencies(allImports.flat(), finalDestination, type);
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
