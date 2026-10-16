// Datos mock para NANIVET - Clínica Veterinaria
// 10 clientes, 20 mascotas, 30 citas, 15 casos clínicos, vacunas, tratamientos, 3 cirugías

import type { Cliente, Mascota, Cita, CasoClinico, Vacuna, Tratamiento, Desparasitacion, Cirugia, Examen, Veterinario, UsuarioAuth, AuditLog, Encuesta, Hospitalizacion, Medicacion, EvolucionDiaria, CampanaEnvio } from './models';

// ==================== USUARIOS (AUTH MOCK) ====================
export const usuarios: UsuarioAuth[] = [
  { id: 'usr_001', nombre: 'Dra. Nicole Pérez', email: 'veterinario@nanivet.com', password: 'nanivet123', rol: 'veterinario', veterinarioId: 'vet_001' },
  { id: 'usr_002', nombre: 'Carlos Mendoza', email: 'recepcion@nanivet.com', password: 'nanivet123', rol: 'recepcionista' },
  { id: 'usr_003', nombre: 'Admin NANIVET', email: 'admin@nanivet.com', password: 'nanivet123', rol: 'admin' },
];

// ==================== VETERINARIOS ====================
export const veterinarios: Veterinario[] = [
  { id: 'vet_001', nombre: 'Dra. Nicole Pérez', especialidad: 'Medicina interna', telefono: '0991234567', horario: { inicio: '08:00', fin: '17:00', dias: [1,2,3,4,5,6], intervalo: 30 } },
  { id: 'vet_002', nombre: 'Dr. Andrés Torres', especialidad: 'Cirugía', telefono: '0987654321', horario: { inicio: '09:00', fin: '18:00', dias: [1,2,3,4,5], intervalo: 30 } },
  { id: 'vet_003', nombre: 'Dra. Sofía Vera', especialidad: 'Dermatología', telefono: '0971122334', horario: { inicio: '08:00', fin: '16:00', dias: [1,2,3,4,5,6], intervalo: 30 } },
];

// Horarios bloqueados por veterinario
export const horariosBloqueados = [
  { id: 'blk_001', veterinarioId: 'vet_001', fecha: '2026-10-16', motivo: 'Capacitación' },
  { id: 'blk_002', veterinarioId: 'vet_002', fecha: '2026-10-20', motivo: 'Cirugía programada externa' },
];

// ==================== CLIENTES (10) ====================
// La mayoría con consentimiento de datos aceptado; cli_005 y cli_009 sin consentimiento de comunicaciones
export const clientes: Cliente[] = [
  { id: 'cli_001', nombre: 'María', apellido: 'González', telefono: '0991122334', cedula: '0901234567', email: 'maria.gonzalez@email.com', direccion: 'Av. Principal 123, Esmeraldas', consentimientoDatos: { aceptado: true, fechaHora: '2026-09-01T10:00:00', versionAviso: '1.0' }, consentimientoComunicaciones: { aceptado: true, fechaHora: '2026-09-01T10:00:00' }, fechaRevocacion: null },
  { id: 'cli_002', nombre: 'Juan', apellido: 'Caicedo', telefono: '0992233445', cedula: '0902345678', email: 'juan.caicedo@email.com', direccion: 'Calle Sucre 456, Esmeraldas', consentimientoDatos: { aceptado: true, fechaHora: '2026-08-15T11:30:00', versionAviso: '1.0' }, consentimientoComunicaciones: { aceptado: true, fechaHora: '2026-08-15T11:30:00' }, fechaRevocacion: null },
  { id: 'cli_003', nombre: 'Lucía', apellido: 'Mendoza', telefono: '0993344556', cedula: '0903456789', email: 'lucia.mendoza@email.com', direccion: 'Barrio Las Palmas, Esmeraldas', consentimientoDatos: { aceptado: true, fechaHora: '2026-07-20T09:15:00', versionAviso: '1.0' }, consentimientoComunicaciones: { aceptado: true, fechaHora: '2026-07-20T09:15:00' }, fechaRevocacion: null },
  { id: 'cli_004', nombre: 'Pedro', apellido: 'Intriago', telefono: '0994455667', cedula: '0904567890', email: 'pedro.intriago@email.com', direccion: null, consentimientoDatos: { aceptado: true, fechaHora: '2026-06-10T14:00:00', versionAviso: '1.0' }, consentimientoComunicaciones: { aceptado: true, fechaHora: '2026-06-10T14:00:00' }, fechaRevocacion: null },
  { id: 'cli_005', nombre: 'Ana', apellido: 'Quintero', telefono: '0995566778', cedula: '0905678901', email: null, direccion: 'Cdla. Universitaria, Esmeraldas', consentimientoDatos: { aceptado: true, fechaHora: '2026-05-05T16:00:00', versionAviso: '1.0' }, consentimientoComunicaciones: { aceptado: false, fechaHora: null }, fechaRevocacion: null },
  { id: 'cli_006', nombre: 'Luis', apellido: 'Briones', telefono: '0996677889', cedula: '0906789012', email: 'luis.briones@email.com', direccion: 'Av. Simón Plata Torres, Esmeraldas', consentimientoDatos: { aceptado: true, fechaHora: '2026-04-12T10:30:00', versionAviso: '1.0' }, consentimientoComunicaciones: { aceptado: true, fechaHora: '2026-04-12T10:30:00' }, fechaRevocacion: null },
  { id: 'cli_007', nombre: 'Carmen', apellido: 'Saltos', telefono: '0997788990', cedula: '0907890123', email: 'carmen.saltos@email.com', direccion: null, consentimientoDatos: { aceptado: true, fechaHora: '2026-03-18T08:45:00', versionAviso: '1.0' }, consentimientoComunicaciones: { aceptado: true, fechaHora: '2026-03-18T08:45:00' }, fechaRevocacion: null },
  { id: 'cli_008', nombre: 'Diego', apellido: 'Vera', telefono: '0998899001', cedula: '0908901234', email: 'diego.vera@email.com', direccion: 'Malecón 200, Esmeraldas', consentimientoDatos: { aceptado: true, fechaHora: '2026-02-22T13:15:00', versionAviso: '1.0' }, consentimientoComunicaciones: { aceptado: true, fechaHora: '2026-02-22T13:15:00' }, fechaRevocacion: null },
  { id: 'cli_009', nombre: 'Rosa', apellido: 'Paredes', telefono: '0999900112', cedula: '0909012345', email: null, direccion: null, consentimientoDatos: { aceptado: true, fechaHora: '2026-01-15T09:00:00', versionAviso: '1.0' }, consentimientoComunicaciones: { aceptado: false, fechaHora: null }, fechaRevocacion: null },
  { id: 'cli_010', nombre: 'Fernando', apellido: 'Mora', telefono: '0980011223', cedula: '0910123456', email: 'fernando.mora@email.com', direccion: 'Vía San Mateo, Esmeraldas', consentimientoDatos: { aceptado: true, fechaHora: '2026-09-28T11:00:00', versionAviso: '1.0' }, consentimientoComunicaciones: { aceptado: true, fechaHora: '2026-09-28T11:00:00' }, fechaRevocacion: null },
];

