import { CommandType } from './models';

const group = 'Firedev CLI essentials';

export const commands: CommandType[] = ([
  {
    title: 'hello'
  },
  {
    title: 'siema'
  }
] as CommandType[]).map(c => {
  if (!c.command) {
    c.command = `extension.${camelize(c.title)}`;
  }
  if (!c.group) {
    c.group = group;
  }
  return c;
})


function camelize(str: string = '') {
  str = str.replace(/\W/g, '').toLowerCase();
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
    return index == 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}
