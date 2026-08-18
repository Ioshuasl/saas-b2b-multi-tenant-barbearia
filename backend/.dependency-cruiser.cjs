/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-framework-in-models',
      comment: 'models/ (DDD) não importa framework/infra (docs/16).',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/models' },
      to: {
        path: 'node_modules',
        pathNot: 'node_modules/(date-fns|uuid|zod)(/|$)',
        dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-bundled', 'npm-no-pkg'],
      },
    },
    {
      name: 'no-express-zod-prisma-in-models',
      comment: 'models/ sem Express, Prisma, Zod.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/models' },
      to: {
        path: '(express|@prisma/client|zod)(/|$)',
      },
    },
    {
      name: 'services-nao-importam-prisma',
      comment: 'services/ não importam @prisma/client.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/services' },
      to: { path: '@prisma/client' },
    },
    {
      name: 'services-nao-importam-controllers',
      comment: 'services/ não dependem de HTTP.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/services' },
      to: { path: '^src/modules/[^/]+/controllers' },
    },
    {
      name: 'prisma-so-na-borda',
      comment: 'Prisma só em repositories/ e shared/database/.',
      severity: 'error',
      from: {
        path: '^src',
        pathNot: '^src/(shared/database|modules/[^/]+/repositories)',
      },
      to: { path: '@prisma/client' },
    },
    {
      name: 'cruzar-modulo-so-pelo-public',
      comment: 'Cruzar módulo só via <dominio>_public.ts.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: {
        path: '^src/modules/(?!$1)[^/]+/',
        pathNot: '_public\\.ts$',
      },
    },
    {
      name: 'no-circular',
      comment: 'Sem ciclos de dependência.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
      dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-bundled', 'npm-no-pkg'],
    },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