// ==================== MASCOTAS (20) ====================
export const mascotas: Mascota[] = [
  { id: 'mas_001', clienteId: 'cli_001', nombre: 'Max', especie: 'Perro', sexo: 'Macho', fechaNacimiento: '2022-03-15', raza: 'Labrador Retriever', color: 'Dorado', esterilizado: true, alergias: null, microchip: '985112233445566', notas: 'Muy activo y juguetón' },
  { id: 'mas_002', clienteId: 'cli_001', nombre: 'Luna', especie: 'Gato', sexo: 'Hembra', fechaNacimiento: '2021-06-20', raza: 'Siamés', color: 'Crema', esterilizado: true, alergias: 'Pólen', microchip: null, notas: null },
  { id: 'mas_003', clienteId: 'cli_002', nombre: 'Rocky', especie: 'Perro', sexo: 'Macho', fechaNacimiento: '2020-01-10', raza: 'Bulldog Francés', color: 'Blanco y negro', esterilizado: false, alergias: null, microchip: '985112233445567', notas: 'Tendencia a sobrepeso' },
  { id: 'mas_004', clienteId: 'cli_003', nombre: 'Mia', especie: 'Gato', sexo: 'Hembra', fechaNacimiento: '2023-02-05', raza: 'Mestizo', color: 'Gris', esterilizado: false, alergias: null, microchip: null, notas: null },
  { id: 'mas_005', clienteId: 'cli_003', nombre: 'Coco', especie: 'Conejo', sexo: 'Macho', fechaNacimiento: '2023-05-12', raza: 'Mini Lop', color: 'Marrón', esterilizado: true, alergias: null, microchip: null, notas: 'Come mucho heno' },
  { id: 'mas_006', clienteId: 'cli_004', nombre: 'Thor', especie: 'Perro', sexo: 'Macho', fechaNacimiento: '2019-11-03', raza: 'Pastor Alemán', color: 'Negro y fuego', esterilizado: true, alergias: 'Ciprofloxacino', microchip: '985112233445568', notas: 'Displasia de cadera' },
  { id: 'mas_007', clienteId: 'cli_005', nombre: 'Kiara', especie: 'Perro', sexo: 'Hembra', fechaNacimiento: '2022-08-22', raza: 'Poodle', color: 'Blanco', esterilizado: true, alergias: null, microchip: '985112233445569', notas: null },
  { id: 'mas_008', clienteId: 'cli_006', nombre: 'Simba', especie: 'Gato', sexo: 'Macho', fechaNacimiento: '2021-09-18', raza: 'Maine Coon', color: 'Naranja', esterilizado: true, alergias: null, microchip: null, notas: 'Gato grande, 7kg' },
  { id: 'mas_009', clienteId: 'cli_006', nombre: 'Nina', especie: 'Ave', sexo: 'Hembra', fechaNacimiento: '2023-01-30', raza: 'Periquito', color: 'Verde y amarillo', esterilizado: false, alergias: null, microchip: null, notas: null },
  { id: 'mas_010', clienteId: 'cli_007', nombre: 'Bruno', especie: 'Perro', sexo: 'Macho', fechaNacimiento: '2020-07-14', raza: 'Rottweiler', color: 'Negro y fuego', esterilizado: true, alergias: null, microchip: '985112233445570', notas: 'Perro guardián' },
  { id: 'mas_011', clienteId: 'cli_008', nombre: 'Bella', especie: 'Perro', sexo: 'Hembra', fechaNacimiento: '2023-04-25', raza: 'Beagle', color: 'Tricolor', esterilizado: false, alergias: 'Polvo', microchip: null, notas: null },
  { id: 'mas_012', clienteId: 'cli_008', nombre: 'Mishi', especie: 'Gato', sexo: 'Hembra', fechaNacimiento: '2022-12-01', raza: 'Persa', color: 'Blanco', esterilizado: true, alergias: null, microchip: '985112233445571', notas: 'Requiere cepillado diario' },
  { id: 'mas_013', clienteId: 'cli_009', nombre: 'Toby', especie: 'Perro', sexo: 'Macho', fechaNacimiento: '2018-03-20', raza: 'Mestizo', color: 'Café', esterilizado: true, alergias: 'Penicilina', microchip: '985112233445572', notas: 'Perro senior, artritis' },
  { id: 'mas_014', clienteId: 'cli_009', nombre: 'Pelusa', especie: 'Gato', sexo: 'Hembra', fechaNacimiento: '2021-04-10', raza: 'Angora', color: 'Blanco', esterilizado: true, alergias: null, microchip: null, notas: null },
  { id: 'mas_015', clienteId: 'cli_010', nombre: 'Duke', especie: 'Perro', sexo: 'Macho', fechaNacimiento: '2022-05-08', raza: 'Siberian Husky', color: 'Gris y blanco', esterilizado: false, alergias: null, microchip: '985112233445573', notas: 'Ojos heterocromáticos' },
  { id: 'mas_016', clienteId: 'cli_002', nombre: 'Canela', especie: 'Gato', sexo: 'Hembra', fechaNacimiento: '2023-06-15', raza: 'Mestizo', color: 'Atigrada', esterilizado: false, alergias: null, microchip: null, notas: null },
  { id: 'mas_017', clienteId: 'cli_004', nombre: 'Piolín', especie: 'Ave', sexo: 'Macho', fechaNacimiento: '2023-08-03', raza: 'Canario', color: 'Amarillo', esterilizado: false, alergias: null, microchip: null, notas: 'Canta mucho' },
  { id: 'mas_018', clienteId: 'cli_005', nombre: 'Zoe', especie: 'Perro', sexo: 'Hembra', fechaNacimiento: '2021-10-12', raza: 'Chihuahua', color: 'Café claro', esterilizado: true, alergias: null, microchip: null, notas: 'Necesita limpieza dental' },
  { id: 'mas_019', clienteId: 'cli_007', nombre: 'Ginger', especie: 'Conejo', sexo: 'Hembra', fechaNacimiento: '2023-03-22', raza: 'Cabeza de León', color: 'Naranja', esterilizado: true, alergias: null, microchip: null, notas: null },
  { id: 'mas_020', clienteId: 'cli_010', nombre: 'Arya', especie: 'Gato', sexo: 'Hembra', fechaNacimiento: '2022-02-28', raza: 'Bengala', color: 'Atigrado manchado', esterilizado: true, alergias: 'Anestesia inhalatoria', microchip: '985112233445574', notas: 'Muy enérgica' },
];

