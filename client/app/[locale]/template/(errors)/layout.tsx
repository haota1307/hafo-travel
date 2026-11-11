import { StandaloneLanguageSwitch } from '@/template/components/language-switch';

export default function ErrorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh">
      <StandaloneLanguageSwitch />
      {children}
    </div>
  );
}
