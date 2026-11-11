import { Header } from '@/template/components/layout/header';

export default function ErrorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
