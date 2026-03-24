<div align="center">

# 📊 Analitycs E-commerce — Dashboard

### El panel de control que todo e-commerce necesita para crecer de manera inteligente

[![Angular](https://img.shields.io/badge/Angular-17-DD0031?style=flat-square&logo=angular)](https://angular.dev)
[![Angular Material](https://img.shields.io/badge/Material-17-3F51B5?style=flat-square&logo=material-design)](https://material.angular.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Chart.js](https://img.shields.io/badge/Chart.js-4-FF6384?style=flat-square&logo=chartdotjs)](https://www.chartjs.org)

> Frontend SPA del proyecto [Analitycs-ecommerce](https://github.com/MarcosEstebanDev/Analitycs-ecommerce)

</div>

---

## 🎯 ¿Qué es este dashboard?

Una aplicación web moderna que transforma los datos crudos de tu tienda en información visual, clara y accionable. Con un diseño limpio, modo oscuro, y actualización en tiempo real, es la interfaz que conecta tus datos con tus decisiones de negocio.

---

## 🖥️ Pantallas y funcionalidades

### 🏠 Dashboard principal
El centro de comando de tu tienda. De un vistazo:
- **5 KPIs clave**: Ingresos totales, Pedidos, Ticket promedio, Clientes activos, LTV promedio
- **Gráfico de crecimiento adaptativo**: Granularidad diaria (7/30 días), semanal (90 días) o mensual (6 meses/1 año)
- **Top clientes por revenue**: Quiénes generan más valor en tu negocio
- **Alertas críticas**: Contador de anomalías activas en rojo
- **Insights automáticos**: Notificaciones de comportamiento (crecimiento de clientes, tendencias, etc.)

### 📦 Órdenes
- Listado completo con paginación y filtros por fecha, estado y tienda
- Exportación a CSV con un click
- Detalle de cada orden con sus ítems

### 👥 Clientes
- Tabla de todos los clientes con métricas: órdenes, LTV, fecha de alta
- **Modal de detalle**: Historial reciente de compras, LTV, AOV individual, avatar con iniciales
- Exportación a CSV

### 🔮 Pronóstico de revenue
- Gráfico combinado con historial + proyección futura (30/60/90 días)
- Bandas de confianza estadísticas
- Indicador de tendencia (↑ alcista / ↓ bajista / → estable)

### 🧩 Análisis de cohortes
- Matriz visual de retención: sabé en qué mes perdés más clientes
- Porcentajes de retención por cohorte

### 🔗 Conectores
- Gestión de tiendas conectadas (Shopify / WooCommerce)
- Activar / desactivar sincronización por tienda

### 💡 Insights
- Feed de observaciones generadas automáticamente por el motor de analítica
- Filtros por severidad: informativo, advertencia, crítico
- Acciones: marcar como leído / accionado

### ⚙️ Ajustes
- Perfil de usuario y cambio de contraseña
- Configuración de webhooks y Slack URL para alertas
- Umbrales de anomalías configurables con sliders

### 💳 Billing
- Vista de plan actual y comparación de planes
- Preparado para Stripe Checkout

---

## 🌙 Dark mode

Modo oscuro completo, activado con un toggle en el header. Todos los componentes están optimizados para ambos temas.

---

## 🔔 Notificaciones en tiempo real

El dashboard recibe notificaciones push vía WebSocket cuando el backend detecta una anomalía, sin necesidad de refrescar la página.

---

## 🏗️ Arquitectura del frontend

```
src/app/
├── core/
│   ├── auth/
│   │   ├── auth.service.ts          # Login, logout, refresh token
│   │   ├── auth.interceptor.ts      # Agrega JWT + x-tenant-id, maneja 401
│   │   └── auth.guard.ts            # Protege rutas privadas
│   └── services/
│       ├── dashboard.service.ts     # Llamadas a /dashboard/*
│       └── theme.service.ts         # Dark/light mode
│
├── features/
│   ├── login/                       # Pantalla de login
│   ├── register/                    # Registro de nuevo tenant
│   ├── onboarding/                  # Wizard de conexión de tienda
│   ├── dashboard/                   # Dashboard principal + gráficos
│   ├── orders/                      # Lista y detalle de órdenes
│   ├── customers/                   # Lista de clientes + modal de detalle
│   ├── cohorts/                     # Análisis de retención
│   ├── forecast/                    # Pronóstico de revenue
│   ├── connectors/                  # Gestión de tiendas conectadas
│   ├── insights/                    # Feed de insights
│   ├── settings/                    # Ajustes de usuario y notificaciones
│   ├── billing/                     # Planes y suscripción
│   └── team/                        # Gestión de equipo
│
└── shared/
    └── components/
        └── metric-card/             # Tarjeta de KPI reutilizable
```

### Stack tecnológico

| Herramienta | Versión | Uso |
|-------------|---------|-----|
| Angular | 17 | Framework principal (standalone components) |
| Angular Material | 17 (MDC) | Componentes UI: forms, tables, dialogs, sliders |
| Chart.js + ng2-charts | 4.x | Gráficos de líneas (dashboard, forecast, cohortes) |
| TypeScript | 5.4 | Tipado estricto en toda la app |
| Socket.io-client | 4.x | Notificaciones en tiempo real |
| RxJS | 7.x | Manejo reactivo de estado e HTTP |

---

## 🚀 Instalación y desarrollo local

### Requisitos
- Node.js 18+
- Backend corriendo en `http://localhost:3000` ([ver instrucciones](https://github.com/MarcosEstebanDev/Analitycs-ecommerce))

### 1. Clonar e instalar
```bash
git clone https://github.com/MarcosEstebanDev/Analitycs-ecommerce-client.git
cd Analitycs-ecommerce-client
npm install
```

### 2. Configurar entorno
Editá `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};
```

### 3. Iniciar servidor de desarrollo
```bash
npx ng serve
# App corriendo en http://localhost:4200
```

### 4. Build de producción
```bash
npx ng build --configuration production
# Output en dist/analitycs-ecommerce-client/
```

---

## 🔐 Flujo de autenticación

```
Login / Registro
    ↓
Backend devuelve: { accessToken, refreshToken, tenantId }
    ↓
Tokens guardados en localStorage
    ↓
authInterceptor inyecta en cada request:
  - Authorization: Bearer <token>
  - x-tenant-id: <tenantId>
    ↓
Si el backend devuelve 401 → auto-refresh silencioso
    ↓
authGuard protege todas las rutas privadas
(verifica token + tenantId, redirige a /login si falta alguno)
```

---

## 🎨 Guía de diseño

| Elemento | Valor |
|----------|-------|
| Color primario | Indigo `#4f46e5` |
| Color de acento | Emerald `#10b981` |
| Dark mode fondo | `#0f1117` |
| Dark mode card | `#1e2130` |
| Border radius cards | `16px` |
| Tipografía | Inter (Google Fonts) |
| Iconografía | Material Icons |

---

## 🤝 Contribuir

1. Fork del repositorio
2. Creá tu rama: `git checkout -b feature/nueva-vista`
3. Commit: `git commit -m 'feat: descripción'`
4. Push y abrí un Pull Request

---

## 📄 Licencia

MIT © [MarcosEstebanDev](https://github.com/MarcosEstebanDev)

---

<div align="center">

**Backend API** → [Analitycs-ecommerce](https://github.com/MarcosEstebanDev/Analitycs-ecommerce)

⭐ Si este proyecto te resultó útil, dejanos una estrella en GitHub.

</div>
