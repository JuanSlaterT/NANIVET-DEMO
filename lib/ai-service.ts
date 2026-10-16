// Servicio de IA veterinaria (mock - simulado con delays)
// En producción se conectaría a un LLM con prompt engineering especializado.

import type { CasoClinico, Mascota, Vacuna, Tratamiento, Desparasitacion, Cirugia, Examen, Cita, Cliente } from './models';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 1. Resumir historial clínico de una mascota
export async function summarizeHistory(
  mascota: Mascota,
  casos: CasoClinico[],
  vacunas: Vacuna[],
  tratamientos: Tratamiento[],
  desparasitaciones: Desparasitacion[],
  cirugias: Cirugia[],
  examenes: Examen[]
): Promise<string> {
  await delay(1200);

  const partes: string[] = [];

  partes.push(`**Resumen clínico de ${mascota.nombre}** (${mascota.especie}, ${mascota.raza || 'raza no especificada'})`);
  partes.push(`Edad aproximada: ${calcularEdad(mascota.fechaNacimiento)}`);

  if (mascota.alergias) {
    partes.push(`**Alergias conocidas:** ${mascota.alergias}`);
  }

  if (casos.length > 0) {
    const casosActivos = casos.filter(c => c.estado !== 'cerrado');
    const casosCerrados = casos.filter(c => c.estado === 'cerrado');
    partes.push(`**Historial clínico:** ${casos.length} casos registrados (${casosActivos.length} activos/seguimiento, ${casosCerrados.length} cerrados).`);
    const diagnosticos = casos.map(c => `- ${c.diagnostico} (${c.estado})`).slice(0, 5);
    partes.push(`Diagnósticos principales:\n${diagnosticos.join('\n')}`);
  } else {
    partes.push('**Historial clínico:** Sin casos registrados.');
  }

  if (vacunas.length > 0) {
    const ultVacuna = vacunas[vacunas.length - 1];
    partes.push(`**Vacunación:** ${vacunas.length} vacunas aplicadas. Última: ${ultVacuna.nombre} (${ultVacuna.fechaAplicacion}). Próxima dosis: ${ultVacuna.proximaDosis}.`);
  }

  if (tratamientos.length > 0) {
    partes.push(`**Tratamientos:** ${tratamientos.length} prescripciones registradas.`);
  }

  if (desparasitaciones.length > 0) {
    const ultDesp = desparasitaciones[desparasitaciones.length - 1];
    partes.push(`**Desparasitación:** Última: ${ultDesp.producto} (${ultDesp.fecha}). Próxima: ${ultDesp.proximaDosis}.`);
  }

  if (cirugias.length > 0) {
    partes.push(`**Cirugías:** ${cirugias.length} procedimientos quirúrgicos.`);
  }

  if (examenes.length > 0) {
    partes.push(`**Exámenes:** ${examenes.length} exámenes/adjuntos registrados.`);
  }

  if (mascota.notas) {
    partes.push(`**Notas adicionales:** ${mascota.notas}`);
  }

  partes.push('\n*Este resumen fue generado automáticamente por el asistente IA de NANIVET y debe ser validado por un veterinario.*');

  return partes.join('\n\n');
}

// 2. Convertir notas libres en estructura SOAP
export async function notesToSOAP(notas: string): Promise<{ subjetivo: string; objetivo: string; analisis: string; plan: string }> {
  await delay(1500);

  // Mock: intentar extraer secciones de las notas
  const lineas = notas.split('\n').map(l => l.trim()).filter(Boolean);

  const subjetivo: string[] = [];
  const objetivo: string[] = [];
  const analisis: string[] = [];
  const plan: string[] = [];

  for (const linea of lineas) {
    const lower = linea.toLowerCase();
    if (lower.includes('dueño') || lower.includes('dueña') || lower.includes('reporta') || lower.includes('refiere') || lower.includes('señala') || lower.includes('queja')) {
      subjetivo.push(linea);
    } else if (lower.includes('temp') || lower.includes('t:') || lower.includes('fc:') || lower.includes('fr:') || lower.includes('peso') || lower.includes('mucosa') || lower.includes('palpación') || lower.includes('observ')) {
      objetivo.push(linea);
    } else if (lower.includes('dx') || lower.includes('diagnós') || lower.includes('sospech') || lower.includes('descartar') || lower.includes('probable')) {
      analisis.push(linea);
    } else if (lower.includes('tratamiento') || lower.includes('recet') || lower.includes('indicar') || lower.includes('control') || lower.includes('recomend') || lower.includes('próxima') || lower.includes('seguimiento')) {
      plan.push(linea);
    } else {
      // Si no se clasifica, poner en subjetivo por defecto
      subjetivo.push(linea);
    }
  }

  return {
    subjetivo: subjetivo.join('. ') || 'No se identificaron datos subjetivos en las notas.',
    objetivo: objetivo.join('. ') || 'No se identificaron datos objetivos en las notas.',
    analisis: analisis.join('. ') || 'No se identificó análisis diagnóstico en las notas.',
    plan: plan.join('. ') || 'No se identificó plan terapéutico en las notas.',
  };
}