// ==================== CITAS (30) ====================
// Fechas relativas a octubre 2026 (mes actual)
// Cada cita tiene un token único para enlaces públicos
export const citas: Cita[] = [
  // Hoy (15 de octubre 2026)
  { id: 'cit_001', mascotaId: 'mas_001', veterinarioId: 'vet_001', tipoServicio: 'consulta', fechaHora: '2026-10-15T09:00:00', estado: 'confirmada', motivo: 'Vacunación anual', notas: '', token: 'tok_cit001_abcd', ultimoCambioPor: 'recepcion', fechaConfirmacion: '2026-10-12T10:00:00' },
  { id: 'cit_002', mascotaId: 'mas_006', veterinarioId: 'vet_001', tipoServicio: 'control', fechaHora: '2026-10-15T10:30:00', estado: 'confirmada', motivo: 'Control displasia cadera', notas: '', token: 'tok_cit002_efgh', ultimoCambioPor: 'recepcion', fechaConfirmacion: '2026-10-10T14:00:00' },
  { id: 'cit_003', mascotaId: 'mas_013', veterinarioId: 'vet_003', tipoServicio: 'consulta', fechaHora: '2026-10-15T11:00:00', estado: 'pendiente', motivo: 'Revisión artritis', notas: 'Traer radiografías previas', token: 'tok_cit003_ijkl' },
  { id: 'cit_004', mascotaId: 'mas_003', veterinarioId: 'vet_002', tipoServicio: 'cirugia', fechaHora: '2026-10-15T14:00:00', estado: 'confirmada', motivo: 'Castración', notas: 'Ayuno 12h', token: 'tok_cit004_mnop', ultimoCambioPor: 'recepcion', fechaConfirmacion: '2026-10-08T09:00:00' },
  { id: 'cit_005', mascotaId: 'mas_010', veterinarioId: 'vet_001', tipoServicio: 'vacunacion', fechaHora: '2026-10-15T15:30:00', estado: 'pendiente', motivo: 'Refuerzo antirrábica', notas: '', token: 'tok_cit005_qrst' },
  // Mañana (16 de octubre)
  { id: 'cit_006', mascotaId: 'mas_002', veterinarioId: 'vet_003', tipoServicio: 'consulta', fechaHora: '2026-10-16T09:00:00', estado: 'confirmada', motivo: 'Alergia piel', notas: '', token: 'tok_cit006_uvwx', ultimoCambioPor: 'cliente', fechaConfirmacion: '2026-10-13T18:00:00', confirmadaPorCliente: true },
  { id: 'cit_007', mascotaId: 'mas_007', veterinarioId: 'vet_001', tipoServicio: 'estetica', fechaHora: '2026-10-16T10:00:00', estado: 'pendiente', motivo: 'Baño y corte', notas: '', token: 'tok_cit007_yzab' },
  { id: 'cit_008', mascotaId: 'mas_015', veterinarioId: 'vet_002', tipoServicio: 'consulta', fechaHora: '2026-10-16T11:30:00', estado: 'confirmada', motivo: 'Chequeo general', notas: '', token: 'tok_cit008_cdef', ultimoCambioPor: 'recepcion', fechaConfirmacion: '2026-10-11T15:00:00' },
  // 17 de octubre
  { id: 'cit_009', mascotaId: 'mas_008', veterinarioId: 'vet_003', tipoServicio: 'consulta', fechaHora: '2026-10-17T09:30:00', estado: 'confirmada', motivo: 'Control peso', notas: '', token: 'tok_cit009_ghij', ultimoCambioPor: 'recepcion', fechaConfirmacion: '2026-10-12T09:00:00' },
  { id: 'cit_010', mascotaId: 'mas_011', veterinarioId: 'vet_001', tipoServicio: 'vacunacion', fechaHora: '2026-10-17T11:00:00', estado: 'pendiente', motivo: 'Primera vacuna cachorro', notas: '', token: 'tok_cit010_klmn' },
  { id: 'cit_011', mascotaId: 'mas_020', veterinarioId: 'vet_002', tipoServicio: 'cirugia', fechaHora: '2026-10-17T14:00:00', estado: 'confirmada', motivo: 'Esterilización', notas: 'Alergia anestesia inhalatoria', token: 'tok_cit011_opqr', ultimoCambioPor: 'recepcion', fechaConfirmacion: '2026-10-09T11:00:00' },
  // 18 de octubre (Domingo - fuera de horario, pero registrada)
  { id: 'cit_012', mascotaId: 'mas_004', veterinarioId: 'vet_001', tipoServicio: 'urgencia', fechaHora: '2026-10-18T10:00:00', estado: 'atendida', motivo: 'Vómitos persistentes', notas: '', token: 'tok_cit012_stuv', ultimoCambioPor: 'veterinario' },
  // 19 de octubre
  { id: 'cit_013', mascotaId: 'mas_009', veterinarioId: 'vet_003', tipoServicio: 'consulta', fechaHora: '2026-10-19T10:00:00', estado: 'pendiente', motivo: 'Revisión general ave', notas: '', token: 'tok_cit013_wxyz' },
  { id: 'cit_014', mascotaId: 'mas_012', veterinarioId: 'vet_001', tipoServicio: 'estetica', fechaHora: '2026-10-19T14:30:00', estado: 'confirmada', motivo: 'Baño y peinado', notas: '', token: 'tok_cit014_abc1', ultimoCambioPor: 'recepcion', fechaConfirmacion: '2026-10-13T10:00:00' },
  // 20 de octubre
  { id: 'cit_015', mascotaId: 'mas_005', veterinarioId: 'vet_001', tipoServicio: 'desparasitacion', fechaHora: '2026-10-20T09:00:00', estado: 'pendiente', motivo: 'Desparasitación trimestral', notas: '', token: 'tok_cit015_def2' },
  { id: 'cit_016', mascotaId: 'mas_014', veterinarioId: 'vet_003', tipoServicio: 'control', fechaHora: '2026-10-20T11:00:00', estado: 'confirmada', motivo: 'Control rutina', notas: '', token: 'tok_cit016_ghi3', ultimoCambioPor: 'recepcion', fechaConfirmacion: '2026-10-12T16:00:00' },
  // 21 de octubre
  { id: 'cit_017', mascotaId: 'mas_017', veterinarioId: 'vet_001', tipoServicio: 'consulta', fechaHora: '2026-10-21T10:00:00', estado: 'pendiente', motivo: 'Chequeo canario', notas: '', token: 'tok_cit017_jkl4' },
  { id: 'cit_018', mascotaId: 'mas_018', veterinarioId: 'vet_003', tipoServicio: 'consulta', fechaHora: '2026-10-21T15:00:00', estado: 'confirmada', motivo: 'Limpieza dental', notas: '', token: 'tok_cit018_mno5', ultimoCambioPor: 'recepcion', fechaConfirmacion: '2026-10-11T12:00:00' },
  // 22 de octubre
  { id: 'cit_019', mascotaId: 'mas_019', veterinarioId: 'vet_001', tipoServicio: 'desparasitacion', fechaHora: '2026-10-22T09:30:00', estado: 'pendiente', motivo: 'Desparasitación', notas: '', token: 'tok_cit019_pqr6' },
  { id: 'cit_020', mascotaId: 'mas_016', veterinarioId: 'vet_002', tipoServicio: 'vacunacion', fechaHora: '2026-10-22T11:30:00', estado: 'pendiente', motivo: 'Triple felina', notas: '', token: 'tok_cit020_stu7' },
  // 23 de octubre
  { id: 'cit_021', mascotaId: 'mas_001', veterinarioId: 'vet_001', tipoServicio: 'control', fechaHora: '2026-10-23T10:00:00', estado: 'pendiente', motivo: 'Control post-vacuna', notas: '', token: 'tok_cit021_vwx8' },
  { id: 'cit_022', mascotaId: 'mas_010', veterinarioId: 'vet_002', tipoServicio: 'consulta', fechaHora: '2026-10-23T14:00:00', estado: 'pendiente', motivo: 'Chequeo general', notas: '', token: 'tok_cit022_yza9' },
  // 24 de octubre
  { id: 'cit_023', mascotaId: 'mas_006', veterinarioId: 'vet_001', tipoServicio: 'consulta', fechaHora: '2026-10-24T09:00:00', estado: 'pendiente', motivo: 'Seguimiento displasia', notas: '', token: 'tok_cit023_bcd0' },
  // Históricas (atendidas)
  { id: 'cit_024', mascotaId: 'mas_001', veterinarioId: 'vet_001', tipoServicio: 'consulta', fechaHora: '2026-10-08T09:00:00', estado: 'atendida', motivo: 'Chequeo anual', notas: '', token: 'tok_cit024_efg1', ultimoCambioPor: 'veterinario' },
  { id: 'cit_025', mascotaId: 'mas_003', veterinarioId: 'vet_002', tipoServicio: 'consulta', fechaHora: '2026-10-08T11:00:00', estado: 'atendida', motivo: 'Problema dermatológico', notas: '', token: 'tok_cit025_hij2', ultimoCambioPor: 'veterinario' },
  { id: 'cit_026', mascotaId: 'mas_008', veterinarioId: 'vet_003', tipoServicio: 'consulta', fechaHora: '2026-10-10T10:00:00', estado: 'atendida', motivo: 'Dermatitis', notas: '', token: 'tok_cit026_klm3', ultimoCambioPor: 'veterinario' },
  { id: 'cit_027', mascotaId: 'mas_013', veterinarioId: 'vet_001', tipoServicio: 'vacunacion', fechaHora: '2026-10-05T09:30:00', estado: 'atendida', motivo: 'Refuerzo múltiple', notas: '', token: 'tok_cit027_nop4', ultimoCambioPor: 'veterinario' },
  { id: 'cit_028', mascotaId: 'mas_020', veterinarioId: 'vet_002', tipoServicio: 'cirugia', fechaHora: '2026-10-03T08:00:00', estado: 'atendida', motivo: 'Cirugía previa', notas: '', token: 'tok_cit028_qrs5', ultimoCambioPor: 'veterinario' },
  // Canceladas / no asistió
  { id: 'cit_029', mascotaId: 'mas_014', veterinarioId: 'vet_001', tipoServicio: 'consulta', fechaHora: '2026-10-09T14:00:00', estado: 'cancelada', motivo: 'Consulta general', notas: 'Cliente canceló', token: 'tok_cit029_tuv6', motivoCancelacion: 'Cliente canceló por agenda', canceladaPorCliente: true, ultimoCambioPor: 'cliente' },
  { id: 'cit_030', mascotaId: 'mas_011', veterinarioId: 'vet_003', tipoServicio: 'control', fechaHora: '2026-10-11T16:00:00', estado: 'no_asistio', motivo: 'Control vacunal', notas: 'No asistió, reprogramar', token: 'tok_cit030_wxy7', ultimoCambioPor: 'recepcion' },
];

