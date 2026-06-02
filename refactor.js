const fs = require('fs');
const path = 'src/lib/services/receipts.ts';
let content = fs.readFileSync(path, 'utf8');

// Insert helper at the top after imports
const helper = `\n// Helper to get current organization ID
async function getOrgId(): Promise<string | null> {
  const { data } = await supabase.rpc('get_user_org');
  return (data as unknown as string) || null;
}\n`;

content = content.replace(/export async function getReceipts/, helper + '\nexport async function getReceipts');

// Replace standard pattern
content = content.replace(/const\s*\{\s*data\s*:\s*orgData\s*\}\s*=\s*await\s*supabase\.rpc\('get_user_org'\);\s*\n\s*const\s*orgId\s*=\s*orgData\s*as\s*unknown\s*as\s*string;/g, 'const orgId = await getOrgId();');

// Also catch the inline function pattern: () => supabase.rpc('get_user_org')
// actually, I'll leave the transaction array ones since they might be grouped in promises.

fs.writeFileSync(path, content);
console.log('Refactored receipts.ts');
