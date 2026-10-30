# NANIVET — Frontend

**NANIVET** es una aplicación web de gestión para una clínica veterinaria ubicada en Esmeraldas, Ecuador. Es una prueba de concepto (PoC) de frontend construida con **Next.js 13** que utiliza **datos mock en memoria** para simular la funcionalidad completa de un sistema de clínica veterinaria real.

El backend correspondiente (PostgreSQL + API REST) se encuentra en la carpeta `backend NANIVET/` del repositorio. Este README documenta **únicamente el frontend**.

---

## Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Ejecución](#instalación-y-ejecución)
- [Arquitectura](#arquitectura)
- [Sistema de Autenticación](#sistema-de-autenticación)
- [Datos Mock — Referencia Completa](#datos-mock--referencia-completa)
  - [Modelos de Datos](#modelos-de-datos)
  - [Usuarios](#1-usuarios)
  - [Veterinarios](#2-veterinarios)
  - [Clientes](#3-clientes)
  - [Mascotas](#4-mascotas)
  - [Citas](#5-citas)
  - [Casos Clínicos](#6-casos-clínicos)
  - [Vacunas](#7-vacunas)
  - [Tratamientos](#8-tratamientos)
  - [Desparasitaciones](#9-desparasitaciones)
  - [Cirugías](#10-cirugías)
  - [Exámenes Adjuntos](#11-exámenes-adjuntos)
  - [Registros de Peso](#12-registros-de-peso)
  - [Puntuaciones de Cita](#19-puntuaciones-de-cita)
  - [Hospitalizaciones](#20-hospitalizaciones)
  - [Medicaciones](#22-medicaciones)
  - [Evoluciones Diarias](#23-evoluciones-diarias)
  - [Audit Logs](#24-audit-logs)
  - [Campañas](#25-campañas)
- [Capa de Repositorios](#capa-de-repositorios)
- [Servicio de IA (Mock)](#servicio-de-ia-mock)
- [Rutas y Páginas](#rutas-y-páginas)
- [Permisos por Rol](#permisos-por-rol)
- [Constantes y Utilidades](#constantes-y-utilidades)
- [UI Components](#ui-components)
- [Distribución](#distribución)

---

## Características

- **Dashboard** con métricas en tiempo real (citas del día, vacunas por vencer, casos abiertos, hospitalizados, calificación promedio)
- **Calendario** interactivo de citas por veterinario
- **Gestión de Citas** — crear, confirmar, cancelar, reprogramar (con reglas de negocio: límite de 12 horas para cancelar/reprogramar)
- **Gestión de Clientes** — CRUD completo con consentimiento de datos (Ley de Protección de Datos de Ecuador)
- **Gestión de Mascotas** — CRUD vinculado a clientes
- **Casos Clínicos** — formato SOAP (Subjetivo, Objetivo, Análisis, Plan) con estados (abierto, seguimiento, cerrado)
- **Vacunas** — historial con alertas por vencimiento (próxima dosis dentro de N días). Flujo de registro desde la sección de vacunas: el administrador/veterinario selecciona mascota, vacuna, lote, fecha y veterinario. Se calcula automáticamente la próxima dosis según el tipo de vacuna.
- **Desparasitaciones** — historial con próximas dosis. Flujo de registro desde la sección de desparasitación: el administrador/veterinario selecciona mascota, producto, dosis, fecha y veterinario. Se calcula automáticamente la próxima desparasitación según el producto (trimestral, mensual, etc.).
- **Registro de Peso en Citas** — al crear o actualizar una cita, el formulario incluye un campo opcional de peso (kg). Este peso se guarda automáticamente en la línea de tiempo de la mascota cuando la cita se marca como "atendida" y se refleja en la gráfica de peso de la ficha clínica.
- **Puntuación de Citas** — cada cita que se marca como "atendida" genera automáticamente una puntuación pendiente. Los clientes reciben un enlace único `/puntuar/{id}` para calificar del 1 al 5 estrellas con opción de recomendar/no recomendar y dejar un comentario.
- **Campañas de Recordatorio** — segmentos automáticos (vacunas vencidas, desparasitación pendiente, clientes inactivos, cumpleaños)
- **Auditoría** — registro de todas las operaciones CRUD con diff de campos
- **Búsqueda Global** — búsqueda unificada de clientes, mascotas, veterinarios
- **IA Veterinaria Mock** — resumen de historia clínica, conversión de notas a SOAP, redacción de mensajes, diagnósticos diferenciales
- **Agendamiento Público** — formulario sin login para agendar citas (con consentimiento de datos obligatorio)
- **Enlaces Públicos** — citas accesibles por token (sin autenticación)
- **Tema Oscuro/Claro** — con `next-themes`
- **Diseño Responsive** — mobile-first con Tailwind CSS

---

## Tecnologías

| Categoría | Tecnología |
|---|---|
| **Framework** | Next.js 13.5 (App Router, Server Components) |
| **Lenguaje** | TypeScript 5.2 |
| **UI** | React 18.2, Tailwind CSS 3.3 |
| **Componentes** | Radix UI (20+ componentes headless), shadcn/ui patterns |
| **Iconos** | Lucide React 0.446 |
| **Gráficas** | Recharts 2.12 |
| **Formularios** | React Hook Form 7.53 + Zod 3.23 (validación) |
| **Fechas** | date-fns 3.6 |
| **Tema** | next-themes 0.3 |
| **Toast** | Sonner 1.5 |
| **Base de datos (mock)** | Arrays en memoria (TypeScript) |
| **Deploy** | Netlify / Docker (standalone) |

---

## Estructura del Proyecto

```
project/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Layout raíz (ThemeProvider, Inter font)
│   ├── page.tsx                      # Landing page pública
│   ├── globals.css                   # Estilos globales (Tailwind + variables CSS)
│   │
│   ├── admin/                        # Panel de administración (requiere login)
│   │   ├── layout.tsx                # AuthProvider → AdminGuard → AdminShell
│   │   ├── page.tsx                  # Dashboard
│   │   ├── login-form.tsx            # Componente de login
│   │   ├── admin-guard.tsx           # Guard: redirige a login si no autenticado
│   │   ├── admin-shell.tsx           # Layout con sidebar, header, navegación
│   │   ├── global-search.tsx         # Búsqueda global
│   │   │
│   │   ├── calendario/               # Calendario de citas
│   │   │   └── page.tsx
│   │   ├── citas/                    # Lista y gestión de citas
│   │   │   └── page.tsx
│   │   ├── clientes/                 # CRUD clientes
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx         # Detalle cliente
│   │   ├── mascotas/                 # CRUD mascotas
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx         # Detalle mascota (ficha clínica completa)
│   │   ├── casos/                    # Casos clínicos (SOAP)
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx         # Detalle caso
│   │   │   └── new/page.tsx          # Nuevo caso
│   │   ├── vacunas/                  # Historial de vacunas
│   │   │   └── page.tsx
│   │   ├── hospitalizacion/          # Gestión de hospitalización
│   │   │   └── page.tsx
│   │   ├── horarios/                 # Horarios veterinarios + bloqueos
│   │   │   └── page.tsx
│   │   ├── puntuaciones/             # Puntuaciones y calificaciones
│   │   │   └── page.tsx
│   │   └── auditoria/                # Registro de auditoría
│   │       └── page.tsx
│   │
│   ├── agendar/                      # Agendamiento público (sin login)
│   │   ├── page.tsx                  # Formulario multi-paso
│   │   └── cita/[token]/page.tsx     # Detalle/acciones de cita por token
│   │
│   └── puntuar/                      # Puntuación pública de citas
│       └── [id]/page.tsx             # Formulario de puntuación por ID de cita
│
├── components/
│   ├── auth-provider.tsx             # Contexto de autenticación (localStorage)
│   ├── theme-provider.tsx            # Contexto de tema (dark/light)
│   └── admin/
│       ├── admin-guard.tsx           # Redirige a login si no autenticado
│       ├── admin-shell.tsx           # Sidebar + header + navegación
│       ├── global-search.tsx         # Búsqueda global (Cmd+K)
│       └── login-form.tsx            # Formulario de login
│
├── lib/
│   ├── models.ts                     # Interfaces TypeScript (tipos de datos)
│   ├── mock-data.ts                  # TODOS los datos mock (~180+ registros)
│   ├── repositories.ts               # Capa de acceso a datos (CRUD en memoria)
│   ├── constants.ts                  # Constantes, tipos, permisos, plantillas
│   ├── ai-service.ts                 # IA veterinaria mock (4 funciones)
│   └── utils.ts                      # cn() para clsx + tailwind-merge
│
├── hooks/
│   └── use-toast.ts                  # Hook para Sonner toast
│
├── .bolt/                            # Configuración Bolt
│   └── config.json
├── Dockerfile                        # Docker standalone
├── netlify.toml                      # Netlify deploy config
├── next.config.js                    # Next.js config (standalone, sin ESLint en build)
├── tailwind.config.ts                # Tailwind + plugin animate
├── tsconfig.json                     # TypeScript config
├── package.json
└── README.md
```

---

## Instalación y Ejecución

```bash
# 1. Clonar el repositorio
cd "project"

# 2. Instalar dependencias
npm install

# 3. Ejecutar en desarrollo
npm run dev
# Server: http://localhost:3000

# 4. Construir para producción
npm run build

# 5. Ejecutar producción
npm start

# 6. Type checking
npm run typecheck

# 7. Linting
npm run lint
```

**Variables de entorno:** No se requieren variables de entorno para el frontend (todos los datos son mock).

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layers                            │
│  (app/page.tsx, components/, ui/)                           │
│  React Server Components + Client Components                │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                 Auth Context (AuthProvider)                   │
│  - Estado de sesión (localStorage)                           │
│  - login(), logout(), hasRole()                              │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│              Repository Layer (lib/repositories.ts)          │
│  - AuthRepository, VeterinarioRepository, ClienteRepository   │
│  - MascotaRepository, CitaRepository, CasoRepository          │
│  - VacunaRepository, TratamientoRepository, etc.             │
│  - Simula latencia con delay(50ms)                           │
│  - Cada método async devuelve copia de datos                 │
│  - CREATE/UPDATE/DELETE loguea en auditLogs automáticamente   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                  Mock Data (lib/mock-data.ts)                 │
│  - Arrays TypeScript con ~180+ registros                     │
│  - Datos estáticos pero mutables (se modifican al CRUD)      │
│  - IDs consistentes: cli_XXX, mas_XXX, cit_XXX, etc.         │
│  - Fechas en formato ISO 8601 (sin timezone, UTC-5 implícito)│
└─────────────────────────────────────────────────────────────┘
```

**Patrón de acceso a datos:**
1. Los componentes llaman a métodos del Repository
2. El Repository lee/modifica los arrays de `mock-data.ts`
3. Cada operación CREATE/UPDATE/DELETE genera un `auditLog`
4. Los datos se devuelven como copias (`{ ...obj }`) para evitar mutaciones directas desde UI

**Nota importante:** Los datos mock son **mutables en memoria**. Si creas un cliente, persiste durante toda la sesión del servidor Next.js (se resetea con cada recarga del servidor). En producción con el backend real, cada método del Repository se reemplazaría por llamadas HTTP al API REST.

---

## Sistema de Autenticación

### Implementación

- **Contexto:** `AuthProvider` en `components/auth-provider.tsx`
- **Persistencia:** `localStorage` con clave `nanivet_auth`
- **Verificación:** `AdminGuard` en `components/admin/admin-guard.tsx` redirige a `LoginForm` si no hay usuario
- **Validación:** El `Repository` busca por email y password plano en el array de usuarios mock

### Flujo de Login

```
LoginPage → login(email, password)
  → AuthRepository.login(email, password)
    → Busca en usuarios[] por email + password
    → Devuelve UsuarioAuth o null
  → Si exitoso: localStorage.setItem('nanivet_auth', JSON.stringify(user))
  → Redirige a /admin
```

### Credenciales de Prueba

| Email | Password | Rol | Nombre |
|---|---|---|---|
| `admin@nanivet.com` | `nanivet123` | `admin` | Admin NANIVET |
| `veterinario@nanivet.com` | `nanivet123` | `veterinario` | Dra. Nicole Pérez |
| `recepcion@nanivet.com` | `nanivet123` | `recepcionista` | Carlos Mendoza |

### Flujo de Agendamiento Público

```
/agendar → Formulario multi-paso (servicio → vet → fecha/hora → datos cliente/mascota)
  → CitaRepository.create(citaData)
    → Genera token único (genToken())
    → CitaRepository.getSlotsOcupados() para verificar disponibilidad
    → Si tipo_servicio=cirugía y estado=confirmada: crear hospitalización automática
  → WhatsApp: wa.me/593{telefono}?text=Hola {{dueno}}, su cita para {{mascota}}...
```

---

## Datos Mock — Referencia Completa

Todos los datos mock están definidos en **`lib/mock-data.ts`**. A continuación se documenta cada entidad con su estructura, valores y relaciones.

### Modelos de Datos

Las interfaces TypeScript están en **`lib/models.ts`**. Aquí el resumen de cada una:

---

### 1. Usuarios

```typescript
interface UsuarioAuth {
  id: string;           // ej: 'usr_001'
  nombre: string;       // ej: 'Dra. Nicole Pérez'
  email: string;        // ej: 'veterinario@nanivet.com'
  password: string;     // 'nanivet123' (plano, solo para mock)
  rol: 'admin' | 'veterinario' | 'recepcionista';
  veterinarioId?: string; // vincula al veterinario (solo rol veterinario)
}
```

**Registros (3):**

| id | nombre | email | rol | veterinarioId |
|---|---|---|---|---|
| usr_001 | Dra. Nicole Pérez | veterinario@nanivet.com | veterinario | vet_001 |
| usr_002 | Carlos Mendoza | recepcion@nanivet.com | recepcionista | — |
| usr_003 | Admin NANIVET | admin@nanivet.com | admin | — |

---

### 2. Veterinarios

```typescript
interface Veterinario {
  id: string;              // ej: 'vet_001'
  nombre: string;          // ej: 'Dra. Nicole Pérez'
  especialidad: string;    // ej: 'Medicina interna'
  telefono: string;        // ej: '0991234567'
  horario: {
    inicio: string;        // ej: '08:00'
    fin: string;           // ej: '17:00'
    dias: number[];        // [1,2,3,4,5,6] (0=Dom, 1=Lun, ..., 6=Sáb)
    intervalo: number;     // 30 (minutos por slot)
  };
}
```

**Registros (3):**

| id | nombre | especialidad | teléfono | horario | días | intervalo |
|---|---|---|---|---|---|---|
| vet_001 | Dra. Nicole Pérez | Medicina interna | 0991234567 | 08:00–17:00 | Lun–Sáb | 30 min |
| vet_002 | Dr. Andrés Torres | Cirugía | 0987654321 | 09:00–18:00 | Lun–Vie | 30 min |
| vet_003 | Dra. Sofía Vera | Dermatología | 0971122334 | 08:00–16:00 | Lun–Sáb | 30 min |

**Horarios Bloqueados (2):**

| id | veterinarioId | fecha | motivo |
|---|---|---|---|
| blk_001 | vet_001 | 2026-10-16 | Capacitación |
| blk_002 | vet_002 | 2026-10-20 | Cirugía programada externa |

---

### 3. Clientes

```typescript
interface Cliente {
  id: string;                     // ej: 'cli_001'
  nombre: string;                 // ej: 'María'
  apellido: string;               // ej: 'González'
  telefono: string;               // ej: '0991122334'
  cedula: string;                 // ej: '0901234567' (única)
  email: string | null;
  direccion: string | null;
  consentimientoDatos: {
    aceptado: boolean;            // OBLIGATORIO para crear cliente
    fechaHora: string | null;     // ISO 8601
    versionAviso: string | null;  // ej: '1.0'
  };
  consentimientoComunicaciones: {
    aceptado: boolean;            // Para campañas
    fechaHora: string | null;
  };
  fechaRevocacion: string | null; // Cuando revoca consentimiento
}
```

**Registros (10):**

| id | nombre | apellido | teléfono | cédula | email | consentimiento datos | comunicaciones |
|---|---|---|---|---|---|---|---|
| cli_001 | María | González | 0991122334 | 0901234567 | maria.gonzalez@email.com | ✅ 2026-09-01 | ✅ |
| cli_002 | Juan | Caicedo | 0992233445 | 0902345678 | juan.caicedo@email.com | ✅ 2026-08-15 | ✅ |
| cli_003 | Lucía | Mendoza | 0993344556 | 0903456789 | lucia.mendoza@email.com | ✅ 2026-07-20 | ✅ |
| cli_004 | Pedro | Intriago | 0994455667 | 0904567890 | pedro.intriago@email.com | ✅ 2026-06-10 | ✅ |
| cli_005 | Ana | Quintero | 0995566778 | 0905678901 | null | ✅ 2026-05-05 | ❌ |
| cli_006 | Luis | Briones | 0996677889 | 0906789012 | luis.briones@email.com | ✅ 2026-04-12 | ✅ |
| cli_007 | Carmen | Saltos | 0997788990 | 0907890123 | carmen.saltos@email.com | ✅ 2026-03-18 | ✅ |
| cli_008 | Diego | Vera | 0998899001 | 0908901234 | diego.vera@email.com | ✅ 2026-02-22 | ✅ |
| cli_009 | Rosa | Paredes | 0999900112 | 0909012345 | null | ✅ 2026-01-15 | ❌ |
| cli_010 | Fernando | Mora | 0980011223 | 0910123456 | fernando.mora@email.com | ✅ 2026-09-28 | ✅ |

---

### 4. Mascotas

```typescript
interface Mascota {
  id: string;              // ej: 'mas_001'
  clienteId: string;       // FK → clientes.id
  nombre: string;          // ej: 'Max'
  especie: string;         // 'Perro' \| 'Gato' \| 'Conejo' \| 'Ave'
  sexo: string;            // 'Macho' \| 'Hembra'
  fechaNacimiento: string; // ISO 8601 (YYYY-MM-DD)
  raza?: string | null;
  color?: string | null;
  esterilizado?: boolean;
  microchip?: string | null;
  alergias?: string | null;
  notas?: string | null;
}
```

**Registros (20):**

| id | cliente | nombre | especie | sexo | nacimiento | raza | color | esterilizado | microchip | alergias | notas |
|---|---|---|---|---|---|---|---|---|---|---|---|
| mas_001 | cli_001 | Max | Perro | Macho | 2022-03-15 | Labrador Retriever | Dorado | ✅ | 985112233445566 | — | Muy activo y juguetón |
| mas_002 | cli_001 | Luna | Gato | Hembra | 2021-06-20 | Siamés | Crema | ✅ | — | Pólen | — |
| mas_003 | cli_002 | Rocky | Perro | Macho | 2020-01-10 | Bulldog Francés | B/N | ❌ | 985112233445567 | — | Tendencia a sobrepeso |
| mas_004 | cli_003 | Mia | Gato | Hembra | 2023-02-05 | Mestizo | Gris | ❌ | — | — | — |
| mas_005 | cli_003 | Coco | Conejo | Macho | 2023-05-12 | Mini Lop | Marrón | ✅ | — | — | Come mucho heno |
| mas_006 | cli_004 | Thor | Perro | Macho | 2019-11-03 | Pastor Alemán | N/N | ✅ | 985112233445568 | Ciprofloxacino | Displasia de cadera |
| mas_007 | cli_005 | Kiara | Perro | Hembra | 2022-08-22 | Poodle | Blanco | ✅ | 985112233445569 | — | — |
| mas_008 | cli_006 | Simba | Gato | Macho | 2021-09-18 | Maine Coon | Naranja | ✅ | — | — | Gato grande, 7kg |
| mas_009 | cli_006 | Nina | Ave | Hembra | 2023-01-30 | Periquito | V/A | ❌ | — | — | — |
| mas_010 | cli_007 | Bruno | Perro | Macho | 2020-07-14 | Rottweiler | N/N | ✅ | 985112233445570 | — | Perro guardián |
| mas_011 | cli_008 | Bella | Perro | Hembra | 2023-04-25 | Beagle | Tricolor | ❌ | — | Polvo | — |
| mas_012 | cli_008 | Mishi | Gato | Hembra | 2022-12-01 | Persa | Blanco | ✅ | 985112233445571 | — | Requiere cepillado diario |
| mas_013 | cli_009 | Toby | Perro | Macho | 2018-03-20 | Mestizo | Café | ✅ | 985112233445572 | Penicilina | Perro senior, artritis |
| mas_014 | cli_009 | Pelusa | Gato | Hembra | 2021-04-10 | Angora | Blanco | ✅ | — | — | — |
| mas_015 | cli_010 | Duke | Perro | Macho | 2022-05-08 | Siberian Husky | G/B | ❌ | 985112233445573 | — | Ojos heterocromáticos |
| mas_016 | cli_002 | Canela | Gato | Hembra | 2023-06-15 | Mestizo | Atigrada | ❌ | — | — | — |
| mas_017 | cli_004 | Piolín | Ave | Macho | 2023-08-03 | Canario | Amarillo | ❌ | — | — | Canta mucho |
| mas_018 | cli_005 | Zoe | Perro | Hembra | 2021-10-12 | Chihuahua | Café claro | ✅ | — | — | Necesita limpieza dental |
| mas_019 | cli_007 | Ginger | Conejo | Hembra | 2023-03-22 | Cabeza de León | Naranja | ✅ | — | — | — |
| mas_020 | cli_010 | Arya | Gato | Hembra | 2022-02-28 | Bengala | Atigrado | ✅ | 985112233445574 | Anestesia inhalatoria | Muy enérgica |

---

### 5. Citas

```typescript
interface Cita {
  id: string;                  // ej: 'cit_001'
  mascotaId: string;           // FK → mascotas.id
  veterinarioId: string;       // FK → veterinarios.id
  tipoServicio: TipoServicio;  // 'consulta' \| 'vacunacion' \| 'cirugia' \| 'desparasitacion' \| 'urgencia' \| 'estetica' \| 'control'
  fechaHora: string;           // ISO 8601
  estado: EstadoCita;          // 'pendiente' \| 'confirmada' \| 'atendida' \| 'cancelada' \| 'no_asistio'
  motivo: string;              // ej: 'Vacunación anual'
  notas: string;               // ej: 'Ayuno 12h'
  token?: string;              // Token único para enlace público
  motivoCancelacion?: string | null;
  fechaConfirmacion?: string | null;
  ultimoCambioPor?: string | null;  // 'recepcion' \| 'cliente' \| 'veterinario'
  confirmadaPorCliente?: boolean;
  canceladaPorCliente?: boolean;
}
```

**Registros (30):**

| id | mascota | veterinario | tipo | fecha/hora | estado | motivo | token |
|---|---|---|---|---|---|---|---|
| cit_001 | mas_001 | vet_001 | consulta | 2026-10-15 09:00 | confirmada | Vacunación anual | tok_cit001_abcd |
| cit_002 | mas_006 | vet_001 | control | 2026-10-15 10:30 | confirmada | Control displasia cadera | tok_cit002_efgh |
| cit_003 | mas_013 | vet_003 | consulta | 2026-10-15 11:00 | pendiente | Revisión artritis | tok_cit003_ijkl |
| cit_004 | mas_003 | vet_002 | cirugía | 2026-10-15 14:00 | confirmada | Castración | tok_cit004_mnop |
| cit_005 | mas_010 | vet_001 | vacunación | 2026-10-15 15:30 | pendiente | Refuerzo antirrábica | tok_cit005_qrst |
| cit_006 | mas_002 | vet_003 | consulta | 2026-10-16 09:00 | confirmada | Alergia piel | tok_cit006_uvwx |
| cit_007 | mas_007 | vet_001 | estética | 2026-10-16 10:00 | pendiente | Baño y corte | tok_cit007_yzab |
| cit_008 | mas_015 | vet_002 | consulta | 2026-10-16 11:30 | confirmada | Chequeo general | tok_cit008_cdef |
| cit_009 | mas_008 | vet_003 | consulta | 2026-10-17 09:30 | confirmada | Control peso | tok_cit009_ghij |
| cit_010 | mas_011 | vet_001 | vacunación | 2026-10-17 11:00 | pendiente | Primera vacuna cachorro | tok_cit010_klmn |
| cit_011 | mas_020 | vet_002 | cirugía | 2026-10-17 14:00 | confirmada | Esterilización | tok_cit011_opqr |
| cit_012 | mas_004 | vet_001 | urgencia | 2026-10-18 10:00 | atendida | Vómitos persistentes | tok_cit012_stuv |
| cit_013 | mas_009 | vet_003 | consulta | 2026-10-19 10:00 | pendiente | Revisión general ave | tok_cit013_wxyz |
| cit_014 | mas_012 | vet_001 | estética | 2026-10-19 14:30 | confirmada | Baño y peinado | tok_cit014_abc1 |
| cit_015 | mas_005 | vet_001 | desparasitación | 2026-10-20 09:00 | pendiente | Desparasitación trimestral | tok_cit015_def2 |
| cit_016 | mas_014 | vet_003 | control | 2026-10-20 11:00 | confirmada | Control rutina | tok_cit016_ghi3 |
| cit_017 | mas_017 | vet_001 | consulta | 2026-10-21 10:00 | pendiente | Chequeo canario | tok_cit017_jkl4 |
| cit_018 | mas_018 | vet_003 | consulta | 2026-10-21 15:00 | confirmada | Limpieza dental | tok_cit018_mno5 |
| cit_019 | mas_019 | vet_001 | desparasitación | 2026-10-22 09:30 | pendiente | Desparasitación | tok_cit019_pqr6 |
| cit_020 | mas_016 | vet_002 | vacunación | 2026-10-22 11:30 | pendiente | Triple felina | tok_cit020_stu7 |
| cit_021 | mas_001 | vet_001 | control | 2026-10-23 10:00 | pendiente | Control post-vacuna | tok_cit021_vwx8 |
| cit_022 | mas_010 | vet_002 | consulta | 2026-10-23 14:00 | pendiente | Chequeo general | tok_cit022_yza9 |
| cit_023 | mas_006 | vet_001 | consulta | 2026-10-24 09:00 | pendiente | Seguimiento displasia | tok_cit023_bcd0 |
| cit_024 | mas_001 | vet_001 | consulta | 2026-10-08 09:00 | atendida | Chequeo anual | tok_cit024_efg1 |
| cit_025 | mas_003 | vet_002 | consulta | 2026-10-08 11:00 | atendida | Problema dermatológico | tok_cit025_hij2 |
| cit_026 | mas_008 | vet_003 | consulta | 2026-10-10 10:00 | atendida | Dermatitis | tok_cit026_klm3 |
| cit_027 | mas_013 | vet_001 | vacunación | 2026-10-05 09:30 | atendida | Refuerzo múltiple | tok_cit027_nop4 |
| cit_028 | mas_020 | vet_002 | cirugía | 2026-10-03 08:00 | atendida | Cirugía previa | tok_cit028_qrs5 |
| cit_029 | mas_014 | vet_001 | consulta | 2026-10-09 14:00 | cancelada | Consulta general | tok_cit029_tuv6 |
| cit_030 | mas_011 | vet_003 | control | 2026-10-11 16:00 | no_asistió | Control vacunal | tok_cit030_wxy7 |

**Estados de cita:**

| Estado | Label | Color |
|---|---|---|
| pendiente | Pendiente | Amber |
| confirmada | Confirmada | Sky |
| atendida | Atendida | Emerald |
| cancelada | Cancelada | Red |
| no_asistió | No asistió | Orange |

**Tipos de servicio:**

| Tipo | Label | Color |
|---|---|---|
| consulta | Consulta | Sky |
| vacunación | Vacunación | Emerald |
| cirugía | Cirugía | Red |
| desparasitación | Desparasitación | Amber |
| urgencia | Urgencia | Orange |
| estética | Estética | Pink |
| control | Control | Violet |

---

### 6. Casos Clínicos

```typescript
interface CasoClinico {
  id: string;            // ej: 'cas_001'
  mascotaId: string;     // FK → mascotas.id
  motivo: string;        // ej: 'Chequeo anual y vacunación'
  soap: SOAP;            // Ver estructura abajo
  diagnostico: string;   // ej: 'Paciente sano - control de rutina'
  estado: EstadoCaso;    // 'abierto' \| 'seguimiento' \| 'cerrado'
  fecha: string;         // ISO 8601
  veterinarioId: string; // FK → veterinarios.id
}

interface SOAP {
  subjetivo: string;  // Lo que reporta el dueño / síntomas
  objetivo: string;   // Signos vitales, exploración física
  analisis: string;   // Diagnóstico diferencial
  plan: string;       // Tratamiento, seguimiento
}
```

**Registros (15):**

| id | mascota | motivo | diagnóstico | estado | veterinario | fecha |
|---|---|---|---|---|---|---|
| cas_001 | mas_001 | Chequeo anual y vacunación | Paciente sano - control de rutina | cerrado | vet_001 | 2026-10-08 |
| cas_002 | mas_006 | Displasia de cadera - manejo crónico | Displasia de cadera bilateral grado 2 | seguimiento | vet_001 | 2026-10-08 |
| cas_003 | mas_003 | Problema dermatológico | Dermatitis alérgica por pulgas | cerrado | vet_002 | 2026-10-08 |
| cas_004 | mas_008 | Dermatitis felina | Dermatitis por pulgas | cerrado | vet_003 | 2026-10-10 |
| cas_005 | mas_013 | Artritis - manejo crónico en paciente senior | Artritis degenerativa múltiples articulaciones | seguimiento | vet_001 | 2026-10-05 |
| cas_006 | mas_020 | Cirugía de esterilización | Para esterilización electiva | abierto | vet_002 | 2026-10-03 |
| cas_007 | mas_003 | Castración | Para castración electiva | abierto | vet_002 | 2026-10-15 |
| cas_008 | mas_002 | Alergia cutánea felina | Dermatitis alérgica (pólen) | seguimiento | vet_003 | 2026-10-12 |
| cas_009 | mas_004 | Vómitos persistentes | Gastroenteritis aguda | abierto | vet_001 | 2026-10-18 |
| cas_010 | mas_007 | Control de peso | Paciente sana | cerrado | vet_001 | 2026-09-28 |
| cas_011 | mas_010 | Vacunación y chequeo | Paciente sano - vacunación | cerrado | vet_001 | 2026-09-20 |
| cas_012 | mas_015 | Chequeo general pre-cirugía | Sano - pre-quirúrgico | cerrado | vet_002 | 2026-09-25 |
| cas_013 | mas_018 | Problema dental | Enfermedad periodontal grado 2 | seguimiento | vet_003 | 2026-10-01 |
| cas_014 | mas_005 | Consulta general conejo | Conejo sano | cerrado | vet_001 | 2026-09-15 |
| cas_015 | mas_009 | Revisión general ave | Muda de plumaje | seguimiento | vet_003 | 2026-10-02 |

---

### 7. Vacunas

```typescript
interface Vacuna {
  id: string;               // ej: 'vac_001'
  mascotaId: string;        // FK → mascotas.id
  casoId: string | null;    // FK → casos_clinicos.id (opcional)
  nombre: string;           // ej: 'Antirrábica'
  lote: string;             // ej: 'AR-2026-001'
  fechaAplicacion: string;  // YYYY-MM-DD
  proximaDosis: string;     // YYYY-MM-DD
  veterinarioId: string;    // FK → veterinarios.id
}
```

**Registros (12):**

| id | mascota | nombre | lote | aplicada | próxima dosis | veterinario |
|---|---|---|---|---|---|---|
| vac_001 | mas_001 | Antirrábica | AR-2026-001 | 2026-10-08 | 2027-10-08 | vet_001 |
| vac_002 | mas_001 | Múltiple Canina (DA2PP) | MC-2026-003 | 2026-10-08 | 2027-10-08 | vet_001 |
| vac_003 | mas_002 | Triple Felina | TF-2026-010 | 2026-09-10 | 2027-09-10 | vet_003 |
| vac_004 | mas_003 | Antirrábica | AR-2026-005 | 2026-06-15 | 2027-06-15 | vet_002 |
| vac_005 | mas_006 | Múltiple Canina (DA2PP) | MC-2026-008 | 2026-05-20 | 2027-05-20 | vet_001 |
| vac_006 | mas_010 | Antirrábica | AR-2026-012 | 2026-09-20 | 2027-09-20 | vet_001 |
| vac_007 | mas_010 | Múltiple Canina (DA2PP) | MC-2026-015 | 2026-09-20 | 2027-09-20 | vet_001 |
| vac_008 | mas_013 | Refuerzo Múltiple | MC-2026-020 | 2026-10-05 | 2027-10-05 | vet_001 |
| vac_009 | mas_015 | Antirrábica | AR-2026-025 | 2026-08-10 | 2027-08-10 | vet_002 |
| vac_010 | mas_011 | Primera Dosis Cachorro | PC-2026-030 | 2026-09-01 | 2026-10-15 | vet_001 |
| vac_011 | mas_016 | Triple Felina | TF-2026-035 | 2026-07-20 | 2026-10-20 | vet_002 |
| vac_012 | mas_008 | Antirrábica | AR-2026-040 | 2026-06-01 | 2026-12-01 | vet_003 |

---

### 8. Tratamientos

```typescript
interface Tratamiento {
  id: string;              // ej: 'tra_001'
  mascotaId: string;       // FK → mascotas.id
  casoId: string | null;   // FK → casos_clinicos.id
  nombre: string;          // ej: 'Meloxicam 1.5mg/ml'
  dosis: string;           // ej: '0.1mg/kg PO cada 24h'
  duracion: string;        // ej: '30 días'
  fecha: string;           // YYYY-MM-DD
  veterinarioId: string;   // FK → veterinarios.id
}
```

**Registros (10):**

| id | mascota | nombre | dosis | duración | fecha | veterinario |
|---|---|---|---|---|---|---|
| tra_001 | mas_006 | Meloxicam 1.5mg/ml | 0.1mg/kg PO cada 24h | 30 días | 2026-10-08 | vet_001 |
| tra_002 | mas_006 | Condroitina + Glucosamina | 1 comprimido PO cada 24h | Continuo | 2026-10-08 | vet_001 |
| tra_003 | mas_003 | Prednisolona 5mg | 0.5mg/kg PO cada 12h | 7 días | 2026-10-08 | vet_002 |
| tra_004 | mas_003 | Spot-on antipulgas (Fipronil) | 1 aplicación tópica | Único | 2026-10-08 | vet_002 |
| tra_005 | mas_008 | Spot-on antipulgas (Selamectina) | 1 aplicación tópica en nuca | Mensual | 2026-10-10 | vet_003 |
| tra_006 | mas_013 | Carprofeno 50mg | 2mg/kg PO cada 12h | 15 días | 2026-10-05 | vet_001 |
| tra_007 | mas_013 | Omega 3 (EPA/DHA) | 1 cápsula PO cada 24h | Continuo | 2026-10-05 | vet_001 |
| tra_008 | mas_002 | Clorfenamina 4mg | 2mg PO cada 12h | 10 días | 2026-10-12 | vet_003 |
| tra_009 | mas_004 | Maropitant (Cerenia) | 1mg/kg SC | Único | 2026-10-18 | vet_001 |
| tra_010 | mas_018 | Amoxicilina + Ácido Clavulánico | 12.5mg/kg PO cada 12h | 10 días | 2026-10-01 | vet_003 |

---

### 9. Desparasitaciones

```typescript
interface Desparasitacion {
  id: string;              // ej: 'des_001'
  mascotaId: string;       // FK → mascotas.id
  casoId: string | null;
  producto: string;        // ej: 'Praziquantel + Febantel'
  dosis: string;           // ej: '1 tableta/10kg PO'
  fecha: string;           // YYYY-MM-DD
  proximaDosis: string;    // YYYY-MM-DD
  veterinarioId: string;
}
```

**Registros (7):**

| id | mascota | producto | dosis | fecha | próxima | veterinario |
|---|---|---|---|---|---|---|
| des_001 | mas_001 | Praziquantel + Febantel | 1 tableta/10kg PO | 2026-10-08 | 2027-01-08 | vet_001 |
| des_002 | mas_005 | Ivermectina 0.1% | 0.2mg/kg SC | 2026-09-15 | 2026-12-15 | vet_001 |
| des_003 | mas_010 | Praziquantel + Febantel | 1.5 tabletas PO | 2026-09-20 | 2026-12-20 | vet_001 |
| des_004 | mas_003 | Milbemicina Oxima | 1 tableta PO | 2026-08-01 | 2026-11-01 | vet_002 |
| des_005 | mas_013 | Praziquantel + Febantel | 1 tableta PO | 2026-07-10 | 2026-10-10 | vet_001 |
| des_006 | mas_008 | Emodepsida + Praziquantel (tópico) | 1 aplicación | 2026-08-20 | 2026-11-20 | vet_003 |
| des_007 | mas_019 | Ivermectina 0.1% | 0.2mg/kg SC | 2026-07-01 | 2026-10-01 | vet_001 |

---

### 10. Cirugías

```typescript
interface Cirugia {
  id: string;              // ej: 'cir_001'
  mascotaId: string;
  casoId: string | null;
  tipo: string;            // ej: 'OVH (Esterilización)'
  fecha: string;           // YYYY-MM-DD
  veterinarioId: string;
  anestesia: string;       // ej: 'Total intravenosa (Propofol + Ketamina)'
  notas: string;
  prognosis: string;       // ej: 'Excelente'
}
```

**Registros (3):**

| id | mascota | tipo | fecha | anestesia | prognosis |
|---|---|---|---|---|---|
| cir_001 | mas_020 | OVH (Esterilización) | 2026-10-03 | Total intravenosa (Propofol + Ketamina) | Excelente |
| cir_002 | mas_020 | Limpieza dental + extracción | 2026-10-17 | Total intravenosa | Buena |
| cir_003 | mas_003 | Orquiectomía (Castración) | 2026-10-15 | General inhalatoria (Isoflurano) | Excelente |

---

### 11. Exámenes Adjuntos

```typescript
interface Examen {
  id: string;              // ej: 'exa_001'
  mascotaId: string;
  casoId: string | null;
  tipo: string;            // 'Radiografía' \| 'Análisis de sangre' \| 'Ecografía' \| 'Examen dental' \| 'Raspado de piel' \| 'Examen pre-anestésico'
  descripcion: string;
  fecha: string;           // YYYY-MM-DD
  veterinarioId: string;
}
```

**Registros (7):**

| id | mascota | tipo | descripción | fecha | veterinario |
|---|---|---|---|---|---|
| exa_001 | mas_006 | Radiografía | Radiografía de cadera bilateral | 2026-09-15 | vet_001 |
| exa_002 | mas_006 | Análisis de sangre | Hemograma y bioquímica | 2026-09-15 | vet_001 |
| exa_003 | mas_020 | Examen pre-anestésico | Perfil pre-quirúrgico completo | 2026-10-02 | vet_002 |
| exa_004 | mas_013 | Radiografía | Radiografía de articulaciones | 2026-08-20 | vet_001 |
| exa_005 | mas_004 | Radiografía abdominal | Descartar cuerpo extraño | 2026-10-18 | vet_001 |
| exa_006 | mas_018 | Examen dental | Evaluación periodontal | 2026-10-01 | vet_003 |
| exa_007 | mas_003 | Raspado de piel | Descartar demodicosis | 2026-10-08 | vet_002 |

---

### 12. Registros de Peso

```typescript
interface PesoRegistrado {
  id: string;              // ej: 'pes_001'
  mascotaId: string;
  peso: number;            // kg
  fecha: string;           // YYYY-MM-DD
}
```

**Registros (20):** 5 registros por mascota (Max, Thor, Rocky, Toby)

| id | mascota | peso (kg) | fecha |
|---|---|---|---|
| pes_001 | mas_001 (Max) | 25.0 | 2025-10-08 |
| pes_002 | mas_001 (Max) | 26.5 | 2026-01-15 |
| pes_003 | mas_001 (Max) | 27.0 | 2026-04-10 |
| pes_004 | mas_001 (Max) | 28.0 | 2026-07-05 |
| pes_005 | mas_001 (Max) | 28.5 | 2026-10-08 |
| pes_006 | mas_006 (Thor) | 35.0 | 2025-10-01 |
| pes_007 | mas_006 (Thor) | 34.5 | 2026-01-10 |
| pes_008 | mas_006 (Thor) | 34.0 | 2026-04-15 |
| pes_009 | mas_006 (Thor) | 33.5 | 2026-07-08 |
| pes_010 | mas_006 (Thor) | 33.0 | 2026-10-08 |
| pes_011 | mas_003 (Rocky) | 9.0 | 2025-09-01 |
| pes_012 | mas_003 (Rocky) | 10.5 | 2026-01-20 |
| pes_013 | mas_003 (Rocky) | 11.0 | 2026-04-10 |
| pes_014 | mas_003 (Rocky) | 11.5 | 2026-07-15 |
| pes_015 | mas_003 (Rocky) | 12.0 | 2026-10-08 |
| pes_016 | mas_013 (Toby) | 18.0 | 2025-10-05 |
| pes_017 | mas_013 (Toby) | 17.5 | 2026-01-08 |
| pes_018 | mas_013 (Toby) | 17.0 | 2026-04-10 |
| pes_019 | mas_013 (Toby) | 16.8 | 2026-07-02 |
| pes_020 | mas_013 (Toby) | 16.5 | 2026-10-05 |
```

**Nota:** Los pesos también se registran automáticamente cuando un veterinario marca una cita como "atendida" y proporciona el peso en el formulario de la cita.

---

### 19. Puntuaciones de Cita

```typescript
interface PuntuacionCita {
  id: string;              // ej: 'pnt_001'
  citaId: string;          // FK → citas.id
  token: string;           // Token único para enlace público
  mascotaId: string;       // FK → mascotas.id
  veterinarioId: string;   // FK → veterinarios.id
  calificacion: number;    // 1-5 (0 si no respondida)
  recomienda: boolean | null; // null = pendiente (no respondida)
  comentario: string | null;
  fechaRespuesta: string | null;
  respondida: boolean;
}
```

**Flujo de Puntuación:**
1. Cuando un administrador/veterinario marca una cita como "atendida" en la página de citas, el sistema genera automáticamente una `PuntuacionCita` pendiente con un token único.
2. El cliente recibe un enlace público `/puntuar/{citaId}` para calificar la atención.
3. La página de puntuación muestra:
   - Información de la cita (mascota, dueño, servicio, veterinario, fecha)
   - Rating de 1 a 5 estrellas con hover interactivo
   - Botón "¿Recomienda?" con opciones Sí/No
   - Campo de comentario opcional (máximo 500 caracteres)
4. Las puntuaciones se acumulan y se muestran en el dashboard de administración con:
   - Promedio general
   - Total de recomendaciones
   - Distribución por estrellas (gráfico de barras)
   - Filtro por pendientes/respondidas
5. Las puntuaciones pendientes se pueden ver en la sección `/admin/puntuaciones`

**Registros (8 — 5 respondidas, 3 pendientes):**

| id | cita | token | mascota | veterinario | calificación | recomienda | comentario | respondida |
|---|---|---|---|---|---|---|---|---|
| pnt_001 | cit_024 | tok_pnt001_abcd | mas_001 | vet_001 | ⭐⭐⭐⭐⭐ (5) | ✅ | Excelente atención, muy profesionales. | ✅ |
| pnt_002 | cit_025 | tok_pnt002_efgh | mas_003 | vet_002 | ⭐⭐⭐⭐ (4) | ✅ | Buena atención, el wait fue un poco largo. | ✅ |
| pnt_003 | cit_026 | tok_pnt003_ijkl | mas_008 | vet_003 | ⭐⭐⭐⭐⭐ (5) | ✅ | Muy agradecida con la Dra. Vera. | ✅ |
| pnt_004 | cit_027 | tok_pnt004_mnop | mas_013 | vet_001 | ⭐⭐⭐⭐⭐ (5) | ✅ | Muy buen trato con Toby, explicaron todo bien. | ✅ |
| pnt_005 | cit_028 | tok_pnt005_qrst | mas_020 | vet_002 | ⭐⭐⭐⭐ (4) | ✅ | — | ✅ |
| pnt_006 | cit_002 | tok_pnt006_uvwx | mas_006 | vet_001 | — | — | — | ❌ Pendiente |
| pnt_007 | cit_004 | tok_pnt007_yzab | mas_003 | vet_002 | — | — | — | ❌ Pendiente |
| pnt_008 | cit_006 | tok_pnt008_cdef | mas_002 | vet_003 | — | — | — | ❌ Pendiente |

---

### 20. Hospitalizaciones

```typescript
interface Hospitalizacion {
  id: string;              // ej: 'hos_001'
  mascotaId: string;
  casoId: string | null;
  veterinarioId: string;
  citaId: string | null;
  fechaIngreso: string;    // ISO 8601
  fechaAlta: string | null;
  jaulaArea: string;       // ej: 'A-01'
  motivo: string;
  estado: 'hospitalizado' \| 'alta';
  resumenAlta?: string | null;
  indicacionesAlta?: string | null;
}
```

**Registros (3 — 2 activas, 1 con alta):**

| id | mascota | motivo | jaula | estado | ingreso | alta | resumen |
|---|---|---|---|---|---|---|---|
| hos_001 | mas_020 | Post-operatorio OVH - observación 24h | A-01 | hospitalizado | 2026-10-14 08:00 | — | — |
| hos_002 | mas_004 | Gastroenteritis aguda - fluidos IV | B-03 | hospitalizado | 2026-10-15 07:00 | — | — |
| hos_003 | mas_013 | Crisis artrítica - manejo del dolor | A-02 | alta | 2026-10-13 10:00 | 2026-10-14 16:00 | Paciente estable, responde a AINEs. Dolor controlado. |

---

### 22. Medicaciones

```typescript
interface TomaMedicacion {
  fecha: string;           // YYYY-MM-DD
  hora: string;            // ej: '08:00'
  administrada: boolean;
  horaReal: string | null;
  usuario: string | null;
}

interface Medicacion {
  id: string;                    // ej: 'med_001'
  hospitalizacionId: string;     // FK → hospitalizaciones.id
  medicamento: string;           // ej: 'Tramadol 50mg'
  dosis: string;                 // ej: '2mg/kg'
  via: string;                   // 'IV' \| 'SC' \| 'PO'
  frecuencia: string;            // ej: 'Cada 8h'
  horasProgramadas: string[];    // ej: ['08:00', '16:00', '00:00']
  fechaInicio: string;
  fechaFin: string | null;
  tomas: TomaMedicacion[];       // Array de tomas registradas
}
```

**Registros (4):**

| id | hospitalización | medicamento | dosis | vía | frecuencia | horas | tomas |
|---|---|---|---|---|---|---|---|
| med_001 | hos_001 | Tramadol 50mg | 2mg/kg | IV | Cada 8h | 08:00, 16:00, 00:00 | 3 admin, 1 pendiente |
| med_002 | hos_001 | Amoxicilina + Á. Clavulánico | 12.5mg/kg | SC | Cada 12h | 09:00, 21:00 | 2 admin, 1 pendiente |
| med_003 | hos_002 | Ringer Lactato | 20ml/kg/h | IV | Flujo continuo | continuo | 1 admin, 1 pendiente |
| med_004 | hos_002 | Maropitant (Cerenia) | 1mg/kg | SC | Cada 24h | 08:00 | 1 admin |

---

### 23. Evoluciones Diarias

```typescript
interface EvolucionDiaria {
  id: string;                    // ej: 'evd_001'
  hospitalizacionId: string;     // FK → hospitalizaciones.id
  fecha: string;                 // YYYY-MM-DD
  signosVitales: string;         // ej: 'T: 38.2°C, FC: 110 lpm, FR: 22 rpm'
  estadoGeneral: string;
  observaciones: string;
  veterinarioId: string;
}
```

**Registros (5):**

| id | hospitalización | fecha | signos vitales | estado general | veterinario |
|---|---|---|---|---|---|
| evd_001 | hos_001 | 2026-10-14 | T: 38.2°C, FC: 110 lpm, FR: 22 rpm | Recuperación post-quirúrgica normal | vet_002 |
| evd_002 | hos_001 | 2026-10-15 | T: 38.5°C, FC: 95 lpm, FR: 20 rpm | Alerta, responde a estímulos | vet_002 |
| evd_003 | hos_002 | 2026-10-15 | T: 38.0°C, FC: 140 lpm, FR: 28 rpm | Letárgica, responde al nombre | vet_001 |
| evd_004 | hos_003 | 2026-10-13 | T: 38.8°C, FC: 120 lpm, FR: 24 rpm | Dolor articular marcado | vet_001 |
| evd_005 | hos_003 | 2026-10-14 | T: 38.3°C, FC: 100 lpm, FR: 20 rpm | Mejoría notable | vet_001 |

---

### 24. Audit Logs

```typescript
interface AuditLog {
  id: string;                    // ej: 'aud_001'
  usuario: string;               // ej: 'Dra. Nicole Pérez'
  rol: string;                   // 'admin' \| 'veterinario' \| 'recepcionista' \| 'cliente'
  fechaHora: string;             // ISO 8601
  accion: string;                // 'crear' \| 'editar' \| 'eliminar' \| 'confirmar' \| 'cancelar' \| etc.
  entidad: string;               // 'Cliente' \| 'Cita' \| 'Vacuna' \| etc.
  entidadId: string;             // ej: 'cli_001'
  diff?: Array<{ campo: string; antes: unknown; despues: unknown }>;
  valoresDespues?: Record<string, unknown>;
}
```

**Registros (15):**

| id | usuario | rol | acción | entidad | entidad_id | diff |
|---|---|---|---|---|---|---|
| aud_001 | Dra. Nicole Pérez | veterinario | crear | CasoClinico | cas_007 | — |
| aud_002 | Carlos Mendoza | recepcionista | crear | Cita | cit_005 | — |
| aud_003 | Carlos Mendoza | recepcionista | confirmar | Cita | cit_001 | estado: pendiente → confirmada |
| aud_004 | Cliente (token) | cliente | confirmar | Cita | cit_006 | estado: pendiente → confirmada |
| aud_005 | Cliente (token) | cliente | cancelar | Cita | cit_029 | estado: pendiente → cancelada |
| aud_006 | Dra. Nicole Pérez | veterinario | crear | Vacuna | vac_001 | — |
| aud_007 | Carlos Mendoza | recepcionista | crear | Cliente | cli_010 | — |
| aud_008 | Admin NANIVET | admin | editar | Veterinario | vet_002 | horario.inicio: 08:00 → 09:00 |
| aud_009 | Dra. Nicole Pérez | veterinario | crear | CasoClinico | cas_005 | — |
| aud_010 | Carlos Mendoza | recepcionista | editar | Cita | cit_018 | estado: pendiente → confirmada |
| aud_011 | Admin NANIVET | admin | crear | Cirugia | cir_001 | — |
| aud_012 | Dra. Sofía Vera | veterinario | crear | CasoClinico | cas_008 | — |
| aud_013 | Carlos Mendoza | recepcionista | editar | Cita | cit_030 | estado: confirmada → no_asistio |
| aud_014 | Admin NANIVET | admin | enviar_campaña | Campana | cam_001 | — |
| aud_015 | Dra. Nicole Pérez | veterinario | alta_hospitalizacion | Hospitalizacion | hos_001 | estado: hospitalizado → alta |

---

### 25. Campañas

```typescript
interface CampanaEnvio {
  id: string;                    // ej: 'cme_001'
  segmento: SegmentoCampana;     // 'vacunas_vencidas' \| 'desparasitacion_pendiente' \| 'clientes_inactivos' \| 'cumpleanos_mascotas'
  clienteId: string;             // FK → clientes.id
  mascotaId: string | null;      // FK → mascotas.id
  motivo: string;                // ej: 'Vacuna antirrábica vence 2027-06-15 - refuerzo'
  fechaEnviado: string | null;   // ISO 8601
  enviadoPor: string;            // ej: 'Admin NANIVET'
}
```

**Registros (8):**

| id | segmento | cliente | mascota | motivo | fecha enviado | enviado por |
|---|---|---|---|---|---|---|
| cme_001 | vacunas_vencidas | cli_002 | mas_003 | Vacuna antirrábica vence 2027-06-15 | 2026-10-14 10:00 | Admin NANIVET |
| cme_002 | vacunas_vencidas | cli_007 | mas_010 | Refuerzo múltiple vence 2027-09-20 | 2026-10-14 10:00 | Admin NANIVET |
| cme_003 | vacunas_vencidas | cli_009 | mas_013 | Refuerzo vence 2027-10-05 | 2026-10-14 10:00 | Admin NANIVET |
| cme_004 | desparasitacion_pendiente | cli_001 | mas_001 | Desparasitación próxima: 2027-01-08 | 2026-10-13 09:00 | Admin NANIVET |
| cme_005 | desparasitacion_pendiente | cli_007 | mas_010 | Desparasitación próxima: 2026-12-20 | 2026-10-13 09:00 | Admin NANIVET |
| cme_006 | desparasitacion_pendiente | cli_009 | mas_013 | Desparasitación vencida desde 2026-10-10 | 2026-10-13 09:00 | Admin NANIVET |
| cme_007 | clientes_inactivos | cli_004 | mas_006 | Sin visitas desde hace más de 6 meses | 2026-10-12 11:00 | Admin NANIVET |
| cme_008 | cumpleanos_mascotas | cli_010 | mas_015 | Cumpleaños de Duke - 8 de mayo | 2026-05-08 08:00 | Admin NANIVET |

---

## Capa de Repositorios

La capa de repositorios (`lib/repositories.ts`) es un **abstracto sobre los datos mock**. Cada repositorio expone métodos `async` que:

1. Simulan latencia de red con `delay(50)` (50ms)
2. Devuelven **copias** de los datos (`{ ...obj }`, `[...array]`)
3. Los métodos de escritura (create/update/delete) modifican los arrays originales de `mock-data.ts`
4. Cada operación de escritura genera automáticamente un `auditLog`

### Repositorios Disponibles

| Repositorio | Métodos Principales |
|---|---|
| `AuthRepository` | `login(email, password)`, `getById(id)` |
| `VeterinarioRepository` | `getAll()`, `getById(id)`, `getBloqueos(vetId)`, `addBloqueo()`, `removeBloqueo(id)` |
| `ClienteRepository` | `getAll()`, `getById(id)`, `search(q)`, `create(data)`, `update(id, data)`, `delete(id)`, `revocarConsentimiento(id)`, `crearCliente(data)` |
| `MascotaRepository` | `getAll()`, `getById(id)`, `search(q)`, `create(data)`, `update(id, data)`, `delete(id)` |
| `CitaRepository` | `getAll()`, `getById(id)`, `getByFecha(fecha)`, `getByToken(token)`, `getSlotsOcupados(vetId, fecha)`, `create(data)`, `update(id, data)`, `delete(id)`, `confirmar(token)`, `cancelar(token, motivo)`, `reprogramar(token, nuevaFecha)` |
| `CasoRepository` | `getAll()`, `getById(id)`, `search(q)`, `create(data)`, `update(id, data)`, `delete(id)` |
| `VacunaRepository` | `getAll()`, `getByMascota(mascotaId)`, `getPorVencer(dias)`, `create(data)`, `delete(id)` |
| `TratamientoRepository` | `getAll()`, `getByMascota(mascotaId)`, `getByCaso(casoId)`, `create(data)`, `delete(id)` |
| `DesparasitacionRepository` | `getAll()`, `getByMascota(mascotaId)`, `getByCaso(casoId)`, `create(data)`, `delete(id)` |
| `CirugiaRepository` | `getAll()`, `getByMascota(mascotaId)`, `getByCaso(casoId)`, `create(data)`, `delete(id)` |
| `ExamenRepository` | `getAll()`, `getByMascota(mascotaId)`, `getByCaso(casoId)`, `create(data)`, `delete(id)` |
| `PesoRepository` | `getAll()`, `getByMascota(mascotaId)`, `create(mascotaId, peso)` |
| `HospitalizacionRepository` | `getAll()`, `getById(id)`, `getActivas()`, `create(data)`, `update(id, data)`, `darAlta(id, data)` |
| `MedicacionRepository` | `getByHospitalizacion(hospId)`, `create(hospId, data)`, `administrarToma(medId, tomaId, horaReal)` |
| `EvolucionRepository` | `getByHospitalizacion(hospId)`, `create(hospId, data)` |
| `AuditoriaRepository` | `getAll(filters)`, `getByEntidad(entidad, entidadId)`, `getStats()` |
| `CampanaRepository` | `getSegmentos()`, `getEnvios(filtros)` |

### Patrón de Auditoría

```typescript
// Cada repositorio usa este helper interno:
function logAudit(entry: Omit<AuditLog, 'id' | 'fechaHora'>): void {
  auditLogs.push({
    ...entry,
    id: genId('aud'),            // Genera 'aud_XXX'
    fechaHora: ahora()            // Fecha actual (America/Guayaquil)
  });
}
```

---

## Servicio de IA (Mock)

El servicio de IA (`lib/ai-service.ts`) simula respuestas de un LLM con delays de 1-2 segundos. **No se conecta a ningún servicio externo.**

### 1. `summarizeHistory()` — Resumir Historia Clínica

**Entrada:** mascota + casos + vacunas + tratamientos + desparasitaciones + cirugías + exámenes

**Lógica:**
- Calcula edad aproximada desde `fechaNacimiento`
- Lista alergias conocidas
- Resume casos clínicos (activos vs cerrados) con diagnósticos
- Resume vacunación (última vacuna, próxima dosis)
- Resume tratamientos, desparasitaciones, cirugías, exámenes
- A*Siempre** incluye disclaimer: *"Este resumen fue generado automáticamente por el asistente IA de NANIVET y debe ser validado por un veterinario."*

**Delay:** 1200ms

### 2. `notesToSOAP()` — Convertir Notas a SOAP

**Entrada:** notas libres (string)

**Lógica:**
- Divide las notas en líneas
- Clasifica cada línea en:
  - **Subjetivo:** palabras clave como "dueño", "reporta", "refiere", "señala", "queja"
  - **Objetivo:** "temp", "t:", "fc:", "fr:", "peso", "mucosa", "palpación", "observ"
  - **Análisis:** "dx", "diagnós", "sospech", "descartar", "probable"
  - **Plan:** "tratamiento", "recet", "indicar", "control", "recomend", "próxima", "seguimiento"
- Si no clasifica, pone en **Subjetivo** por defecto

**Delay:** 1500ms

### 3. `redactarMensaje()` — Redactar Mensaje para Dueño

**Entrada:** contexto (mascota, motivo, etc.)

**Lógica:**
- Usa plantillas de `PLANTILLAS_CAMPANA` en `constants.ts`
- Reemplaza variables: `{{dueno}}`, `{{mascota}}`, `{{fecha}}`, `{{hora}}`, `{{servicio}}`, `{{motivo}}`

**Delay:** 1000ms

### 4. `diagnosticosDiferenciales()` — Diagnósticos Diferenciales

**Entrada:** síntomas (string)

**Lógica:**
- Analiza síntomas keywords
- Devuelve lista de diagnósticos diferenciales con probabilidad (baja/media/alta)
- Siempre incluye disclaimer

**Delay:** 2000ms

---

## Rutas y Páginas

### Páginas Públicas

| Ruta | Descripción | Autenticación |
|---|---|---|
| `/` | Landing page (servicios, stats, contacto) | No |
| `/agendar` | Formulario multi-paso para agendar cita | No |
| `/agendar/cita/[token]` | Detalle de cita pública + acciones (confirmar, cancelar, reprogramar) | No |
| `/puntuar/[id]` | Formulario de puntuación de cita por ID (estrellas 1-5, recomienda, comentario) | No |

### Páginas de Administración (requieren login)

| Ruta | Descripción | Roles |
|---|---|---|
| `/admin` | Dashboard con métricas | admin, veterinario, recepcionista |
| `/admin/login` | Página de login (redirigido automáticamente por AdminGuard) | — |
| `/admin/calendario` | Calendario de citas por veterinario | admin, veterinario, recepcionista |
| `/admin/citas` | Lista y gestión de citas | admin, veterinario, recepcionista |
| `/admin/clientes` | Lista de clientes con búsqueda | admin, veterinario, recepcionista |
| `/admin/clientes/[id]` | Detalle de cliente (datos + mascotas + historial) | admin, veterinario, recepcionista |
| `/admin/mascotas` | Lista de mascotas con búsqueda | admin, veterinario, recepcionista |
| `/admin/mascotas/[id]` | Ficha clínica completa de mascota | admin, veterinario, recepcionista |
| `/admin/casos` | Lista de casos clínicos | admin, veterinario |
| `/admin/casos/new` | Nuevo caso clínico | admin, veterinario |
| `/admin/casos/[id]` | Detalle de caso (SOAP completo) | admin, veterinario |
| `/admin/vacunas` | Historial de vacunas con registro (mascota, vacuna, lote, fecha, veterinario) | admin, veterinario, recepcionista |
| `/admin/desparasitacion` | Historial de desparasitaciones con registro (mascota, producto, dosis, fecha, veterinario) | admin, veterinario, recepcionista |
| `/admin/hospitalizacion` | Gestión de hospitalización | admin, veterinario |
| `/admin/puntuaciones` | Puntuaciones y calificaciones (promedio, distribución, pendientes/respondidas) | admin, veterinario, recepcionista |
| `/admin/campanas` | Campañas de recordatorio | admin, veterinario, recepcionista |
| `/admin/horarios` | Horarios veterinarios + bloqueos | admin, veterinario |
| `/admin/auditoria` | Registro de auditoría | admin |

---

## Permisos por Rol

### Navegación

| Ruta | admin | veterinario | recepcionista |
|---|---|---|---|
| Dalendario | ✅ | ✅ | ✅ |
| Citas | ✅ | ✅ | ✅ |
| Clientes | ✅ | ✅ | ✅ |
| Mascotas | ✅ | ✅ | ✅ |
| Casos Clínicos | ✅ | ✅ | ❌ |
| Vacunas | ✅ | ✅ | ✅ |
| Desparasitación | ✅ | ✅ | ✅ |
| Hospitalización | ✅ | ✅ | ❌ |
| Campañas | ✅ | ✅ | ✅ |
| Puntuaciones | ✅ | ✅ | ✅ |
| Horarios | ✅ | ✅ | ❌ |
| Auditoría | ✅ | ❌ | ❌ |

### Datos Clínicos Sensibles (SOAP, diagnósticos, tratamientos)

Solo accesibles por roles: `admin`, `veterinario`

### Agendamiento Público

Cualquiera puede agendar, confirmar, cancelar o reprogramar citas desde enlaces públicos (por token).

---

## Constantes y Utilidades

### `lib/constants.ts`

| Constante | Descripción |
|---|---|
| `ESPECIES` | `['Perro', 'Gato', 'Conejo', 'Ave']` |
| `SEXOS` | `['Macho', 'Hembra']` |
| `ESTADOS_CITA` | Objeto con label + color Tailwind para cada estado |
| `ESTADOS_CASO` | Objeto con label + color para abierto/seguimiento/cerrado |
| `TIPOS_SERVICIO` | Objeto con label + color para cada tipo de servicio |
| `ROLES` | `{'admin': 'Administrador', 'veterinario': 'Veterinario', 'recepcionista': 'Recepcionista'}` |
| `PERMISOS_NAV` | Mapeo de ruta → roles permitidos |
| `ROLES_CLINICOS` | `['admin', 'veterinario']` |
| `ESTADOS_HOSPITALIZACION` | Objeto con label + color |
| `SEGMENTOS_CAMPANA` | 4 segmentos con label + icono |
| `PLANTILLAS_CAMPANA` | Plantillas de mensaje por segmento con variables {{dueno}}, {{mascota}}, etc. |
| `LIMITE_HORAS_CANCELAR` | `12` (horas mínimas antes de la cita para cancelar/reprogramar) |
| `TIMEZONE` | `'America/Guayaquil'` (UTC-5) |
| `HORARIO_DEFAULT` | `{ inicio: '08:00', fin: '18:00', dias: [1-6], intervalo: 30 }` |
| 
### Funciones de utilidad

| Función | Archivo | Descripción |
|---|---|---|
| `cn(...inputs)` | `lib/utils.ts` | Combina `clsx` + `tailwind-merge` para clases CSS |
| `genId(prefix)` | `lib/constants.ts` | Genera ID tipo `cli_001`, `mas_002`, etc. |
| `genToken()` | `lib/constants.ts` | Genera token único de 16 caracteres alfanuméricos |
| `ahora()` | `lib/constants.ts` | Fecha actual en zona America/Guayaquil |
| `formatDate(dateStr)` | `lib/constants.ts` | Formatea fecha a `DD/MM/YYYY` |
| `formatTime(dateStr)` | `lib/constants.ts` | Formatea hora a `HH:mm` |
| `calcularEdad(fechaNacimiento)` | `lib/ai-service.ts` | Calcula edad aproximada en años desde fecha de nacimiento |

---

## UI Components

El proyecto utiliza **Radix UI** como base para 20+ componentes headless, con patrones de diseño inspirados en **shadcn/ui**:

| Componente | Uso Principal |
|---|---|
| `Button` | Botones con variantes (default, outline, ghost, destructive) |
| `Card` | Tarjetas para contenido agrupado |
| `Table` | Tablas de datos con paginación |
| `Dialog` / `AlertDialog` | Modales y diálogos de confirmación |
| `DropdownMenu` | Menús contextuales |
| `Sheet` | Drawer lateral (navegación mobile) |
| `Tabs` | Pestañas para secciones |
| `Select` | Selectores desplegables |
| `Input` / `Textarea` | Campos de texto |
| `Badge` | Etiquetas con color (estados, tipos) |
| `Avatar` | Avatares de usuario |
| `Checkbox` | Checkboxes (consentimiento de datos) |
| `Toast` / `sonner` | Notificaciones emergentes |
| `Calendar` | Selector de fecha (date-fns) |
| `Command` | Paleta de comandos (Cmd+K) |
| `Accordion` | Acordeones (preguntas frecuentes) |
| `Progress` | Barras de progreso |
| `Switch` | Toggles |
| `Tooltip` | Tooltips |
| `Chart` | Gráficas con Recharts |

---

## Distribución

### Netlify

Configuración en `netlify.toml`:

```toml
[build]
command = "npx next build"
publish = ".next"

[[plugins]]
package = "@netlify/plugin-nextjs"
```

### Docker

El `next.config.js` habilita `output: 'standalone'` para generar un build autocontenido. El `Dockerfile` usa la imagen `node:20-alpine` y expone el puerto 3000.

---

## Notas para Integración con Backend

Cuando se conecte al backend (PostgreSQL + API REST en `backend NANIVET/`):

1. **Reemplazar `mock-data.ts`:** Los arrays se reemplazarán por datos de la API
2. **Reescribir `repositories.ts`:** Cada método del Repository hará llamadas HTTP al backend
3. **Autenticación:** Reemplazar el login plano por JWT (token + refresh token)
4. **Formato de fechas:** El backend usa `TIMESTAMP WITH TIME ZONE` (America/Guayaquil)
5. **IDs:** El backend genera IDs como `cli_001`, `mas_002`, etc. (mismo formato que el mock)
6. **Tokens:** Los tokens públicos se generan automáticamente al crear citas
7. **Auditoría:** El backend loguea automáticamente en la tabla `auditoria`
8. **Reglas de negocio:** Las reglas (12h límite, consentimiento obligatorio, etc.) se mantienen en el backend

---

## Resumen de Datos Mock

| Entidad | Cantidad | Archivo |
|---|---|---|
| Usuarios | 3 | `mock-data.ts` |
| Veterinarios | 3 | `mock-data.ts` |
| Horarios Bloqueados | 2 | `mock-data.ts` |
| Clientes | 10 | `mock-data.ts` |
| Mascotas | 20 | `mock-data.ts` |
| Citas | 30 | `mock-data.ts` |
| Casos Clínicos | 15 | `mock-data.ts` |
| Vacunas | 12 | `mock-data.ts` |
| Tratamientos | 10 | `mock-data.ts` |
| Desparasitaciones | 7 | `mock-data.ts` |
| Cirugías | 3 | `mock-data.ts` |
| Exámenes Adjuntos | 7 | `mock-data.ts` |
| Registros de Peso | 20 | `mock-data.ts` |
| Hospitalizaciones | 3 | `mock-data.ts` |
| Medicaciones | 4 | `mock-data.ts` |
| Audit Logs | 15 | `mock-data.ts` |
| Campañas | 8 | `mock-data.ts` |
| **Total** | **~177 registros** | |

---
7
*NANIVET — Clínica Veterinaria en Esmeraldas, Ecuador. Construido con Next.js, TypeScript, Tailwind CSS y Radix UI.*
| Horarios/bloqueos | Si | Si | No |
| Campañas | Si | Si | Si |
| Auditoría | Si | No | No |
| Asistente IA | Si | Si | No |
 Estructura del proyecto

```
├── app/
│   ├── layout.tsx              # Layout raíz (tema oscuro)
│   ├── page.tsx                # Landing page pública
│   ├── globals.css             # Estilos y tema (paleta teal/cyan)
│   ├── agendar/                # Página pública de agendamiento
│   │   ├── page.tsx            # Wizard de 3 pasos + aviso de privacidad
│   │   └── cita/[token]/       # Gestión pública de cita por token
│   └── admin/                  # Área privada (requiere login)
│       ├── layout.tsx          # Auth provider + admin shell
│       ├── calendario/         # Calendario (mes/semana/día)
│       ├── citas/              # CRUD de citas + WhatsApp
│       ├── clientes/           # CRUD de clientes
│       ├── mascotas/           # CRUD de mascotas + ficha clínica
│       ├── casos/              # Casos clínicos con SOAP + IA
│       ├── vacunas/            # Control de vacunación
│       ├── horarios/           # Horarios y bloqueos por veterinario
│       ├── hospitalizacion/    # Hospitalización + medicación + evolución
│       ├── campanas/           # Campañas con 4 segmentos
│       └── auditoria/          # Historial de cambios
├── components/
│   ├── ui/                     # Componentes shadcn/ui
│   ├── auth-provider.tsx       # Contexto de autenticación mock
│   └── theme-provider.tsx      # Provider de tema (modo oscuro)
├── lib/
│   ├── models.ts               # Modelos de datos (TypeScript interfaces)
│   ├── mock-data.ts            # Datos mock (10 clientes, 20 mascotas, 30 citas, 15 casos, etc.)
│   ├── repositories.ts         # Capa de repositorios (CRUD en memoria + auditoría)
│   ├── constants.ts            # Constantes, enums, helpers de formato
│   └── ai-service.ts           # Asistente IA veterinario (mock)
```

## Arquitectura

### Capa de repositorios

Todos los datos se acceden a través de repositorios (`lib/repositories.ts`), no directamente. Esto permite reemplazar la implementación mock por una base de datos real en el futuro sin cambiar la capa de presentación.

Repositorios disponibles:

- `AuthRepository` - Autenticación mock
- `ClienteRepository` - CRUD de clientes + consentimiento + revocación
- `MascotaRepository` - CRUD de mascotas
- `CitaRepository` - CRUD de citas + slots + gestión pública por token
- `CasoRepository` - CRUD de casos clínicos
- `VacunaRepository` - Vacunas + próximas a vencer
- `TratamientoRepository` - Tratamientos/recetas
- `DesparasitacionRepository` - Desparasitaciones
- `CirugiaRepository` - Cirugías
- `ExamenRepository` - Exámenes/adjuntos
- `PesoRepository` - Registros de peso
- `AuditRepository` - Logs de auditoría con filtros
- `HospitalizacionRepository` - Hospitalizaciones + altas
- `HospitalizacionRepository` - Hospitalizaciones + altas
- `MedicacionRepository` - Medicación + registro de tomas
- `CampanaRepository` - Campañas + segmentación
- `BusquedaRepository` - Búsqueda global

### Entidades

- **Cliente/Dueño**: nombre, apellido, teléfono WhatsApp, cédula (obligatorios); email, dirección (opcionales); consentimiento de datos y comunicaciones
- **Mascota**: cliente, nombre, especie, sexo, fecha de nacimiento (obligatorios); raza, color, microchip, esterilizado, alergias, notas (opcionales)
- **Cita**: mascota, veterinario, tipo de servicio, fecha/hora, estado, token público
- **Caso clínico**: mascota, motivo, SOAP, diagnóstico, estado
- **Hospitalización**: mascota, caso, veterinario, jaula/área, motivo, fechas de ingreso/alta
- **Medicación**: hospitalización, medicamento, dosis, vía, frecuencia, tomas programadas
- **Evolución diaria**: hospitalización, signos vitales, estado general, observaciones
- **Campaña**: segmento, destinatarios calculados, plantillas con variables
- **AuditLog**: usuario, rol, acción, entidad, diff de cambios
Funcionalidades

- CRUD completo de todas las entidades con validación
- **Auditoría**: historial de cambios (crear/editar/eliminar/confirmar/cancelar/reprogramar) con diff de valores
- **Consentimiento de datos**: aviso de privacidad v1.0, checkbox obligatorio en agendamiento, consentimiento opcional de comunicaciones, revocación
- **Gestión pública de citas**: enlace `/agendar/cita/[token]` para confirmar, cancelar (mínimo 12h antes) y reprogramar
- **Campañas**: 4 segmentos (vacunas vencidas, desparasitación pendiente, clientes inactivos +6 meses, cumpleaños), plantillas con variables, envío por WhatsApp, exclusión de clientes sin consentimiento
- **Hospitalización**: grid de medicación con tomas programadas, registro de administración, evolución diaria, alta con resumen e indicaciones
- **cha de mascota con línea de tiempo, alertas (alergias, crónicos), gráfica de peso, carnet de vacunación y auditoría
- Calendario (mes/semana/día) con citas, vacunas próximas y cirugías, colores por tipo
- Botón "Enviar WhatsApp" con mensaje prellenado y plantilla editable
- Horarios de atención y bloqueos por veterinario
- Dashboard: citas de hoy, hospitalizados, casos abiertos, satisfacción
- Búsqueda global (Ctrl+K)
- Página pública de agendamiento con aviso de privacidad y consentimiento
- Navegación filtrada por rol (recepcionista no ve datos clínicos sensibles)

## Enlaces de ejemplo (datos mock)

- Gestión pública de cita: `/agendar/cita/tok_cit001_abcd`

## Datos del entorno
- **Zona horaria**: Esmeraldas, Ecuador (UTC-5)
- **Idioma**: Español
- **Moneda**: USD
- **Formato de fechas**: dd/mm/aaaa
