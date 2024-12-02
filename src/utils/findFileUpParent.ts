/**
 * Copyright IBM Corp. 2024, 2024
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import { existsSync } from 'fs';

// Recursively looks for a given file, going up directories until it is found or not
// Used here to find a package.json to confirm where to install dependencies
export const findFileUpParent = (
  filename: string,
  startDir: string
): string | null => {
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
