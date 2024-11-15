#!/usr/bin/env node
import tiged from 'tiged';
import { select, confirm, input } from '@inquirer/prompts';
import { reactExamples } from './tanstack-react-list.js';
import { execSync } from 'child_process';
import Table from 'cli-table';
import path from 'path';
import { parseImports } from 'parse-imports';
import { readdirSync, readFileSync, existsSync, rmSync } from 'fs';
const INLINE = 'Inline';
const FULL = 'Full Vite template';
const table = new Table({
    head: ['Framework', 'URL'],
    colWidths: [18, 90],
    style: { 'padding-left': 1 },
});
table.push([
    'React',
    'https://github.com/carbon-design-system/tanstack-carbon/tree/main/react',
], [
    'Web components',
    'https://github.com/carbon-design-system/tanstack-carbon/tree/main/web-components',
]);
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
                    description: 'This will scaffold together a Vite template with the selected pattern',
                },
                {
                    name: INLINE,
                    value: INLINE,
                    description: 'This will include the pattern into an existing application',
                },
            ],
        }),
    };
    const { pattern, customPath, installDeps, type } = answers;
    const finalDestination = typeof customPath === 'string' && customPath.length > 0
        ? `${process.cwd()}/${customPath}`
        : process.cwd();
    const finalSource = type !== INLINE
        ? `carbon-design-system/tanstack-carbon/react/${pattern}`
        : `carbon-design-system/tanstack-carbon/react/${pattern}/src/Example`; // Assumes every example pattern has a Example dir inside src which is currently only true for react/ai-label
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
        console.log(type === INLINE
            ? `Done, your new inline pattern is ready! ✨`
            : `Done, your new pattern, example app is ready! ✨`);
    };
    const buildFullPattern = () => {
        console.log('Building full pattern 🛠️');
        if (installDeps) {
            console.log('Installing dependencies 🛠️');
            try {
                execSync(`yarn --cwd ${finalDestination} install`, {
                    encoding: 'utf-8',
                });
                console.log('Full example pattern created, with dependencies installed ✅');
                successMessage(type);
            }
            catch (error) {
                console.error('Error running Yarn command:', error);
            }
        }
        else {
            successMessage(type);
        }
    };
    // Compiles ts so that the parse-imports package can parse the example pattern
    // and know which packages will need to be installed later on
    const readExampleImports = () => {
        const fileList = readdirSync(finalDestination);
        const tsFiles = [];
        const scssFiles = [];
        for (const file of fileList) {
            const name = `${finalDestination}/${file}`;
            if (path.extname(name) === '.tsx' || path.extname(name) === '.ts') {
                tsFiles.push(name);
            }
            if (path.extname(name) === '.scss') {
                scssFiles.push(name);
            }
        }
        if (tsFiles.length > 0) {
            tsFiles.forEach((filePath) => {
                execSync(`npx tsc --jsx react --noCheck ${filePath} --outDir ${finalDestination}/temp --target esnext --module esnext`, {
                    encoding: 'utf-8',
                });
            });
            readTempJSFileImports(`${finalDestination}/temp`);
        }
    };
    async function asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }
    // Parses an array of files given a dir and will find all of the
    // packages that are imported in those files
    const readTempJSFileImports = async (tempDir) => {
        const jsFileList = readdirSync(tempDir);
        if (jsFileList.length > 0) {
            const allImports = [];
            await asyncForEach(jsFileList, async (jsFile) => {
                const name = `${tempDir}/${jsFile}`;
                const code = readFileSync(name, 'utf8');
                const imports = [...(await parseImports(code))];
                allImports.push(imports);
            });
            const flattenedImports = allImports.flat();
            const externalImports = flattenedImports.filter((i) => i.moduleSpecifier.type === 'package');
            const finalPackages = removeDuplicatesFromArr(externalImports, (i) => i.moduleSpecifier.value);
            const externalImportList = finalPackages.map((a) => a.moduleSpecifier.value);
            // Delete temp dir
            rmSync(tempDir, { recursive: true, force: true });
            installDependencies(externalImportList.filter((d) => d !== '@carbon/react/icons'));
        }
    };
    // Recursively looks for a given file, going up directories until it is found or not
    // Used here to find a package.json to confirm where to install dependencies
    const findFileUpParent = (filename, startDir) => {
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
    const runPackageManagerInstall = (foundPackageLock, appDir, inlineDepList) => {
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
    const installDependencies = (depList) => {
        // Need to confirm package.json exists in order to install packages
        const packageJsonPath = findFileUpParent('package.json', finalDestination);
        if (packageJsonPath) {
            const appDirectory = path.dirname(packageJsonPath);
            const inlineDepList = depList.join(' ');
            try {
                const foundPackageLock = findFileUpParent('package-lock.json', finalDestination);
                runPackageManagerInstall(foundPackageLock, appDirectory, inlineDepList);
            }
            catch (error) {
                console.log('Error install inline deps', error);
            }
        }
        else {
            console.log('Could not find a package.json file. Skipping dependency install. 🚫');
        }
    };
    const removeDuplicatesFromArr = (data, key) => [
        ...new Map(data.map((x) => [key(x), x])).values(),
    ];
    const buildInlinePattern = () => {
        // inline pattern generation step chosen
        console.log('Building inline pattern 🛠️');
        if (installDeps) {
            try {
                // find what dependencies to install
                readExampleImports();
            }
            catch (error) {
                console.error('Error installing dependencies 🚫', error);
            }
        }
        else {
            successMessage(type);
        }
    };
    emitter.clone(finalDestination).then(() => {
        if (type === FULL) {
            buildFullPattern();
        }
        else {
            buildInlinePattern();
        }
    });
};
runPrompt();
//# sourceMappingURL=index.js.map