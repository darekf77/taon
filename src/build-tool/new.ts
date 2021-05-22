//#region @backend
import { path, os, child_process, fse } from 'tnp-core';
import { CLI } from 'tnp-cli';

export function copyExampleTo(folder: string, exampleType: 'examples' | 'super-simple-morphi-example') {
  const options: fse.CopyOptionsSync = {
    overwrite: true,
    recursive: true,
    errorOnExist: true,
    filter: (src) => {
      return !/.*node_modules.*/g.test(src);
    }
  };
  let example = {
    dist: path.join(__dirname, '..', '..', exampleType),
    bundle: path.join(__dirname, '..', exampleType)
  }
  let destinationPath = path.join(process.cwd(), folder)
  const distMode = fse.existsSync(example.dist)
  let sourcePath = distMode ? example.dist : example.bundle;
  if (os.platform() === 'win32') {
    sourcePath = path.win32.normalize(sourcePath);
    destinationPath = path.win32.normalize(destinationPath)
  }
  console.log(CLI.chalk.green(`Creating example structure... please wait.`));
  if (distMode) {
    fse.copySync(sourcePath, destinationPath, options);
  } else {
    child_process.execSync(`cpr "${sourcePath}" "${destinationPath}" --owerwrite`);
  }
  // console.log(chalk.green(`Morphi example structure created sucessfully, installing npm...`));
  // child.execSync('npm i', { cwd: destinationPath })

  console.log(CLI.chalk.green('Done.'));
  if (CLI.commandExistsSync('code')) {
    child_process.execSync('code .', { cwd: destinationPath })
  }
}
//#endregion