// ==================== CASOS CLÍNICOS (15) ====================
export const casosClinicos: CasoClinico[] = [
  { id: 'cas_001', mascotaId: 'mas_001', motivo: 'Chequeo anual y vacunación', soap: { subjetivo: 'Dueño reporta que Max está activo y sin problemas aparentes.', objetivo: 'T: 38.5°C, FC: 90 lpm, FR: 20 rpm. Mucosas rosadas. Buen estado corporal.', analisis: 'Paciente saludable. Peso adecuado.', plan: 'Vacunación anual. Desparasitación. Próxima visita en 12 meses.' }, diagnostico: 'Paciente sano - control de rutina', estado: 'cerrado', fecha: '2026-10-08T09:30:00', veterinarioId: 'vet_001' },
  { id: 'cas_002', mascotaId: 'mas_006', motivo: 'Displasia de cadera - manejo crónico', soap: { subjetivo: 'Cojera intermitente en miembros posteriores. Dificultad para levantarse.', objetivo: 'Manipulación revela dolor en cadera bilateral. Radiografías previas confirman displasia.', analisis: 'Displasia de cadera grado 2. Manejo conservador.', plan: 'AINEs, condroprotectores, control de peso, fisioterapia.' }, diagnostico: 'Displasia de cadera bilateral grado 2', estado: 'seguimiento', fecha: '2026-10-08T10:30:00', veterinarioId: 'vet_001' },
  { id: 'cas_003', mascotaId: 'mas_003', motivo: 'Problema dermatológico', soap: { subjetivo: 'Lesiones en piel, rascado excesivo.', objetivo: 'Alopecia en dorso, eritema, excoriaciones.', analisis: 'Dermatitis alérgica. Descartar demodicosis.', plan: 'Tratamiento antihistamínico, baño medicado, raspado de piel.' }, diagnostico: 'Dermatitis alérgica por pulgas', estado: 'cerrado', fecha: '2026-10-08T11:30:00', veterinarioId: 'vet_002' },
  { id: 'cas_004', mascotaId: 'mas_008', motivo: 'Dermatitis felina', soap: { subjetivo: 'Pérdida de pelo en zona lumbar, rascado.', objetivo: 'Lesiones costrosas en lomo. Pulgas observadas.', analisis: 'Dermatitis por pulgas.', plan: 'Antipulgas tópico, tratamiento sintomático.' }, diagnostico: 'Dermatitis por pulgas', estado: 'cerrado', fecha: '2026-10-10T10:30:00', veterinarioId: 'vet_003' },
  { id: 'cas_005', mascotaId: 'mas_013', motivo: 'Artritis - manejo crónico en paciente senior', soap: { subjetivo: 'Dificultad para caminar, especialmente por las mañanas.', objetivo: 'Crepitación en articulaciones. Atrofia muscular leve.', analisis: 'Artritis degenerativa. Paciente senior.', plan: 'AINEs, suplementos articulares, dieta especial, control mensual.' }, diagnostico: 'Artritis degenerativa múltiples articulaciones', estado: 'seguimiento', fecha: '2026-10-05T10:00:00', veterinarioId: 'vet_001' },
  { id: 'cas_006', mascotaId: 'mas_020', motivo: 'Cirugía de esterilización', soap: { subjetivo: 'Dueña solicita esterilización.', objetivo: 'Paciente sana, pre-anestésico normal. Alergia a anestesia inhalatoria documentada.', analisis: 'Candidata para OVH. Usar protocolo anestésico alternativo.', plan: 'OVH con anestesia total intravenosa. Hospitalización 24h.' }, diagnostico: 'Para esterilización electiva', estado: 'abierto', fecha: '2026-10-03T08:30:00', veterinarioId: 'vet_002' },
  { id: 'cas_007', mascotaId: 'mas_003', motivo: 'Castración', soap: { subjetivo: 'Dueño solicita castración.', objetivo: 'Paciente sano, ayuno confirmado 12h.', analisis: 'Candidato para orquiectomía.', plan: 'Orquiectomía bajo anestesia general. Hospitalización día.' }, diagnostico: 'Para castración electiva', estado: 'abierto', fecha: '2026-10-15T14:30:00', veterinarioId: 'vet_002' },
  { id: 'cas_008', mascotaId: 'mas_002', motivo: 'Alergia cutánea felina', soap: { subjetivo: 'Rascado excesivo, lesiones en cuello.', objetivo: 'Pápulas eritematosas en cuello. Excoriaciones.', analisis: 'Posible alergia ambiental (pólen).', plan: 'Antihistamínicos, omega 3, evitar exposición alérgenos.' }, diagnostico: 'Dermatitis alérgica (pólen)', estado: 'seguimiento', fecha: '2026-10-12T09:30:00', veterinarioId: 'vet_003' },
  { id: 'cas_009', mascotaId: 'mas_004', motivo: 'Vómitos persistentes', soap: { subjetivo: 'Vómitos 3 veces en 24h. Letargia.', objetivo: 'Deshidratación leve. Dolor abdominal a palpación.', analisis: 'Gastroenteritis. Descartar cuerpo extraño.', plan: 'Radiografía abdominal, fluidos IV, antiemético, ayuno 12h.' }, diagnostico: 'Gastroenteritis aguda', estado: 'abierto', fecha: '2026-10-18T10:30:00', veterinarioId: 'vet_001' },
  { id: 'cas_010', mascotaId: 'mas_007', motivo: 'Control de peso', soap: { subjetivo: 'Dueña reporta buen apetito y actividad.', objetivo: 'Peso: 8.5kg (ideal). Pelaje saludable.', analisis: 'Paciente en buen estado.', plan: 'Mantener dieta y ejercicio actual.' }, diagnostico: 'Paciente sana', estado: 'cerrado', fecha: '2026-09-28T10:00:00', veterinarioId: 'vet_001' },
  { id: 'cas_011', mascotaId: 'mas_010', motivo: 'Vacunación y chequeo', soap: { subjetivo: 'Dueño solicita refuerzo de vacunas.', objetivo: 'Paciente sano, temperatura normal.', analisis: 'Candidato para vacunación.', plan: 'Refuerzo antirrábica y múltiple.' }, diagnostico: 'Paciente sano - vacunación', estado: 'cerrado', fecha: '2026-09-20T09:30:00', veterinarioId: 'vet_001' },
  { id: 'cas_012', mascotaId: 'mas_015', motivo: 'Chequeo general pre-cirugía', soap: { subjetivo: 'Dueño desea esterilizar.', objetivo: 'Paciente sano, pre-anestésico normal.', analisis: 'Candidato para cirugía.', plan: 'Programar esterilización. Exámenes pre-operatorios.' }, diagnostico: 'Sano - pre-quirúrgico', estado: 'cerrado', fecha: '2026-09-25T11:30:00', veterinarioId: 'vet_002' },
  { id: 'cas_013', mascotaId: 'mas_018', motivo: 'Problema dental', soap: { subjetivo: 'Mal aliento, dificultad para comer.', objetivo: 'Tartaro severo, gingivitis. Posible pieza dental afectada.', analisis: 'Enfermedad periodontal.', plan: 'Limpieza dental bajo sedación, extracción si necesario.' }, diagnostico: 'Enfermedad periodontal grado 2', estado: 'seguimiento', fecha: '2026-10-01T15:30:00', veterinarioId: 'vet_003' },
  { id: 'cas_014', mascotaId: 'mas_005', motivo: 'Consulta general conejo', soap: { subjetivo: 'Dueño reporta buena salud general.', objetivo: 'Peso normal, dentición correcta, pelaje sano.', analisis: 'Conejo saludable.', plan: 'Desparasitación trimestral, dieta balanceada.' }, diagnostico: 'Conejo sano', estado: 'cerrado', fecha: '2026-09-15T10:00:00', veterinarioId: 'vet_001' },
  { id: 'cas_015', mascotaId: 'mas_009', motivo: 'Revisión general ave', soap: { subjetivo: 'Dueño reporta cambio en plumaje.', objetivo: 'Plumaje algo erizado. Peso normal.', analisis: 'Posible muda. Descartar psitacosis.', plan: 'Observación, suplemento vitamínico, control en 15 días.' }, diagnostico: 'Muda de plumaje', estado: 'seguimiento', fecha: '2026-10-02T10:30:00', veterinarioId: 'vet_003' },
];

