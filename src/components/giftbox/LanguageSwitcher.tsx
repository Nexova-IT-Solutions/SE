"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { locales, type Locale } from "@/i18n/config";

const languageNames: Record<Locale, string> = {
  en: "English",
  si: "සිංහල",
  ta: "தமிழ்"
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Common");

  function onLanguageChange(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-white/10 text-white/90 h-9 px-3 border border-white/10 rounded-full">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">{languageNames[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 border-brand-border">
        {locales.map((loc) => (
          <DropdownMenuItem 
            key={loc} 
            className={`cursor-pointer hover:bg-[#315243]/5 px-4 py-2.5 ${locale === loc ? "bg-[#315243]/5 font-semibold text-[#315243]" : "text-[#1F1720]"}`}
            onClick={() => onLanguageChange(loc)}
          >
            {languageNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
