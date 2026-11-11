import { StandaloneLanguageSwitch } from '@/template/components/language-switch';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh pt-10">
      <StandaloneLanguageSwitch />
      {children}
    </div>
  );
}
