import type { ReactNode } from "react";

export type PageHeroVariant = "default" | "emerald" | "ruby" | "gold" | "slate";

export interface PageHeroStat {
  value: ReactNode;
  label: string;
}

export interface PageHeroProps {
  kicker: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  stat?: PageHeroStat;
  stats?: PageHeroStat[];
  variant?: PageHeroVariant;
  className?: string;
}

export function PageHero({
  kicker,
  title,
  description,
  actions,
  stat,
  stats,
  variant = "default",
  className,
}: PageHeroProps) {
  const statsList = stats ?? (stat ? [stat] : []);
  const variantClass = variant !== "default" ? ` page-hero--${variant}` : "";

  return (
    <section className={`page-hero${variantClass}${className ? ` ${className}` : ""}`}>
      <div className="page-hero-main">
        <span className="page-hero-kicker">{kicker}</span>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
        {actions ? <div className="page-hero-actions">{actions}</div> : null}
      </div>
      {statsList.length > 0 ? (
        <div className="page-hero-stats">
          {statsList.map((item) => (
            <div className="page-hero-stat" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function AppPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`app-page${className ? ` ${className}` : ""}`}>{children}</div>;
}