// ==================== VACUNAS ====================
export const vacunas: Vacuna[] = [
  { id: 'vac_001', mascotaId: 'mas_001', casoId: 'cas_001', nombre: 'Antirrábica', lote: 'AR-2026-001', fechaAplicacion: '2026-10-08', proximaDosis: '2027-10-08', veterinarioId: 'vet_001' },
  { id: 'vac_002', mascotaId: 'mas_001', casoId: 'cas_001', nombre: 'Múltiple Canina (DA2PP)', lote: 'MC-2026-003', fechaAplicacion: '2026-10-08', proximaDosis: '2027-10-08', veterinarioId: 'vet_001' },
  { id: 'vac_003', mascotaId: 'mas_002', casoId: null, nombre: 'Triple Felina', lote: 'TF-2026-010', fechaAplicacion: '2026-09-10', proximaDosis: '2027-09-10', veterinarioId: 'vet_003' },
  { id: 'vac_004', mascotaId: 'mas_003', casoId: null, nombre: 'Antirrábica', lote: 'AR-2026-005', fechaAplicacion: '2026-06-15', proximaDosis: '2027-06-15', veterinarioId: 'vet_002' },
  { id: 'vac_005', mascotaId: 'mas_006', casoId: null, nombre: 'Múltiple Canina (DA2PP)', lote: 'MC-2026-008', fechaAplicacion: '2026-05-20', proximaDosis: '2027-05-20', veterinarioId: 'vet_001' },
  { id: 'vac_006', mascotaId: 'mas_010', casoId: 'cas_011', nombre: 'Antirrábica', lote: 'AR-2026-012', fechaAplicacion: '2026-09-20', proximaDosis: '2027-09-20', veterinarioId: 'vet_001' },
  { id: 'vac_007', mascotaId: 'mas_010', casoId: 'cas_011', nombre: 'Múltiple Canina (DA2PP)', lote: 'MC-2026-015', fechaAplicacion: '2026-09-20', proximaDosis: '2027-09-20', veterinarioId: 'vet_001' },
  { id: 'vac_008', mascotaId: 'mas_013', casoId: 'cas_005', nombre: 'Refuerzo Múltiple', lote: 'MC-2026-020', fechaAplicacion: '2026-10-05', proximaDosis: '2027-10-05', veterinarioId: 'vet_001' },
  { id: 'vac_009', mascotaId: 'mas_015', casoId: null, nombre: 'Antirrábica', lote: 'AR-2026-025', fechaAplicacion: '2026-08-10', proximaDosis: '2027-08-10', veterinarioId: 'vet_002' },
  { id: 'vac_010', mascotaId: 'mas_011', casoId: null, nombre: 'Primera Dosis Cachorro', lote: 'PC-2026-030', fechaAplicacion: '2026-09-01', proximaDosis: '2026-10-15', veterinarioId: 'vet_001' },
  { id: 'vac_011', mascotaId: 'mas_016', casoId: null, nombre: 'Triple Felina', lote: 'TF-2026-035', fechaAplicacion: '2026-07-20', proximaDosis: '2026-10-20', veterinarioId: 'vet_002' },
  { id: 'vac_012', mascotaId: 'mas_008', casoId: null, nombre: 'Antirrábica', lote: 'AR-2026-040', fechaAplicacion: '2026-06-01', proximaDosis: '2026-12-01', veterinarioId: 'vet_003' },
];

// ==================== TRATAMIENTOS / RECETAS ====================
export const tratamientos: Tratamiento[] = [
  { id: 'tra_001', mascotaId: 'mas_006', casoId: 'cas_002', nombre: 'Meloxicam 1.5mg/ml', dosis: '0.1mg/kg PO cada 24h', duracion: '30 días', fecha: '2026-10-08', veterinarioId: 'vet_001' },
  { id: 'tra_002', mascotaId: 'mas_006', casoId: 'cas_002', nombre: 'Condroitina + Glucosamina', dosis: '1 comprimido PO cada 24h', duracion: 'Continuo', fecha: '2026-10-08', veterinarioId: 'vet_001' },
  { id: 'tra_003', mascotaId: 'mas_003', casoId: 'cas_003', nombre: 'Prednisolona 5mg', dosis: '0.5mg/kg PO cada 12h', duracion: '7 días', fecha: '2026-10-08', veterinarioId: 'vet_002' },
  { id: 'tra_004', mascotaId: 'mas_003', casoId: 'cas_003', nombre: 'Spot-on antipulgas (Fipronil)', dosis: '1 aplicación tópica', duracion: 'Único', fecha: '2026-10-08', veterinarioId: 'vet_002' },
  { id: 'tra_005', mascotaId: 'mas_008', casoId: 'cas_004', nombre: 'Spot-on antipulgas (Selamectina)', dosis: '1 aplicación tópica en nuca', duracion: 'Mensual', fecha: '2026-10-10', veterinarioId: 'vet_003' },
  { id: 'tra_006', mascotaId: 'mas_013', casoId: 'cas_005', nombre: 'Carprofeno 50mg', dosis: '2mg/kg PO cada 12h', duracion: '15 días', fecha: '2026-10-05', veterinarioId: 'vet_001' },
  { id: 'tra_007', mascotaId: 'mas_013', casoId: 'cas_005', nombre: 'Omega 3 (EPA/DHA)', dosis: '1 cápsula PO cada 24h', duracion: 'Continuo', fecha: '2026-10-05', veterinarioId: 'vet_001' },
  { id: 'tra_008', mascotaId: 'mas_002', casoId: 'cas_008', nombre: 'Clorfenamina 4mg', dosis: '2mg PO cada 12h', duracion: '10 días', fecha: '2026-10-12', veterinarioId: 'vet_003' },
  { id: 'tra_009', mascotaId: 'mas_004', casoId: 'cas_009', nombre: 'Maropitant (Cerenia)', dosis: '1mg/kg SC', duracion: 'Único', fecha: '2026-10-18', veterinarioId: 'vet_001' },
  { id: 'tra_010', mascotaId: 'mas_018', casoId: 'cas_013', nombre: 'Amoxicilina + Ácido Clavulánico', dosis: '12.5mg/kg PO cada 12h', duracion: '10 días', fecha: '2026-10-01', veterinarioId: 'vet_003' },
];

