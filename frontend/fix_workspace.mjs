import fs from 'fs';

const file = 'src/pages/Workspace/WorkspacePage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Colors replacement map
const replacements = [
  // Typography
  [/\btext-white\b/g, 'text-foreground'],
  
  // Specific buttons that were text-white but need text-primary-foreground
  [/text-foreground shadow-lg shadow-primary hover:bg-primary-500/g, 'text-primary-foreground shadow-lg shadow-primary hover:bg-primary-500'],
  [/text-foreground hover:bg-primary-500 transition-colors/g, 'text-primary-foreground hover:bg-primary-500 transition-colors'],
  
  // Emerald / Success
  [/\btext-emerald-400\b/g, 'text-success-foreground'],
  [/\btext-emerald-300\b/g, 'text-success-foreground'],
  [/\bbg-emerald-500\/10\b/g, 'bg-success'],
  [/\bbg-emerald-500\/15\b/g, 'bg-success'],
  [/\bborder-emerald-500\/30 bg-emerald-500\/5\b/g, 'border-success-border bg-success'],

  // Amber / Warning
  [/\btext-amber-400\b/g, 'text-warning-foreground'],
  [/\btext-amber-300\b/g, 'text-warning-foreground'],
  [/\bbg-amber-500\/10\b/g, 'bg-warning'],
  [/\bbg-amber-500\/20\b/g, 'bg-warning'],
  [/\bborder-amber-500\/60 bg-amber-500\/10\b/g, 'border-warning-border bg-warning'],
  [/\bshadow-amber-500\/10\b/g, ''],

  // Red / Error
  [/\btext-red-400\b/g, 'text-error-foreground'],
  [/\btext-red-300\b/g, 'text-error-foreground'],
  [/\bbg-red-500\/10\b/g, 'bg-error'],
  [/\bbg-red-500\/20\b/g, 'bg-error-border'], // Using error-border for darker hover
  [/\bborder-red-500\/30 bg-red-500\/5\b/g, 'border-error-border bg-error'],
  [/\bborder-red-500\/30 bg-red-500\/10\b/g, 'border-error-border bg-error'],

  // Blue / Info
  [/\btext-blue-400\b/g, 'text-info-foreground'],
  [/\btext-blue-300\b/g, 'text-info-foreground'],
  [/\bbg-blue-500\/10\b/g, 'bg-info'],
  [/\bbg-blue-500\/20\b/g, 'bg-info'],
  [/\bborder-blue-500\/60 bg-blue-500\/10\b/g, 'border-info-border bg-info'],
  [/\bshadow-blue-500\/10\b/g, ''],
];

for (const [regex, replacement] of replacements) {
  content = content.replace(regex, replacement);
}

// Clean up leftover double spaces from removed shadows
content = content.replace(/shadow-sm \s+'/g, "shadow-sm'");

fs.writeFileSync(file, content);
console.log('Done replacing tokens in WorkspacePage.tsx');
