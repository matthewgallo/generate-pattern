import { execSync } from 'child_process';
import { successMessage } from './successMessage';

export const runPackageManagerInstall = (
  foundPackageLock: string,
  appDir: string,
  inlineDepList: string,
  type: string
) => {
  const cleanedList = inlineDepList.replaceAll(',', ' ');
  const npmInstallScript = `npm --prefix ${appDir} install ${cleanedList}`;
  const yarnAddScript = `yarn --cwd ${appDir} add ${cleanedList}`;
  if (cleanedList && cleanedList.length) {
    console.log('Installing dependencies from inline pattern 🪄');
    // Use NPM if we find a package-lock.json file, otherwise we'll default to yarn
    execSync(foundPackageLock ? npmInstallScript : yarnAddScript, {
      encoding: 'utf-8',
    });
    console.log('Inline example created, with all necessary dependencies ✅');
    successMessage(type);
  }
};