// ==================== DESPARASITACIONES ====================
export const desparasitaciones: Desparasitacion[] = [
  { id: 'des_001', mascotaId: 'mas_001', casoId: 'cas_001', producto: 'Praziquantel + Febantel', dosis: '1 tableta/10kg PO', fecha: '2026-10-08', proximaDosis: '2027-01-08', veterinarioId: 'vet_001' },
  { id: 'des_002', mascotaId: 'mas_005', casoId: 'cas_014', producto: 'Ivermectina 0.1%', dosis: '0.2mg/kg SC', fecha: '2026-09-15', proximaDosis: '2026-12-15', veterinarioId: 'vet_001' },
  { id: 'des_003', mascotaId: 'mas_010', casoId: 'cas_011', producto: 'Praziquantel + Febantel', dosis: '1.5 tabletas PO', fecha: '2026-09-20', proximaDosis: '2026-12-20', veterinarioId: 'vet_001' },
  { id: 'des_004', mascotaId: 'mas_003', casoId: null, producto: 'Milbemicina Oxima', dosis: '1 tableta PO', fecha: '2026-08-01', proximaDosis: '2026-11-01', veterinarioId: 'vet_002' },
  { id: 'des_005', mascotaId: 'mas_013', casoId: null, producto: 'Praziquantel + Febantel', dosis: '1 tableta PO', fecha: '2026-07-10', proximaDosis: '2026-10-10', veterinarioId: 'vet_001' },
  { id: 'des_006', mascotaId: 'mas_008', casoId: null, producto: 'Emodepsida + Praziquantel (tópico)', dosis: '1 aplicación', fecha: '2026-08-20', proximaDosis: '2026-11-20', veterinarioId: 'vet_003' },
  { id: 'des_007', mascotaId: 'mas_019', casoId: null, producto: 'Ivermectina 0.1%', dosis: '0.2mg/kg SC', fecha: '2026-07-01', proximaDosis: '2026-10-01', veterinarioId: 'vet_001' },
];

// ==================== CIRUGÍAS (3) ====================
export const cirugias: Cirugia[] = [
  { id: 'cir_001', mascotaId: 'mas_020', casoId: 'cas_006', tipo: 'OVH (Esterilización)', fecha: '2026-10-03', veterinarioId: 'vet_002', anestesia: 'Total intravenosa (Propofol + Ketamina)', notas: 'Alergia a anestesia inhalatoria. Protocolo alternativo usado sin complicaciones.', prognosis: 'Excelente' },
  { id: 'cir_002', mascotaId: 'mas_020', casoId: null, tipo: 'Limpieza dental + extracción', fecha: '2026-10-17', veterinarioId: 'vet_002', anestesia: 'Total intravenosa', notas: 'Programada. Requiere ayuno 8h.', prognosis: 'Buena' },
  { id: 'cir_003', mascotaId: 'mas_003', casoId: 'cas_007', tipo: 'Orquiectomía (Castración)', fecha: '2026-10-15', veterinarioId: 'vet_002', anestesia: 'General inhalatoria (Isoflurano)', notas: 'Ayuno confirmado 12h. Sin complicaciones pre-operatorias.', prognosis: 'Excelente' },
];

// ==================== EXÁMENES / ADJUNTOS ====================
export const examenes: Examen[] = [
  { id: 'exa_001', mascotaId: 'mas_006', casoId: 'cas_002', tipo: 'Radiografía', descripcion: 'Radiografía de cadera bilateral', fecha: '2026-09-15', veterinarioId: 'vet_001' },
  { id: 'exa_002', mascotaId: 'mas_006', casoId: 'cas_002', tipo: 'Análisis de sangre', descripcion: 'Hemograma y bioquímica', fecha: '2026-09-15', veterinarioId: 'vet_001' },
  { id: 'exa_003', mascotaId: 'mas_020', casoId: 'cas_006', tipo: 'Examen pre-anestésico', descripcion: 'Perfil pre-quirúrgico completo', fecha: '2026-10-02', veterinarioId: 'vet_002' },
  { id: 'exa_004', mascotaId: 'mas_013', casoId: 'cas_005', tipo: 'Radiografía', descripcion: 'Radiografía de articulaciones', fecha: '2026-08-20', veterinarioId: 'vet_001' },
  { id: 'exa_005', mascotaId: 'mas_004', casoId: 'cas_009', tipo: 'Radiografía abdominal', descripcion: 'Descartar cuerpo extraño', fecha: '2026-10-18', veterinarioId: 'vet_001' },
  { id: 'exa_006', mascotaId: 'mas_018', casoId: 'cas_013', tipo: 'Examen dental', descripcion: 'Evaluación periodontal', fecha: '2026-10-01', veterinarioId: 'vet_003' },
  { id: 'exa_007', mascotaId: 'mas_003', casoId: 'cas_003', tipo: 'Raspado de piel', descripcion: 'Descartar demodicosis', fecha: '2026-10-08', veterinarioId: 'vet_002' },
];

// ==================== REGISTROS DE PESO (para gráfica) ====================
export const pesosRegistrados = [
  { id: 'pes_001', mascotaId: 'mas_001', peso: 25.0, fecha: '2025-10-08' },
  { id: 'pes_002', mascotaId: 'mas_001', peso: 26.5, fecha: '2026-01-15' },
  { id: 'pes_003', mascotaId: 'mas_001', peso: 27.0, fecha: '2026-04-10' },
  { id: 'pes_004', mascotaId: 'mas_001', peso: 28.0, fecha: '2026-07-05' },
  { id: 'pes_005', mascotaId: 'mas_001', peso: 28.5, fecha: '2026-10-08' },
  { id: 'pes_006', mascotaId: 'mas_006', peso: 35.0, fecha: '2025-10-01' },
  { id: 'pes_007', mascotaId: 'mas_006', peso: 34.5, fecha: '2026-01-10' },
  { id: 'pes_008', mascotaId: 'mas_006', peso: 34.0, fecha: '2026-04-15' },
  { id: 'pes_009', mascotaId: 'mas_006', peso: 33.5, fecha: '2026-07-08' },
  { id: 'pes_010', mascotaId: 'mas_006', peso: 33.0, fecha: '2026-10-08' },
  { id: 'pes_011', mascotaId: 'mas_003', peso: 9.0, fecha: '2025-09-01' },
  { id: 'pes_012', mascotaId: 'mas_003', peso: 10.5, fecha: '2026-01-20' },
  { id: 'pes_013', mascotaId: 'mas_003', peso: 11.0, fecha: '2026-04-10' },
  { id: 'pes_014', mascotaId: 'mas_003', peso: 11.5, fecha: '2026-07-15' },
  { id: 'pes_015', mascotaId: 'mas_003', peso: 12.0, fecha: '2026-10-08' },
  { id: 'pes_016', mascotaId: 'mas_013', peso: 18.0, fecha: '2025-10-05' },
  { id: 'pes_017', mascotaId: 'mas_013', peso: 17.5, fecha: '2026-01-08' },
  { id: 'pes_018', mascotaId: 'mas_013', peso: 17.0, fecha: '2026-04-10' },
  { id: 'pes_019', mascotaId: 'mas_013', peso: 16.8, fecha: '2026-07-02' },
  { id: 'pes_020', mascotaId: 'mas_013', peso: 16.5, fecha: '2026-10-05' },
];

