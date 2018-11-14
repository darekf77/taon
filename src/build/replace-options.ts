export interface ReplaceOptions {
    replacements: (string | [string, string])[];
  }
  
  export interface ReplaceOptionsExtended  {
  
    replacements: (string | [string, string] | [string, (expression: any) => boolean])[];
  }

  
