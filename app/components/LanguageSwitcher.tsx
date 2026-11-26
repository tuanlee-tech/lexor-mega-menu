import { Button, ButtonGroup } from "@shopify/polaris";
import { useI18n } from "../lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <ButtonGroup variant="segmented">
      <Button
        size="slim"
        pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        EN
      </Button>
      <Button
        size="slim"
        pressed={locale === "vi"}
        onClick={() => setLocale("vi")}
      >
        VI
      </Button>
    </ButtonGroup>
  );
}
