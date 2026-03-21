# Analitycs-ecommerce-client

Frontend Angular 17 para el dashboard de analytics e-commerce.

## Stack
- **Angular 17** — standalone components
- **Angular Material 17** — UI components
- **Chart.js + ng2-charts** — gráficos de crecimiento
- **TypeScript 5.4**

## Requisitos
- Node.js >= 18
- Angular CLI >= 17 (`npm install -g @angular/cli`)
- Backend corriendo en `http://localhost:3000`

## Instalación

```bash
npm install
ng serve
```

La app corre en `http://localhost:4200`

## Variables de entorno
Editá `src/environments/environment.ts` para apuntar a tu API:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};
```

## Estructura

```
src/app/
├── core/
│   ├── auth/          # AuthService, authGuard, authInterceptor
│   └── services/      # DashboardService, TenantService
├── features/
│   ├── login/         # Pantalla de login
│   └── dashboard/     # Dashboard principal
└── shared/
    └── components/
        └── metric-card/
```

## Flujo de autenticación
1. Login con email + tenant ID → el backend devuelve JWT
2. El `authInterceptor` agrega `Authorization: Bearer <token>` y `x-tenant-id` en cada request
3. El `authGuard` protege la ruta `/dashboard`