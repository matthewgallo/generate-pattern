/**
 * Copyright IBM Corp. 2024, 2024
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This will find where to install dependencies and if it's
// confirmed that we've found a package.json, we will install

import path from 'path';
import { findFileUpParent } from './findFileUpParent';
import { runPackageManagerInstall } from './runPackageManagerInstall';

// the required dependencies
export const installDependencies = (
  depList: string[],
  finalDestination: string,
  type: string
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
