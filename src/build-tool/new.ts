import * as path from 'path';
import * as fse from "fs-extra";
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
  const exampleLocation = path.join(__dirname, '..', '..', 'example');
  const destinationPath = path.join(process.cwd(), folder)
  fse.copySync(exampleLocation, destinationPath, options);
  console.log(chalk.green(`Morphi example structure created sucessfully, installing npm...`));
  child.execSync('npm i', { cwd: destinationPath })
  child.execSync('code isomorphic-lib && code angular-client', { cwd: destinationPath })
  console.log(chalk.green('Done.'));
}
