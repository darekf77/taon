//#region imports
import { Firedev } from 'firedev/src';
//#region @browser
import type { FiredevFileComponent } from './firedev-file.component';
//#endregion
//#endregion

export namespace FiredevFileHelpers {
  //#region @browser
  export function loadScript(src: string, context: FiredevFileComponent) {
    return new Promise((resolve, reject) => {
      //resolve if already loaded
      if (context.scripts[src]) {
        resolve({ script: src, status: 'Already Loaded Script File' });
      } else {
        //load script
        let script = document.createElement('script') as any;
        script.type = 'text/javascript';
        script.src = src;

        if (script.readyState) {
          //IE
          script.onreadystatechange = () => {
            if (
              script.readyState === 'loaded' ||
              script.readyState === 'complete'
            ) {
              script.onreadystatechange = null;
              context.scripts[src] = true;
              resolve({ script: src, status: 'Loaded' });
            }
          };
        } else {
          //Others
          script.onload = () => {
            context.scripts[src] = true;
            resolve({ script: src, status: 'Loaded' });
          };
        }

        script.onerror = (error: any) =>
          resolve({ script: src, status: 'Loaded' });
        document.getElementsByTagName('head')[0].appendChild(script);
      }
    });
  }
  //#endregion

  //#region @browser
  export function loadStyle(src: string, context: FiredevFileComponent) {
    const styles = context.styles;
    return new Promise((resolve, reject) => {
      //resolve if already loaded
      if (styles[src]) {
        resolve({ script: src, status: 'Already Loaded Style File' });
      } else {
        //load script
        let link = document.createElement('link') as any;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = src;

        if (link.readyState) {
          //IE
          link.onreadystatechange = () => {
            if (
              link.readyState === 'loaded' ||
              link.readyState === 'complete'
            ) {
              link.onreadystatechange = null;
              styles[src] = true;
              resolve({ script: src, status: 'Loaded' });
            }
          };
        } else {
          //Others
          link.onload = () => {
            styles[src] = true;
            resolve({ script: src, status: 'Loaded' });
          };
        }

        link.onerror = (error: any) =>
          resolve({ script: src, status: 'Loaded' });
        document.getElementsByTagName('head')[0].appendChild(link);
      }
    });
  }
  //#endregion
}

// const base64image1 = 'data:image/png;base64,R0lGODlhDAAMAKIFAF5LAP/zxAAAANyuAP/gaP///wAAAAAAACH5BAEAAAUALAAAAAAMAAwAAAMlWLPcGjDKFYi9lxKBOaGcF35DhWHamZUW0K4mAbiwWtuf0uxFAgA7'; // emoji
// const bs64image2 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAUAB4DASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9Dr/WrXS7Ke7ubhIbaBGlkkY8KqjJJ+gFeA6v+11LLfNH4e8OrqFsH2CS7ujC7j+8FCkAfU5+lQ/tAeMLXS/hfrsVxqEdnPNBiBZZArTNkEIo77sY49a4H9m1vC3xK0k2F8sdtqUUm7a58qRP7hUd88g/WvDhmdTFVfY01yux6ksDChD2k9T1bwT+1l/bkMw1XwpfadPDceSYo5FZyoOC4V9vHBOASSMEdcD36x1KHUrOG6t5RLBMgkjdehUjINfMXjj4C+GdQhsCSLjVtNuluopJ5vntJFYhH2bgO55PHtXc+GNUTRdFgtDOFZdzGON8qu5i2Ae/X0r0KmLlhY/vFdnNDDRr6wdkUPFmlWWoaXfC5s7ef9ySfMiVs8H1FeX+G/h/4av7wSS6FYiVSCrxwhGH4jFFFflOKlKnWg4Ox9lSSlTdzvrzTLSS4EkkAmkV1w8ruxG3pyT2ro7fQdPulDyWqFiOuT/jRRXdTr1ZTd5v72YShHlWh//Z'; // hammy
