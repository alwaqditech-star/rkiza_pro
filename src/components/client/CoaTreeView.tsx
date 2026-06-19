"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronsDown,
  IconChevronsUp,
  IconListTree,
  IconSearch,
} from "@tabler/icons-react";
import { apiGetJson } from "@/lib/api-get";
import {
  buildCoaGroupsFromAccounts,
  type CoaTreeAccount,
  type CoaTreeGroup,
  type CoaTreeSubNode,
} from "@/lib/coa-utils";
import type { ChartOfAccount } from "@/lib/types";
import { LoadingBlock } from "@/components/ui/LoadingBlock";

const GROUP_META: Record<
  string,
  { tone: string; typeLabel: string; description: string }
> = {
  "1": { tone: "teal", typeLabel: "أصول", description: "ممتلكات وحقوق للجمعية" },
  "2": { tone: "slate", typeLabel: "التزامات", description: "مطلوبات وذمم دائنة" },
  "3": { tone: "gold", typeLabel: "إيرادات", description: "تبرعات وإيرادات نشاط" },
  "4": { tone: "ruby", typeLabel: "مصروفات", description: "تكاليف وبرامج وأنشطة" },
};

function matchesSearch(text: string, query: string) {
  return text.toLowerCase().includes(query) || text.includes(query);
}

function filterSubNode(node: CoaTreeSubNode, query: string): CoaTreeSubNode | null {
  if (node.subs?.length) {
    const subs = node.subs
      .map((child) => filterSubNode(child, query))
      .filter((child): child is CoaTreeSubNode => child !== null);
    if (subs.length) return { ...node, subs };
  }

  if (node.accs?.length) {
    const accs = node.accs.filter(
      (acc) => matchesSearch(acc.name, query) || acc.code.includes(query),
    );
    if (accs.length) return { ...node, accs };
  }

  if (matchesSearch(node.name, query) || node.code.includes(query)) {
    return node;
  }

  return null;
}

function filterCoaGroups(query: string, groups: CoaTreeGroup[]): CoaTreeGroup[] {
  if (!query) return groups;

  return groups
    .map((group) => {
      const subs = group.subs
        .map((sub) => filterSubNode(sub, query))
        .filter((sub): sub is CoaTreeSubNode => sub !== null);
      return subs.length ? { ...group, subs } : null;
    })
    .filter((group): group is CoaTreeGroup => group !== null);
}

function countAccounts(node: CoaTreeSubNode): number {
  let total = node.accs?.length ?? 0;
  node.subs?.forEach((child) => {
    total += countAccounts(child);
  });
  return total;
}

function collectOpenIds(groups: CoaTreeGroup[]): Record<string, boolean> {
  const ids: Record<string, boolean> = {};
  groups.forEach((group) => {
    ids[`g${group.code}`] = true;
    group.subs.forEach((sub) => {
      ids[`s${sub.code}`] = true;
      sub.subs?.forEach((nested) => {
        ids[`ss${nested.code}`] = true;
      });
    });
  });
  return ids;
}

function CoaAccountList({ accounts }: { accounts: CoaTreeAccount[] }) {
  return (
    <div className="coa-accounts open">
      {accounts.map((acc) => (
        <div className="coa-acc-row" key={acc.code}>
          <span className="coa-acc-name">{acc.name}</span>
          <span className="coa-acc-code">{acc.code}</span>
        </div>
      ))}
    </div>
  );
}

function CoaNestedSection({
  node,
  toggle,
  isOpen,
}: {
  node: CoaTreeSubNode;
  toggle: (id: string) => void;
  isOpen: (id: string) => boolean;
}) {
  const id = `ss${node.code}`;

  return (
    <div className="coa-nested-group">
      <div
        className={`coa-nested-head${isOpen(id) ? " open" : ""}`}
        onClick={() => toggle(id)}
        onKeyDown={(e) => e.key === "Enter" && toggle(id)}
        role="button"
        tabIndex={0}
      >
        <span className="coa-nested-title">{node.name}</span>
        <span className="coa-sub-code">{node.code}</span>
        <IconChevronLeft
          size={12}
          className={`coa-chevron nested${isOpen(id) ? " open" : ""}`}
        />
      </div>
      {isOpen(id) && node.accs ? <CoaAccountList accounts={node.accs} /> : null}
    </div>
  );
}

function CoaSubSection({
  sub,
  groupTone,
  toggle,
  isOpen,
}: {
  sub: CoaTreeSubNode;
  groupTone: string;
  toggle: (id: string) => void;
  isOpen: (id: string) => boolean;
}) {
  const id = `s${sub.code}`;
  const accountCount = countAccounts(sub);

  return (
    <div className={`coa-sub-group coa-sub-tone-${groupTone}`}>
      <div
        className={`coa-sub-head${isOpen(id) ? " open" : ""}`}
        onClick={() => toggle(id)}
        onKeyDown={(e) => e.key === "Enter" && toggle(id)}
        role="button"
        tabIndex={0}
      >
        <div className="coa-sub-head-main">
          <span className="coa-sub-title">{sub.name}</span>
          <span className="coa-sub-code">{sub.code}</span>
          {accountCount > 0 ? (
            <span className="coa-count-chip">{accountCount} حساب</span>
          ) : null}
        </div>
        <IconChevronLeft size={13} className={`coa-chevron${isOpen(id) ? " open" : ""}`} />
      </div>

      {isOpen(id) ? (
        <div className="coa-sub-body">
          {sub.subs?.map((nested) => (
            <CoaNestedSection
              key={nested.code}
              node={nested}
              toggle={toggle}
              isOpen={isOpen}
            />
          ))}
          {sub.accs ? <CoaAccountList accounts={sub.accs} /> : null}
        </div>
      ) : null}
    </div>
  );
}

