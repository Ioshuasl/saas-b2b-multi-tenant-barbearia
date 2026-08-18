import { Suspense, type ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
