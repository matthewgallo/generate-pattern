// This will find where to install dependencies and if it's
// confirmed that we've found a package.json, we will install

import path from 'path';
import { findFileUpParent } from './findFileUpParent.js';
import { runPackageManagerInstall } from './runPackageManagerInstall.js';

// the required dependencies
export const installDependencies = (
  depList: string[],
  finalDestination: string,
  type
) => {
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
      runPackageManagerInstall(
        foundPackageLock,
        appDirectory,
        inlineDepList,
        type
      );
    } catch (error) {
      console.log('Error install inline deps', error);
    }
  } else {
    console.log(
      'Could not find a package.json file. Skipping dependency install. 🚫'
    );
  }
};
