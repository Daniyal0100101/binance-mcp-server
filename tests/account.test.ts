import assert from 'node:assert/strict';
import test from 'node:test';
import { accountTools } from '../src/tools/account.js';

interface ToolDefinition {
  name: string;
  handler: (client: any, args: unknown) => Promise<any>;
}

function getTool(name: string): ToolDefinition {
  const tool = (accountTools as ToolDefinition[]).find(candidate => candidate.name === name);
  assert.ok(tool, `Missing tool: ${name}`);
  return tool;
}

test('account totals preserve decimal precision', async () => {
  const client = {
    accountInfo: async () => ({
      balances: [{ asset: 'TEST', free: '0.1', locked: '0.2' }],
    }),
  };

  const result = await getTool('get_account_info').handler(client, {});
  assert.equal(result.balances[0].total, '0.3');
});

test('asset balance totals preserve decimal precision', async () => {
  const client = {
    accountInfo: async () => ({
      balances: [{ asset: 'TEST', free: '9007199254740992.1', locked: '0.2' }],
    }),
  };

  const result = await getTool('get_asset_balance').handler(client, { asset: 'TEST' });
  assert.equal(result.total, '9007199254740992.3');
});
