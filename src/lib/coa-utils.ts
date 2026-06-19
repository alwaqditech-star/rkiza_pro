import { COA } from '@/lib/coa-data';
import type { ChartOfAccount } from '@/lib/types';

export interface FlatCoaAccount {
  code: string;
  name: string;
  type: string;
  parent_code: string | null;
}

function accountTypeFromCode(code: string): string {
  const root = code.charAt(0);
  if (root === '1') return 'assets';
  if (root === '2') return 'liabilities';
  if (root === '3') return 'revenue';
  if (root === '4') return 'expenses';
  return 'other';
}

function parentFromCode(code: string): string | null {
  if (code.length <= 1) return null;
  return code.slice(0, -1);
}

export function flattenCoaTemplate(): FlatCoaAccount[] {
  const accounts: FlatCoaAccount[] = [];

  function walk(
    nodes: readonly {
      code: string;
      name: string;
      subs?: readonly unknown[];
      accs?: readonly { code: string; name: string }[];
    }[],
  ) {
    for (const node of nodes) {
      accounts.push({
        code: node.code,
        name: node.name,
        type: accountTypeFromCode(node.code),
        parent_code: parentFromCode(node.code),
      });
      if ('subs' in node && node.subs) {
        walk(node.subs as typeof nodes);
      }
      if ('accs' in node && node.accs) {
        for (const acc of node.accs) {
          accounts.push({
            code: acc.code,
            name: acc.name,
            type: accountTypeFromCode(acc.code),
            parent_code: parentFromCode(acc.code),
          });
        }
      }
    }
  }

  walk(COA);
  return accounts;
}

export function getAccountName(
  accounts: Pick<ChartOfAccount, 'account_code' | 'account_name'>[],
  code: string,
): string {
  return accounts.find((a) => a.account_code === code)?.account_name ?? code;
}

export const DEFAULT_CASH_ACCOUNT = '11103001';

export interface CoaTreeAccount {
  code: string;
  name: string;
}

export interface CoaTreeSubNode {
  code: string;
  name: string;
  subs?: CoaTreeSubNode[];
  accs?: CoaTreeAccount[];
}

export interface CoaTreeGroup {
  code: string;
  name: string;
  subs: CoaTreeSubNode[];
}

const GROUP_CODES = ['1', '2', '3', '4'] as const;

const GROUP_NAMES: Record<string, string> = {
  '1': 'الأصول',
  '2': 'الالتزامات',
  '3': 'الإيرادات',
  '4': 'المصروفات',
};

function buildChildrenMap(
  accounts: Pick<ChartOfAccount, 'account_code' | 'parent_code'>[],
): Map<string, ChartOfAccount[]> {
  const childrenOf = new Map<string, ChartOfAccount[]>();

  for (const account of accounts) {
    const parentKey = account.parent_code ?? '';
    const bucket = childrenOf.get(parentKey);
    if (bucket) {
      bucket.push(account as ChartOfAccount);
    } else {
      childrenOf.set(parentKey, [account as ChartOfAccount]);
    }
  }

  for (const children of childrenOf.values()) {
    children.sort((a, b) => a.account_code.localeCompare(b.account_code, 'ar'));
  }

  return childrenOf;
}

function toSubNode(
  account: ChartOfAccount,
  childrenOf: Map<string, ChartOfAccount[]>,
): CoaTreeSubNode {
  const children = childrenOf.get(account.account_code) ?? [];
  const subs: CoaTreeSubNode[] = [];
  const accs: CoaTreeAccount[] = [];

  for (const child of children) {
    const hasGrandchildren = (childrenOf.get(child.account_code) ?? []).length > 0;
    if (hasGrandchildren) {
      subs.push(toSubNode(child, childrenOf));
    } else {
      accs.push({ code: child.account_code, name: child.account_name });
    }
  }

  return {
    code: account.account_code,
    name: account.account_name,
    ...(subs.length ? { subs } : {}),
    ...(accs.length ? { accs } : {}),
  };
}

export function buildCoaGroupsFromAccounts(
  accounts: ChartOfAccount[],
): CoaTreeGroup[] {
  if (!accounts.length) return [];

  const childrenOf = buildChildrenMap(accounts);
  const byCode = new Map(accounts.map((account) => [account.account_code, account]));

  return GROUP_CODES.map((code) => {
    const root = byCode.get(code);
    const directChildren = childrenOf.get(code) ?? [];
    const subs = directChildren.map((child) => toSubNode(child, childrenOf));

    return {
      code,
      name: root?.account_name ?? GROUP_NAMES[code] ?? code,
      subs,
    };
  }).filter((group) => group.subs.length > 0);
}