// 3. Borrador de mensaje para el dueño (WhatsApp)
export async function draftOwnerMessage(
  mascota: Mascota,
  cliente: Cliente,
  cita: Cita | null,
  contexto: string
): Promise<string> {
  await delay(1000);

  const nombreDueno = `${cliente.nombre} ${cliente.apellido}`;
  let mensaje = `Estimado/a ${nombreDueno},\n\n`;

  if (cita) {
    const fecha = new Date(cita.fechaHora);
    const fechaStr = `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;
    const horaStr = `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
    mensaje += `Le recordamos que ${mascota.nombre} tiene una cita el ${fechaStr} a las ${horaStr}.`;
    if (cita.motivo) {
      mensaje += ` Motivo: ${cita.motivo}.`;
    }
    mensaje += '\n';
  }

  if (contexto) {
    mensaje += `\n${contexto}\n`;
  }

  mensaje += '\nSi necesita reprogramar o cancelar, puede hacerlo a través del enlace que le enviamos, o contáctenos directamente.\n\nSaludos cordiales,\nNANIVET - Clínica Veterinaria';

  return mensaje;
}

// 4. Sugerir diagnósticos diferenciales
export async function suggestDifferentials(
  sintomas: string,
  especie: string
): Promise<{ diagnostico: string; probabilidad: string; razonamiento: string }[]> {
  await delay(1500);

  const lower = sintomas.toLowerCase();
  const resultados: { diagnostico: string; probabilidad: string; razonamiento: string }[] = [];

  // Reglas mock básicas
  if (lower.includes('vómito') || lower.includes('vomito') || lower.includes('diarrea') || lower.includes('deshidrat')) {
    resultados.push({
      diagnostico: 'Gastroenteritis aguda',
      probabilidad: 'Alta',
      razonamiento: 'Los vómitos y diarrea son el cuadro clásico. Descartar cuerpo extraño con radiografía.',
    });
    if (especie === 'Perro') {
      resultados.push({
        diagnostico: 'Parvovirosis',
        probabilidad: 'Media',
        razonamiento: 'Descartar si el paciente no está vacunado o es cachorro. Realizar test de antígeno.',
      });
    }
    resultados.push({
      diagnostico: 'Cuerpo extraño gastrointestinal',
      probabilidad: 'Media-baja',
      razonamiento: 'Considerar si los vómitos son persistentes y hay dolor abdominal. Radiografía indicada.',
    });
  }

  if (lower.includes('cojera') || lower.includes('dolor') || lower.includes('articul') || lower.includes('cadera')) {
    resultados.push({
      diagnostico: 'Displasia de cadera',
      probabilidad: 'Alta',
      razonamiento: 'Cojera intermitente en posteriores, dificultad para levantarse. Confirmar con radiografía.',
    });
    resultados.push({
      diagnostico: 'Artritis degenerativa',
      probabilidad: 'Alta',
      razonamiento: 'Especialmente en pacientes senior. Crepitación y atrofia muscular sugieren artrosis.',
    });
    resultados.push({
      diagnostico: 'Lesión de ligamento cruzado',
      probabilidad: 'Media',
      razonamiento: 'Descartar con prueba de cajón tibial. Común en perros grandes.',
    });
  }

  if (lower.includes('rascad') || lower.includes('piel') || lower.includes('alopec') || lower.includes('dermat')) {
    resultados.push({
      diagnostico: 'Dermatitis alérgica (DAPP)',
      probabilidad: 'Alta',
      razonamiento: 'El rascado excesivo y alopecia son sugestivos. Descartar pulgas primero.',
    });
    resultados.push({
      diagnostico: 'Demodicosis',
      probabilidad: 'Media',
      razonamiento: 'Realizar raspado de piel. Común en perros jóvenes o inmunodeprimidos.',
    });
    resultados.push({
      diagnostico: 'Infección bacteriana secundaria (Pioderma)',
      probabilidad: 'Media',
      razonamiento: 'Puede coexistir con alergias. Costras y pústulas sugieren infección bacteriana.',
    });
  }

  if (lower.includes('letarg') || lower.includes('deprim') || lower.includes('inact')) {
    resultados.push({
      diagnostico: 'Enfermedad sistémica inespecífica',
      probabilidad: 'Media',
      razonamiento: 'La letargia es un signo inespecífico. Se requiere hemograma y bioquímica para orientar.',
    });
  }

  if (resultados.length === 0) {
    resultados.push({
      diagnostico: 'No se pudieron generar sugerencias con los síntomas proporcionados',
      probabilidad: 'N/A',
      razonamiento: 'Intente describir más síntomas o signos clínicos observados.',
    });
  }

  return resultados;
}

function calcularEdad(fechaNacimiento: string): string {
  const nac = new Date(fechaNacimiento);
  const ahora = new Date('2026-10-15');
  const anos = ahora.getFullYear() - nac.getFullYear();
  const meses = ahora.getMonth() - nac.getMonth();
  if (meses < 0) return `${anos - 1} años`;
  if (meses === 0 && ahora.getDate() < nac.getDate()) return `${anos - 1} años`;
  if (anos === 0) return `${meses} meses`;
  return `${anos} años y ${meses} meses`;
}
