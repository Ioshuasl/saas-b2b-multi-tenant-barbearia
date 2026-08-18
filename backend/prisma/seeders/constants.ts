/** IDs determinísticos do seed S0 (M1). */
export const SEED = {
  tenantA: {
    id: '018f0000-0000-7000-8000-00000000000a',
    slug: 'navalha',
    name: 'Navalha',
  },
  tenantB: {
    id: '018f0000-0000-7000-8000-00000000000b',
    slug: 'corte-fino',
    name: 'Corte Fino',
  },
  locationA: {
    id: '018f0000-0000-7000-8000-0000000000a1',
    slug: 'default',
    name: 'Unidade padrão',
  },
  locationBCentro: {
    id: '018f0000-0000-7000-8000-0000000000b1',
    slug: 'centro',
    name: 'Centro',
  },
  locationBJardim: {
    id: '018f0000-0000-7000-8000-0000000000b2',
    slug: 'jardim',
    name: 'Jardim',
  },
  userAOwner: {
    id: '018f0000-0000-7000-8000-0000000000a2',
    email: 'owner@navalha.local',
    name: 'Marcos (OWNER Navalha)',
  },
  userBOwner: {
    id: '018f0000-0000-7000-8000-0000000000b3',
    email: 'owner@cortefino.local',
    name: 'Dono Corte Fino',
  },
  userBManager: {
    id: '018f0000-0000-7000-8000-0000000000b4',
    email: 'gerente@cortefino.local',
    name: 'Fernanda (MANAGER Centro)',
  },
  userBStaff: {
    id: '018f0000-0000-7000-8000-0000000000b5',
    email: 'barbeiro@cortefino.local',
    name: 'Carlos (STAFF Centro)',
  },
  staffA: {
    id: '018f0000-0000-7000-8000-0000000000a3',
    name: 'Barbeiro Navalha',
  },
  staffBCentro: {
    id: '018f0000-0000-7000-8000-0000000000b6',
    name: 'Carlos',
  },
  staffBCentroOther: {
    id: '018f0000-0000-7000-8000-0000000000b8',
    name: 'Rafael',
  },
  staffBJardim: {
    id: '018f0000-0000-7000-8000-0000000000b7',
    name: 'Diego',
  },
  password: 'Devpass10!',
} as const;
