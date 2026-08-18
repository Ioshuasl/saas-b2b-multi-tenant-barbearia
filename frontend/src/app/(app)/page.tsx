import { Suspense } from 'react';
import { HomeIndex } from '@/packages/admin/components/Home/HomeIndex';
import { AppointmentIndex } from '@/packages/operacional/components/Appointment/AppointmentIndex';

export default function AppHomePage() {
  return (
    <Suspense fallback={<p className="text-sm opacity-70">Carregando agenda…</p>}>
      <HomeIndex />
      <AppointmentIndex defaultView="day" />
    </Suspense>
  );
}
