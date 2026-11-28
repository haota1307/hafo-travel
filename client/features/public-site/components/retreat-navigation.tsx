import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function RetreatNavigation({ className }: { className: string }) {
  const t = useTranslations("publicSite");
  const sections = [
    { id: "about", label: "aboutRetreats" },
    { id: "full-program", label: "fullProgram" },
    { id: "food", label: "food" },
    { id: "team", label: "team" },
    { id: "location", label: "location" },
  ] as const;

  return (
    <nav
      className={"retreat-page-info__nav " + className}
      aria-label={t("retreatNavigation")}
    >
      {sections.map(({ id, label }) => (
        <div className="retreat-page-info__link" key={id}>
          <Button
            variant="ghost"
            className="retreat-section-link"
            nativeButton={false}
            render={<a data-target={id} href={"#" + id} />}
          >
            {t(label)}
          </Button>
        </div>
      ))}
    </nav>
  );
}
