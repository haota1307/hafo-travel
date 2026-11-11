import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/inter/vietnamese-400.css';
import '@fontsource/inter/vietnamese-500.css';
import '@fontsource/inter/vietnamese-600.css';
import '@fontsource/inter/vietnamese-700.css';
import '@fontsource/manrope/vietnamese-400.css';
import '@fontsource/manrope/vietnamese-500.css';
import '@fontsource/manrope/vietnamese-600.css';
import '@fontsource/manrope/vietnamese-700.css';
import './template.css';
import { TemplateProviders } from '@/template/providers';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('template');

  return {
    title: t('shadcnAdminTemplate'),
    description: t('localUITemplatesForRoviet'),
  };
}

export default async function TemplateLayout({ children }: { children: React.ReactNode }) {
  return <TemplateProviders>{children}</TemplateProviders>;
}
