#!/usr/bin/env node

/**
 * Copyright IBM Corp. 2024, 2024
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import tiged from 'tiged';
import { select, confirm, input } from '@inquirer/prompts';
import { execSync } from 'child_process';
import { readdir } from 'node:fs/promises';
import path from 'path';

import { reactTableExamples } from './tanstack-react-list';
import { installDependencies } from './utils/installDependencies';
import { INLINE, FULL, DATA_TABLE, TEARSHEET } from './constants';
import { successMessage } from './utils/successMessage';
import { readTempJSFileImports } from './utils/readTempJSFileImports';
import { tearsheetPatterns } from './tearsheet-patterns';

const runPrompt = async () => {
  const patternType = await select({
    message: 'Select a type of pattern',
    choices: [
      {
        name: DATA_TABLE,
        value: DATA_TABLE,
        description: 'Choose from a variety of different data table extensions',
      },
      {
        name: TEARSHEET,
        value: TEARSHEET,
        description: 'Choose from a variety of different tearsheet patterns',
      },
    ],
  });
  const answers = {
    pattern: await select({
      message: 'Select a data table pattern',
      choices:
        patternType === DATA_TABLE ? reactTableExamples : tearsheetPatterns,
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

  const chosenPatterns =
    patternType === DATA_TABLE ? reactTableExamples : tearsheetPatterns;
  const { url } = chosenPatterns.find((e) => e.value === pattern)!;

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
