'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Can } from '@/shared/auth/Can';
import { useSessionStore } from '@/shared/auth/session';

const SETTINGS = [
  { href: '/configuracoes/rede', label: 'Rede' },
  { href: '/configuracoes/unidades', label: 'Unidades' },
  { href: '/configuracoes/horarios', label: 'Horários' },
  { href: '/configuracoes/servicos', label: 'Serviços' },
  { href: '/configuracoes/profissionais', label: 'Profissionais' },
] as const;

export function AppNav({ showWizard }: { showWizard: boolean }) {
  const pathname = usePathname();
  const role = useSessionStore((s) => s.me?.role);

  return (
    <nav className="flex flex-col gap-1 p-3">
      <Can permission="agenda.read">
        <NavLink href="/" active={pathname === '/' || pathname.startsWith('/agenda')}>
          Agenda
        </NavLink>
      </Can>
      <Can permission="customers.read">
        <NavLink
          href="/clientes"
          active={pathname === '/clientes' || pathname.startsWith('/clientes/')}
        >
          Clientes
        </NavLink>
      </Can>
      {showWizard && role === 'OWNER' ? (
        <NavLink href="/inicio" active={pathname === '/inicio'}>
          Configurar loja
        </NavLink>
      ) : null}
      <Can permission="settings.read">
        <p className="mt-3 px-3 text-xs uppercase tracking-wide opacity-50">Cadastros</p>
        {SETTINGS.map((item) => (
          <NavLink key={item.href} href={item.href} active={pathname === item.href}>
            {item.label}
          </NavLink>
        ))}
      </Can>
      <Can permission="messaging.configure">
        <NavLink
          href="/configuracoes/whatsapp"
          active={pathname === '/configuracoes/whatsapp'}
        >
          Mensagens
        </NavLink>
      </Can>
      <Can permission="users.manage">
        <NavLink href="/configuracoes/equipe" active={pathname === '/configuracoes/equipe'}>
          Equipe
        </NavLink>
      </Can>
    </nav>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm ${active ? 'bg-white/10' : 'opacity-80 hover:bg-white/5'}`}
    >
      {children}
    </Link>
  );
}
