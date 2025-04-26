export * from './lib';

//#region @backend
export async function run(args: string[]) {
  console.log('Hello world from CLI!');
  process.exit(0);
}
export default run;
//#endregion
