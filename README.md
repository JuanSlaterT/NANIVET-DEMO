# NANIVET - Clínica Veterinaria

Sistema de gestión para clínica veterinaria construido con Next.js, React y TypeScript. Prueba de concepto con datos mock accedidos mediante una capa de repositorios.

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
npm install
```

## Ejecución

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Compilación

```bash
npm run build
```

## Credenciales de acceso (mock)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Veterinario | veterinario@nanivet.com | nanivet123 |
| Recepcionista | recepcion@nanivet.com | nanivet123 |
| Administrador | admin@nanivet.com | nanivet123 |

## Permisos por rol

| Función | Admin | Veterinario | Recepcionista |
|---------|-------|-------------|---------------|
| Dashboard | Si | Si | Si |
| Calendario | Si | Si | Si |
| Citas | Si | Si | Si |
| Clientes | Si | Si | Si |
| Mascotas | Si | Si | Si |
| Vacunas | Si | Si | Si |
| Casos clínicos (SOAP, dx) | Si | Si | No |
| Tratamientos | Si | Si | No |
| Hospitalización | Si | Si | No |
| Horarios/bloqueos | Si | Si | No |
| Campañas | Si | Si | Si |
| Encuestas | Si | Si | Si |
| Auditoría | Si | No | No |
| Asistente IA | Si | Si | No |

## Estructura del proyecto

```
├── app/
│   ├── layout.tsx              # Layout raíz (tema oscuro)
│   ├── page.tsx                # Landing page pública
│   ├── globals.css             # Estilos y tema (paleta teal/cyan)
│   ├── agendar/                # Página pública de agendamiento
│   │   ├── page.tsx            # Wizard de 3 pasos + aviso de privacidad
│   │   └── cita/[token]/       # Gestión pública de cita por token
│   ├── encuesta/[token]/       # Encuesta de satisfacción pública
│   └── admin/                  # Área privada (requiere login)
│       ├── layout.tsx          # Auth provider + admin shell
│       ├── page.tsx            # Dashboard
│       ├── calendario/         # Calendario (mes/semana/día)
│       ├── citas/              # CRUD de citas + WhatsApp
│       ├── clientes/           # CRUD de clientes
│       ├── mascotas/           # CRUD de mascotas + ficha clínica
│       ├── casos/              # Casos clínicos con SOAP + IA
│       ├── vacunas/            # Control de vacunación
│       ├── horarios/           # Horarios y bloqueos por veterinario
│       ├── hospitalizacion/    # Hospitalización + medicación + evolución
│       ├── campanas/           # Campañas con 4 segmentos
│       ├── encuestas/          # Resultados de encuestas
│       └── auditoria/          # Historial de cambios
├── components/
│   ├── admin/                  # Admin shell, login, búsqueda global
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
- `EncuestaRepository` - Encuestas + promedios
- `HospitalizacionRepository` - Hospitalizaciones + altas
- `MedicacionRepository` - Medicación + registro de tomas
- `EvolucionRepository` - Evolución diaria
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
- **Encuesta**: cita, token, calificación 1-5, recomendación, comentario
- **Campaña**: segmento, destinatarios calculados, plantillas con variables
- **AuditLog**: usuario, rol, acción, entidad, diff de cambios

### Funcionalidades

- CRUD completo de todas las entidades con validación
- **Auditoría**: historial de cambios (crear/editar/eliminar/confirmar/cancelar/reprogramar) con diff de valores
- **Consentimiento de datos**: aviso de privacidad v1.0, checkbox obligatorio en agendamiento, consentimiento opcional de comunicaciones, revocación
- **Gestión pública de citas**: enlace `/agendar/cita/[token]` para confirmar, cancelar (mínimo 12h antes) y reprogramar
- **Encuestas de satisfacción**: enlace `/encuesta/[token]`, calificación 1-5 estrellas, recomendación, comentarios
- **Campañas**: 4 segmentos (vacunas vencidas, desparasitación pendiente, clientes inactivos +6 meses, cumpleaños), plantillas con variables, envío por WhatsApp, exclusión de clientes sin consentimiento
- **Hospitalización**: grid de medicación con tomas programadas, registro de administración, evolución diaria, alta con resumen e indicaciones
- **Asistente IA veterinario** (mock): resumen de historial clínico, notas a SOAP, diagnósticos diferenciales, borrador de mensaje al dueño
- Ficha de mascota con línea de tiempo, alertas (alergias, crónicos), gráfica de peso, carnet de vacunación y auditoría
- Calendario (mes/semana/día) con citas, vacunas próximas y cirugías, colores por tipo
- Botón "Enviar WhatsApp" con mensaje prellenado y plantilla editable
- Horarios de atención y bloqueos por veterinario
- Dashboard: citas de hoy, hospitalizados, casos abiertos, satisfacción
- Búsqueda global (Ctrl+K)
- Página pública de agendamiento con aviso de privacidad y consentimiento
- Navegación filtrada por rol (recepcionista no ve datos clínicos sensibles)

## Enlaces de ejemplo (datos mock)

- Gestión pública de cita: `/agendar/cita/tok_cit001_abcd`
- Encuesta de satisfacción: `/encuesta/tok_enc001_abcd`

## Datos del entorno

- **Zona horaria**: Esmeraldas, Ecuador (UTC-5)
- **Idioma**: Español
- **Moneda**: USD
- **Formato de fechas**: dd/mm/aaaa
