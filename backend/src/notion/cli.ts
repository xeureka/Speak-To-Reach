import { buildNotionSetupChecklist, createNotionWorkspace } from './workspace.js';
import process from 'node:process';

const planOnly = process.argv.includes('--plan');

if (planOnly) {
  console.log(JSON.stringify(buildNotionSetupChecklist(), null, 2));
} else {
  const result = await createNotionWorkspace({
    notionToken: process.env.NOTION_TOKEN,
    parentPageId: process.env.NOTION_PARENT_PAGE_ID,
  });
  console.log(JSON.stringify(result, null, 2));
}
