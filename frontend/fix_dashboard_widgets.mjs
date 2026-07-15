import fs from 'fs';
import path from 'path';

const dir = '/Users/alokchandra/Desktop/FinSightAI copy 2/frontend/src/components/Dashboard';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx')).map(f => path.join(dir, f));

const replacements = [
  // Specific override for button text in WorkspaceInsights
  [/text-white hover:bg-primary-500 transition-colors/g, 'text-primary-foreground hover:bg-primary-500 transition-colors'],

  // Typography
  [/\btext-white\b/g, 'text-foreground'],
  [/\btext-emerald-400\b/g, 'text-success-foreground'],
  [/\btext-amber-400\b/g, 'text-warning-foreground'],
  [/\btext-red-400\b/g, 'text-error-foreground'],
  [/\btext-blue-400\b/g, 'text-info-foreground'],

  // Backgrounds
  [/\bbg-emerald-500\/10\b/g, 'bg-success'],
  [/\bbg-emerald-500\/20\b/g, 'bg-success'],
  [/\bbg-emerald-500\/50\b/g, 'bg-success-border'], // For progress bar line
  [/\bbg-amber-500\/10\b/g, 'bg-warning'],
  [/\bbg-amber-500\/20\b/g, 'bg-warning'],
  [/\bbg-red-500\/10\b/g, 'bg-error'],
  [/\bbg-red-500\/20\b/g, 'bg-error'],
  [/\bbg-blue-500\/10\b/g, 'bg-info'],
  [/\bbg-blue-500\/20\b/g, 'bg-info'],

  // Borders
  [/\bborder-emerald-500\b/g, 'border-success-border'],
  [/\bborder-emerald-500\/30\b/g, 'border-success-border'],
  [/\bborder-amber-500\/30\b/g, 'border-warning-border'],
  [/\bborder-red-500\/30\b/g, 'border-error-border'],
  [/\bborder-blue-500\/30\b/g, 'border-info-border'],
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${path.basename(file)}`);
  }
}
