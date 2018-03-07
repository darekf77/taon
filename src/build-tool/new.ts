import * as path from 'path';
import * as fse from "fs-extra";
import * as fs from 'fs';
import * as os from 'os';
import chalk from 'chalk';
import * as child from 'child_process';

export function copyExampleTo(folder: string) {
  const options: fse.CopyOptions = {
    overwrite: true,
    recursive: true,
    errorOnExist: true,
    filter: (src) => {
      return !/.*node_modules.*/g.test(src);
    }
  };
  let example = {
    dist: path.join(__dirname, '..', '..', 'example'),
    bundle: path.join(__dirname, '..', 'example')
  }
  let destinationPath = path.join(process.cwd(), folder)
  const distMode = fs.existsSync(example.dist)
  let sourcePath = distMode ? example.dist : example.bundle;
  if (os.platform() === 'win32') {
    sourcePath = path.win32.normalize(sourcePath);
    destinationPath = path.win32.normalize(destinationPath)
  }
  console.log(chalk.green(`Creating example structure... please wait.`));
  if (distMode) {
    fse.copySync(sourcePath, destinationPath, options);
  } else {
    child.execSync(`cpr "${sourcePath}" "${destinationPath}" --owerwrite`);
  }
  // console.log(chalk.green(`Morphi example structure created sucessfully, installing npm...`));
  // child.execSync('npm i', { cwd: destinationPath })
  child.execSync('code .', { cwd: destinationPath })
  console.log(chalk.green('Done.'));
}
