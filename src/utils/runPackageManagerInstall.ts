import { execSync } from 'child_process';
import { successMessage } from './successMessage';

export const runPackageManagerInstall = (
  foundPackageLock: string,
  appDir: string,
  inlineDepList: string,
  type: string
) => {
  const npmInstallScript = `npm --prefix ${appDir} install ${inlineDepList}`;
  const yarnAddScript = `yarn --cwd ${appDir} add ${inlineDepList}`;
  if (typeof inlineDepList === 'string' && inlineDepList.length) {
    console.log('Installing dependencies from inline pattern 🪄');
    // Use NPM if we find a package-lock.json file, otherwise we'll default to yarn
    execSync(foundPackageLock ? npmInstallScript : yarnAddScript, {
      encoding: 'utf-8',
    });
    console.log('Inline example created, with all necessary dependencies ✅');
    successMessage(type);
  }
};