export function CoaTreeView() {
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [groups, setGroups] = useState<CoaTreeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadCoa = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const json = await apiGetJson<ChartOfAccount[]>("/api/client/coa", {
        ttl: "static",
      });
      if (json.success && json.data) {
        setGroups(buildCoaGroupsFromAccounts(json.data));
      } else {
        setGroups([]);
        setLoadError(json.message ?? "تعذّر تحميل الدليل المحاسبي");
      }
    } catch {
      setGroups([]);
      setLoadError("تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCoa();
  }, [loadCoa]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredCoa = useMemo(
    () => filterCoaGroups(normalizedSearch, groups),
    [normalizedSearch, groups],
  );

  const stats = useMemo(() => {
    const totalAccounts = groups.reduce(
      (sum, group) => sum + group.subs.reduce((s, sub) => s + countAccounts(sub), 0),
      0,
    );
    return { groups: groups.length, totalAccounts };
  }, [groups]);

  function toggle(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function isOpen(id: string) {
    return normalizedSearch ? true : !!openGroups[id];
  }

  function expandAll() {
    setOpenGroups(collectOpenIds(filteredCoa));
  }

  function collapseAll() {
    setOpenGroups({});
  }

  if (loading) {
    return <LoadingBlock label="جاري تحميل الدليل المحاسبي..." />;
  }

  if (loadError) {
    return (
      <div className="tbl-empty" style={{ padding: "3rem 1rem" }}>
        <IconListTree size={36} stroke={1.2} style={{ opacity: 0.4 }} />
        <p>{loadError}</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => void loadCoa()}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="coa-page">
      <section className="page-hero coa-hero">
        <div>
          <span className="page-hero-kicker">الدليل المحاسبي</span>
          <h2>شجرة الحسابات المعتمدة</h2>
          <p>تصفح وابحث في حسابات الأصول والالتزامات والإيرادات والمصروفات</p>
        </div>
        <div className="coa-hero-stats">
          <div className="coa-hero-stat">
            <strong>{stats.groups}</strong>
            <span>مجموعات رئيسية</span>
          </div>
          <div className="coa-hero-stat">
            <strong>{stats.totalAccounts}</strong>
            <span>حساب فرعي</span>
          </div>
        </div>
      </section>

      <div className="coa-type-grid">
        {groups.map((group) => {
          const meta = GROUP_META[group.code];
          const count = group.subs.reduce((sum, sub) => sum + countAccounts(sub), 0);
          return (
            <div key={group.code} className={`coa-type-card coa-type-${meta?.tone ?? "teal"}`}>
              <span className="coa-type-code">{group.code}</span>
              <strong>{group.name}</strong>
              <small>{meta?.description}</small>
              <span className="coa-type-count">{count} حساب</span>
            </div>
          );
        })}
      </div>

      <div className="card coa-card">
        <div className="coa-toolbar">
          <div className="coa-search-wrap">
            <IconSearch size={16} stroke={1.8} className="coa-search-icon" />
            <input
              className="coa-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالرمز أو اسم الحساب..."
            />
          </div>
          <div className="coa-toolbar-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={expandAll}>
              <IconChevronsDown size={14} />
              فتح الكل
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={collapseAll}>
              <IconChevronsUp size={14} />
              طي الكل
            </button>
          </div>
        </div>

        {filteredCoa.length === 0 ? (
          <div className="tbl-empty">
            <IconListTree size={36} stroke={1.2} style={{ opacity: 0.4 }} />
            لا توجد حسابات مطابقة للبحث
          </div>
        ) : (
          <div id="coa-tree" className="coa-tree">
            {filteredCoa.map((group) => {
              const meta = GROUP_META[group.code];
              const tone = meta?.tone ?? "teal";
              const groupId = `g${group.code}`;
              const accountCount = group.subs.reduce(
                (sum, sub) => sum + countAccounts(sub),
                0,
              );

              return (
                <div className={`coa-group coa-group-tone-${tone}`} key={group.code}>
                  <div
                    className={`coa-group-head${isOpen(groupId) ? " open" : ""}`}
                    onClick={() => toggle(groupId)}
                    onKeyDown={(e) => e.key === "Enter" && toggle(groupId)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="coa-head-left">
                      <span className={`coa-code-badge coa-badge-${tone}`}>{group.code}</span>
                      <div className="coa-group-text">
                        <span className="coa-group-title">{group.name}</span>
                        <span className="coa-group-meta">
                          {meta?.typeLabel} · {accountCount} حساب
                        </span>
                      </div>
                    </div>
                    <IconChevronDown
                      size={15}
                      className={`coa-chevron down${isOpen(groupId) ? " open" : ""}`}
                    />
                  </div>

                  {isOpen(groupId) ? (
                    <div className="coa-group-body open">
                      {group.subs.map((sub) => (
                        <CoaSubSection
                          key={sub.code}
                          sub={sub}
                          groupTone={tone}
                          toggle={toggle}
                          isOpen={isOpen}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
