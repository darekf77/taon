import { spawn } from 'child_process';
console.clear();
const COMPOSE_PROJECT_NAME =
  process.env.COMPOSE_PROJECT_NAME || 'container-v19__isomorphic-lib-v19';
const env = { ...process.env, COMPOSE_PROJECT_NAME };
let closing = false;

const child = spawn(
  'docker-compose',
  ['-f', 'docker-compose.yml', 'up', '--build'],
  {
    env,
    cwd: __dirname,
    stdio: 'inherit', // inherit stdio so output shows in terminal
  },
);

console.log(`



  PRESS ANY KEY TO STOP CONTAINER FOR ${COMPOSE_PROJECT_NAME}



  `);

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', () => {
  if (closing) {
    return;
  }
  // If we are already closing, ignore further input

  closing = true;
  console.log('Stopping container...');

  child.kill('SIGINT');
  console.log('Exiting...');
  const downProcess = spawn(
    'docker-compose',
    ['-f', 'docker-compose.yml', 'down'],
    {
      env,
      cwd: __dirname,
      stdio: 'inherit',
    },
  );

  downProcess.on('close', code => {
    console.log(`docker-compose down exited with code ${code}`);
    process.exit(0);
  });
});
