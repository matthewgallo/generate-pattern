#!/usr/bin/env node

import tiged from 'tiged';
import { select, confirm, input } from '@inquirer/prompts';
import { reactExamples } from './tanstack-react-list.js';
import { execSync } from 'child_process';
import Table from 'cli-table';

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
  };

  const { pattern, customPath, installDeps } = answers;

  const finalDestination =
    typeof customPath === 'string' && customPath.length > 0
      ? `${process.cwd()}/${customPath}`
      : process.cwd();

  const emitter = tiged(
    `carbon-design-system/tanstack-carbon/react/${pattern}`,
    {
      disableCache: true,
      force: true,
      verbose: true,
    }
  );

  emitter.on('info', (info) => {
    // console.log('***************************************************************');
    // console.log(info);
    // console.log('Message', info.message);
    // console.log('***************************************************************');
  });

  emitter.clone(finalDestination).then(() => {
    if (installDeps) {
      console.log('Installing dependencies 🛠️');
      try {
        // Run a Yarn command (e.g., 'yarn install')
        const output = execSync(`yarn --cwd ${finalDestination} install`, {
          encoding: 'utf-8',
        });
        // console.log('Yarn command output:', output);
        console.log(table.toString());
        console.log('Done, your new pattern is ready! ✨');
      } catch (error) {
        console.error('Error running Yarn command:', error);
      }
    } else {
      console.log(table.toString());
      console.log('Done, your new pattern is ready! ✨');
    }
  });
};

runPrompt();
