// import { EnvConfig } from 'tnp-bundle';

// declare global {
//     const ENV: EnvConfig;
// }

declare module "*.json" {
    const value: any;
    export default value;
}
