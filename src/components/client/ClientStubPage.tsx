import type { TablerIcon } from "@tabler/icons-react";
import { AppPage, PageHero } from "@/components/ui/PageHero";

interface ClientStubPageProps {
  title: string;
  description: string;
  icon: TablerIcon;
  kicker?: string;
}

export function ClientStubPage({
  title,
  description,
  icon: Icon,
  kicker = "قريباً",
}: ClientStubPageProps) {
  return (
    <AppPage>
      <PageHero kicker={kicker} title={title} description={description} />
      <div className="card">
        <div className="tbl-empty">
          <Icon size={36} stroke={1.2} style={{ opacity: 0.4, margin: "0 auto 8px" }} />
          {description}
        </div>
      </div>
    </AppPage>
  );
}