// ==================== AUDIT LOGS ====================
export const auditLogs: AuditLog[] = [
  { id: 'aud_001', usuario: 'Dra. Nicole Pérez', rol: 'veterinario', fechaHora: '2026-10-15T09:30:00', accion: 'crear', entidad: 'CasoClinico', entidadId: 'cas_007', valoresDespues: { motivo: 'Castración', mascotaId: 'mas_003' } },
  { id: 'aud_002', usuario: 'Carlos Mendoza', rol: 'recepcionista', fechaHora: '2026-10-15T08:00:00', accion: 'crear', entidad: 'Cita', entidadId: 'cit_005', valoresDespues: { mascotaId: 'mas_010', motivo: 'Refuerzo antirrábica' } },
  { id: 'aud_003', usuario: 'Carlos Mendoza', rol: 'recepcionista', fechaHora: '2026-10-12T10:00:00', accion: 'confirmar', entidad: 'Cita', entidadId: 'cit_001', diff: [{ campo: 'estado', antes: 'pendiente', despues: 'confirmada' }] },
  { id: 'aud_004', usuario: 'Cliente (token)', rol: 'cliente', fechaHora: '2026-10-13T18:00:00', accion: 'confirmar', entidad: 'Cita', entidadId: 'cit_006', diff: [{ campo: 'estado', antes: 'pendiente', despues: 'confirmada' }, { campo: 'confirmadaPorCliente', antes: 'false', despues: 'true' }] },
  { id: 'aud_005', usuario: 'Cliente (token)', rol: 'cliente', fechaHora: '2026-10-09T14:00:00', accion: 'cancelar', entidad: 'Cita', entidadId: 'cit_029', diff: [{ campo: 'estado', antes: 'pendiente', despues: 'cancelada' }], valoresDespues: { motivoCancelacion: 'Cliente canceló por agenda' } },
  { id: 'aud_006', usuario: 'Dra. Nicole Pérez', rol: 'veterinario', fechaHora: '2026-10-08T09:35:00', accion: 'crear', entidad: 'Vacuna', entidadId: 'vac_001', valoresDespues: { nombre: 'Antirrábica', mascotaId: 'mas_001' } },
  { id: 'aud_007', usuario: 'Carlos Mendoza', rol: 'recepcionista', fechaHora: '2026-10-08T08:00:00', accion: 'crear', entidad: 'Cliente', entidadId: 'cli_010', valoresDespues: { nombre: 'Fernando', apellido: 'Mora' } },
  { id: 'aud_008', usuario: 'Admin NANIVET', rol: 'admin', fechaHora: '2026-10-07T15:00:00', accion: 'editar', entidad: 'Veterinario', entidadId: 'vet_002', diff: [{ campo: 'horario.inicio', antes: '08:00', despues: '09:00' }] },
  { id: 'aud_009', usuario: 'Dra. Nicole Pérez', rol: 'veterinario', fechaHora: '2026-10-05T10:05:00', accion: 'crear', entidad: 'CasoClinico', entidadId: 'cas_005', valoresDespues: { motivo: 'Artritis - manejo crónico' } },
  { id: 'aud_010', usuario: 'Carlos Mendoza', rol: 'recepcionista', fechaHora: '2026-10-11T12:00:00', accion: 'editar', entidad: 'Cita', entidadId: 'cit_018', diff: [{ campo: 'estado', antes: 'pendiente', despues: 'confirmada' }] },
  { id: 'aud_011', usuario: 'Admin NANIVET', rol: 'admin', fechaHora: '2026-10-03T08:00:00', accion: 'crear', entidad: 'Cirugia', entidadId: 'cir_001', valoresDespues: { tipo: 'OVH', mascotaId: 'mas_020' } },
  { id: 'aud_012', usuario: 'Dra. Sofía Vera', rol: 'veterinario', fechaHora: '2026-10-12T09:35:00', accion: 'crear', entidad: 'CasoClinico', entidadId: 'cas_008', valoresDespues: { motivo: 'Alergia cutánea felina' } },
  { id: 'aud_013', usuario: 'Carlos Mendoza', rol: 'recepcionista', fechaHora: '2026-10-11T16:05:00', accion: 'editar', entidad: 'Cita', entidadId: 'cit_030', diff: [{ campo: 'estado', antes: 'confirmada', despues: 'no_asistio' }] },
  { id: 'aud_014', usuario: 'Admin NANIVET', rol: 'admin', fechaHora: '2026-10-14T10:00:00', accion: 'enviar_campaña', entidad: 'Campana', entidadId: 'cam_001', valoresDespues: { segmento: 'vacunas_vencidas', totalEnvios: 3 } },
  { id: 'aud_015', usuario: 'Dra. Nicole Pérez', rol: 'veterinario', fechaHora: '2026-10-14T16:00:00', accion: 'alta_hospitalizacion', entidad: 'Hospitalizacion', entidadId: 'hos_001', diff: [{ campo: 'estado', antes: 'hospitalizado', despues: 'alta' }], valoresDespues: { resumenAlta: 'Paciente recuperado, alta con indicaciones' } },
];

// ==================== ENCUESTAS (8) ====================
export const encuestas: Encuesta[] = [
  { id: 'enc_001', citaId: 'cit_024', token: 'tok_enc001_abcd', mascotaId: 'mas_001', veterinarioId: 'vet_001', calificacion: 5, recomienda: true, comentario: 'Excelente atención, muy profesionales.', fechaRespuesta: '2026-10-09T10:00:00', respondida: true },
  { id: 'enc_002', citaId: 'cit_025', token: 'tok_enc002_efgh', mascotaId: 'mas_003', veterinarioId: 'vet_002', calificacion: 4, recomienda: true, comentario: 'Buena atención, el wait fue un poco largo.', fechaRespuesta: '2026-10-09T15:00:00', respondida: true },
  { id: 'enc_003', citaId: 'cit_026', token: 'tok_enc003_ijkl', mascotaId: 'mas_008', veterinarioId: 'vet_003', calificacion: 5, recomienda: true, comentario: 'Muy agradecida con la Dra. Vera.', fechaRespuesta: '2026-10-11T09:00:00', respondida: true },
  { id: 'enc_004', citaId: 'cit_027', token: 'tok_enc004_mnop', mascotaId: 'mas_013', veterinarioId: 'vet_001', calificacion: 5, recomienda: true, comentario: 'Muy buen trato con Toby, explicaron todo bien.', fechaRespuesta: '2026-10-06T12:00:00', respondida: true },
  { id: 'enc_005', citaId: 'cit_028', token: 'tok_enc005_qrst', mascotaId: 'mas_020', veterinarioId: 'vet_002', calificacion: 4, recomienda: true, comentario: null, fechaRespuesta: '2026-10-04T16:00:00', respondida: true },
  { id: 'enc_006', citaId: 'cit_024', token: 'tok_enc006_uvwx', mascotaId: 'mas_001', veterinarioId: 'vet_001', calificacion: 3, recomienda: true, comentario: 'Todo bien pero los precios subieron.', fechaRespuesta: '2026-10-10T08:00:00', respondida: true },
  { id: 'enc_007', citaId: 'cit_025', token: 'tok_enc007_yzab', mascotaId: 'mas_003', veterinarioId: 'vet_002', calificacion: 5, recomienda: true, comentario: 'Rocky mejoró rápidamente.', fechaRespuesta: '2026-10-10T14:00:00', respondida: true },
  { id: 'enc_008', citaId: 'cit_026', token: 'tok_enc008_cdef', mascotaId: 'mas_008', veterinarioId: 'vet_003', calificacion: 2, recomienda: false, comentario: 'Esperé mucho tiempo.', fechaRespuesta: '2026-10-12T10:00:00', respondida: true },
  // Pendientes (no respondidas) para citas recientes
  { id: 'enc_009', citaId: 'cit_024', token: 'tok_enc009_ghij', mascotaId: 'mas_001', veterinarioId: 'vet_001', calificacion: 0, recomienda: false, comentario: null, fechaRespuesta: null, respondida: false },
  { id: 'enc_010', citaId: 'cit_027', token: 'tok_enc010_klmn', mascotaId: 'mas_013', veterinarioId: 'vet_001', calificacion: 0, recomienda: false, comentario: null, fechaRespuesta: null, respondida: false },
];

// ==================== HOSPITALIZACIONES (2 activas + 1 alta) ====================
export const hospitalizaciones: Hospitalizacion[] = [
  { id: 'hos_001', mascotaId: 'mas_020', casoId: 'cas_006', veterinarioId: 'vet_002', fechaIngreso: '2026-10-14T08:00:00', fechaAlta: null, jaulaArea: 'A-01', motivo: 'Post-operatorio OVH - observación 24h', estado: 'hospitalizado' },
  { id: 'hos_002', mascotaId: 'mas_004', casoId: 'cas_009', veterinarioId: 'vet_001', fechaIngreso: '2026-10-15T07:00:00', fechaAlta: null, jaulaArea: 'B-03', motivo: 'Gastroenteritis aguda - fluidos IV', estado: 'hospitalizado' },
  { id: 'hos_003', mascotaId: 'mas_013', casoId: 'cas_005', veterinarioId: 'vet_001', fechaIngreso: '2026-10-13T10:00:00', fechaAlta: '2026-10-14T16:00:00', jaulaArea: 'A-02', motivo: 'Crisis artrítica - manejo del dolor', estado: 'alta', resumenAlta: 'Paciente estable, responde a AINEs. Dolor controlado.', indicacionesAlta: 'Continuar Carprofeno 50mg cada 12h por 10 días. Reposo relativo. Control en 7 días.' },
];

