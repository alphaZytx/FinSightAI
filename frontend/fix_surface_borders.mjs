import fs from 'fs';
import path from 'path';

const files = [
  '/Users/alokchandra/Desktop/FinSightAI copy 2/frontend/src/pages/Chat/ChatPage.tsx',
  '/Users/alokchandra/Desktop/FinSightAI copy 2/frontend/src/pages/Comparison/ComparisonPage.tsx',
  '/Users/alokchandra/Desktop/FinSightAI copy 2/frontend/src/components/Dashboard/ResearchProgress.tsx',
  '/Users/alokchandra/Desktop/FinSightAI copy 2/frontend/src/components/Dashboard/WorkspaceInsights.tsx',
  '/Users/alokchandra/Desktop/FinSightAI copy 2/frontend/src/pages/Workspace/WorkspacePage.tsx'
];

const replacements = [
  [/\bhover:border-surface-600\/50\b/g, 'hover:border-primary-500/30'],
  [/\bhover:border-surface-600\b/g, 'hover:border-primary-500/30'],
  [/\bborder-surface-600\b/g, 'border-border'],
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
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