// ==================== MEDICACIONES ====================
export const medicaciones: Medicacion[] = [
  {
    id: 'med_001', hospitalizacionId: 'hos_001', medicamento: 'Tramadol 50mg', dosis: '2mg/kg', via: 'IV', frecuencia: 'Cada 8h', horasProgramadas: ['08:00', '16:00', '00:00'], fechaInicio: '2026-10-14', fechaFin: null,
    tomas: [
      { fecha: '2026-10-14', hora: '08:00', administrada: true, horaReal: '08:05', usuario: 'Dra. Nicole Pérez' },
      { fecha: '2026-10-14', hora: '16:00', administrada: true, horaReal: '16:10', usuario: 'Enfermera' },
      { fecha: '2026-10-15', hora: '00:00', administrada: true, horaReal: '00:15', usuario: 'Enfermera' },
      { fecha: '2026-10-15', hora: '08:00', administrada: false, horaReal: null, usuario: null },
    ],
  },
  {
    id: 'med_002', hospitalizacionId: 'hos_001', medicamento: 'Amoxicilina + Á. Clavulánico', dosis: '12.5mg/kg', via: 'SC', frecuencia: 'Cada 12h', horasProgramadas: ['09:00', '21:00'], fechaInicio: '2026-10-14', fechaFin: null,
    tomas: [
      { fecha: '2026-10-14', hora: '09:00', administrada: true, horaReal: '09:00', usuario: 'Dra. Nicole Pérez' },
      { fecha: '2026-10-14', hora: '21:00', administrada: true, horaReal: '21:05', usuario: 'Enfermera' },
      { fecha: '2026-10-15', hora: '09:00', administrada: false, horaReal: null, usuario: null },
    ],
  },
  {
    id: 'med_003', hospitalizacionId: 'hos_002', medicamento: 'Ringer Lactato', dosis: '20ml/kg/h', via: 'IV', frecuencia: 'Flujo continuo', horasProgramadas: ['continuo'], fechaInicio: '2026-10-15', fechaFin: null,
    tomas: [
      { fecha: '2026-10-15', hora: '07:00', administrada: true, horaReal: '07:00', usuario: 'Dra. Nicole Pérez' },
      { fecha: '2026-10-15', hora: '12:00', administrada: false, horaReal: null, usuario: null },
    ],
  },
  {
    id: 'med_004', hospitalizacionId: 'hos_002', medicamento: 'Maropitant (Cerenia)', dosis: '1mg/kg', via: 'SC', frecuencia: 'Cada 24h', horasProgramadas: ['08:00'], fechaInicio: '2026-10-15', fechaFin: null,
    tomas: [
      { fecha: '2026-10-15', hora: '08:00', administrada: true, horaReal: '08:10', usuario: 'Dra. Nicole Pérez' },
    ],
  },
];

// ==================== EVOLUCIONES DIARIAS ====================
export const evoluciones: EvolucionDiaria[] = [
  { id: 'evd_001', hospitalizacionId: 'hos_001', fecha: '2026-10-14', signosVitales: 'T: 38.2°C, FC: 110 lpm, FR: 22 rpm', estadoGeneral: 'Recuperación post-quirúrgica normal. Sin vómitos. Come poco.', observaciones: 'Herida quirúrgica limpia, sin signos de infección. Dolor controlado.', veterinarioId: 'vet_002' },
  { id: 'evd_002', hospitalizacionId: 'hos_001', fecha: '2026-10-15', signosVitales: 'T: 38.5°C, FC: 95 lpm, FR: 20 rpm', estadoGeneral: 'Alerta, responde a estímulos. Come voluntariamente.', observaciones: 'Buena evolución. Herida sin alteraciones. Considerar alta en horas de la tarde.', veterinarioId: 'vet_002' },
  { id: 'evd_003', hospitalizacionId: 'hos_002', fecha: '2026-10-15', signosVitales: 'T: 38.0°C, FC: 140 lpm, FR: 28 rpm', estadoGeneral: 'Letárgica, responde al nombre. Hidratación mejorando con fluidos.', observaciones: 'Sin vómitos en las últimas 4h. Se recomienda mantener fluidos IV y reevaluar en 12h.', veterinarioId: 'vet_001' },
  { id: 'evd_004', hospitalizacionId: 'hos_003', fecha: '2026-10-13', signosVitales: 'T: 38.8°C, FC: 120 lpm, FR: 24 rpm', estadoGeneral: 'Dolor articular marcado, dificultad para levantarse.', observaciones: 'Se inicia Carprofeno IV. Se monitoring de dolor cada 4h.', veterinarioId: 'vet_001' },
  { id: 'evd_005', hospitalizacionId: 'hos_003', fecha: '2026-10-14', signosVitales: 'T: 38.3°C, FC: 100 lpm, FR: 20 rpm', estadoGeneral: 'Mejoría notable. Camina con menos dificultad.', observaciones: 'Dolor controlado. Se indica alta con tratamiento domiciliario.', veterinarioId: 'vet_001' },
];

// ==================== CAMPAÑA ENVIOS ====================
export const campanaEnvios: CampanaEnvio[] = [
  // Campaña: vacunas vencidas (enviada 14 oct)
  { id: 'cme_001', segmento: 'vacunas_vencidas', clienteId: 'cli_002', mascotaId: 'mas_003', motivo: 'Vacuna antirrábica vence 2027-06-15 - refuerzo', fechaEnviado: '2026-10-14T10:00:00', enviadoPor: 'Admin NANIVET' },
  { id: 'cme_002', segmento: 'vacunas_vencidas', clienteId: 'cli_007', mascotaId: 'mas_010', motivo: 'Refuerzo múltiple vence 2027-09-20', fechaEnviado: '2026-10-14T10:00:00', enviadoPor: 'Admin NANIVET' },
  { id: 'cme_003', segmento: 'vacunas_vencidas', clienteId: 'cli_009', mascotaId: 'mas_013', motivo: 'Refuerzo vence 2027-10-05', fechaEnviado: '2026-10-14T10:00:00', enviadoPor: 'Admin NANIVET' },
  // Campaña: desparasitación pendiente (enviada 13 oct)
  { id: 'cme_004', segmento: 'desparasitacion_pendiente', clienteId: 'cli_001', mascotaId: 'mas_001', motivo: 'Desparasitación próxima: 2027-01-08', fechaEnviado: '2026-10-13T09:00:00', enviadoPor: 'Admin NANIVET' },
  { id: 'cme_005', segmento: 'desparasitacion_pendiente', clienteId: 'cli_007', mascotaId: 'mas_010', motivo: 'Desparasitación próxima: 2026-12-20', fechaEnviado: '2026-10-13T09:00:00', enviadoPor: 'Admin NANIVET' },
  { id: 'cme_006', segmento: 'desparasitacion_pendiente', clienteId: 'cli_009', mascotaId: 'mas_013', motivo: 'Desparasitación vencida desde 2026-10-10', fechaEnviado: '2026-10-13T09:00:00', enviadoPor: 'Admin NANIVET' },
  // Campaña: clientes inactivos (enviada 12 oct) - cli_009 no recibe por revocación de comunicaciones
  { id: 'cme_007', segmento: 'clientes_inactivos', clienteId: 'cli_004', mascotaId: 'mas_006', motivo: 'Sin visitas desde hace más de 6 meses', fechaEnviado: '2026-10-12T11:00:00', enviadoPor: 'Admin NANIVET' },
  // Cumpleaños de mascotas (mas_001 nació el 15 marzo - no aplica; mas_011 nació 25 abril - no aplica)
  // Mas_002 cumple el 20 de junio. Para demo, hay un envío de cumpleaños de mas_015 (8 de mayo)
  { id: 'cme_008', segmento: 'cumpleanos_mascotas', clienteId: 'cli_010', mascotaId: 'mas_015', motivo: 'Cumpleaños de Duke - 8 de mayo', fechaEnviado: '2026-05-08T08:00:00', enviadoPor: 'Admin NANIVET' },
];
