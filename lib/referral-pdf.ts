import type { jsPDF as JsPdf } from 'jspdf';
import type {
  Mascota,
  Cita,
  CasoClinico,
  Vacuna,
  Tratamiento,
  Desparasitacion,
  Cirugia,
  Examen,
  PesoRegistrado,
  Hospitalizacion,
  Medicacion,
  EvolucionDiaria,
} from './models';

type RGB = [number, number, number];

export interface ReferralPdfOptions {
  motivo: string;
  especialidadDestino?: string;
  solicitud?: string;
  incluirRadiografias: boolean;
  redactions?: string[];
}

export interface ReferralPdfData {
  mascota: Mascota;
  citas: Cita[];
  casos: CasoClinico[];
  vacunas: Vacuna[];
  tratamientos: Tratamiento[];
  desparasitaciones: Desparasitacion[];
  cirugias: Cirugia[];
  examenes: Examen[];
  pesos: PesoRegistrado[];
  hospitalizaciones: Hospitalizacion[];
  medicaciones: Medicacion[];
  evoluciones: EvolucionDiaria[];
}

const COLORS = {
  primary: [38, 141, 192] as RGB,
  navy: [25, 56, 87] as RGB,
  teal: [24, 180, 154] as RGB,
  paleBlue: [232, 241, 246] as RGB,
  border: [188, 208, 220] as RGB,
  muted: [91, 113, 132] as RGB,
  white: [255, 255, 255] as RGB,
  amber: [245, 158, 11] as RGB,
  danger: [210, 55, 65] as RGB,
};

const PAGE_WIDTH = 210;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CONTENT_BOTTOM = 278;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createRedactor(values: string[] = []) {
  const protectedValues = values
    .map(value => value?.trim())
    .filter((value): value is string => Boolean(value && value.length >= 4))
    .sort((a, b) => b.length - a.length);

  return (value: unknown, fallback = 'Sin registro', maxLength = 5000) => {
    if (value === null || value === undefined || value === '') return fallback;
    let text = String(value)
      .normalize('NFC')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
      .replace(/[\u{10000}-\u{10FFFF}]/gu, '')
      .replace(/[\t ]+/g, ' ')
      .trim();

    for (const protectedValue of protectedValues) {
      text = text.replace(new RegExp(escapeRegExp(protectedValue), 'gi'), '[dato protegido]');
    }

    text = text
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[correo protegido]')
      .replace(/(?:\+?593[\s-]?)?0?9\d(?:[\s-]?\d){7}/g, '[teléfono protegido]')
      .replace(/\b(propietari[oa]|dueñ[oa]|tutor(?:a)?|responsable)\s*[:\-]\s*[\p{L}]+(?:\s+[\p{L}]+){0,3}/giu, '$1: [dato protegido]')
      .replace(/\b(veterinari[oa]|doctor(?:a)?|dr\.?|dra\.?)\s*[:\-]\s*[\p{L}]+(?:\s+[\p{L}]+){0,3}/giu, '$1: [dato protegido]')
      .replace(/\b\d{10,15}\b/g, '[identificador protegido]');

    return text.slice(0, maxLength) || fallback;
  };
}

function dateLabel(value?: string | null, includeTime = false) {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    ...(includeTime ? { timeStyle: 'short' as const } : {}),
  }).format(date);
}

function ageLabel(dateOfBirth?: string | null) {
  if (!dateOfBirth) return 'No registrada';
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return 'No registrada';
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return 'No registrada';
  if (months < 12) return `${months} meses`;
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  return remainder ? `${years} años, ${remainder} meses` : `${years} años`;
}

function yesNo(value?: boolean | null) {
  return value ? 'Sí' : 'No';
}

function titleCase(value: unknown) {
  return String(value || 'Sin registro')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

function safeFilename(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'paciente';
}

async function imageAsJpeg(url: string, maxDimension = 1800) {
  const response = await fetch(url, { credentials: 'omit' });
  if (!response.ok) throw new Error(`No se pudo cargar la imagen (${response.status})`);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('El navegador no pudo interpretar la imagen'));
      element.src = objectUrl;
    });

    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No se pudo preparar la imagen');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    return {
      dataUrl: canvas.toDataURL('image/jpeg', 0.84),
      width,
      height,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function addSectionTitle(doc: JsPdf, title: string, y: number, color: RGB = COLORS.primary) {
  doc.setFillColor(...color);
  doc.roundedRect(MARGIN, y, 3.5, 7, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.navy);
  doc.text(title, MARGIN + 7, y + 5.3);
  return y + 10;
}

function ensureSpace(doc: JsPdf, y: number, required: number) {
  if (y + required <= CONTENT_BOTTOM) return y;
  doc.addPage();
  return 20;
}

function drawParagraph(doc: JsPdf, text: string, y: number, options?: { color?: RGB; fontSize?: number; bold?: boolean; indent?: number }) {
  const indent = options?.indent || 0;
  const fontSize = options?.fontSize || 9;
  doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(...(options?.color || COLORS.navy));
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH - indent);
  const lineHeight = fontSize * 0.42;
  const nextY = ensureSpace(doc, y, lines.length * lineHeight + 2);
  doc.text(lines, MARGIN + indent, nextY);
  return nextY + lines.length * lineHeight + 2;
}

function drawKeyValueGrid(doc: JsPdf, rows: Array<[string, string]>, y: number) {
  const cellWidth = CONTENT_WIDTH / 2;
  const rowHeight = 16;
  for (let index = 0; index < rows.length; index += 2) {
    y = ensureSpace(doc, y, rowHeight + 1);
    const pair = rows.slice(index, index + 2);
    pair.forEach(([label, value], pairIndex) => {
      const x = MARGIN + pairIndex * cellWidth;
      doc.setFillColor(...COLORS.paleBlue);
      doc.roundedRect(x, y, cellWidth - 2, rowHeight - 1.5, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.muted);
      doc.text(label.toUpperCase(), x + 4, y + 4.2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORS.navy);
      const valueLines = doc.splitTextToSize(value, cellWidth - 10).slice(0, 2);
      doc.text(valueLines, x + 4, y + 9.5);
    });
    y += rowHeight;
  }
  return y + 2;
}

function drawWeightChart(doc: JsPdf, weights: PesoRegistrado[], y: number) {
  const sorted = [...weights]
    .filter(item => Number.isFinite(Number(item.peso)))
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  if (sorted.length < 2) return y;

  y = ensureSpace(doc, y, 55);
  const x = MARGIN + 8;
  const width = CONTENT_WIDTH - 16;
  const height = 42;
  const values = sorted.map(item => Number(item.peso));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  doc.setFillColor(248, 251, 253);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 51, 2, 2, 'FD');
  doc.setDrawColor(215, 227, 234);
  for (let line = 1; line <= 3; line += 1) {
    const lineY = y + 7 + (height - 13) * line / 4;
    doc.line(x, lineY, x + width, lineY);
  }

  const points = sorted.map((item, index) => ({
    x: x + (sorted.length === 1 ? width / 2 : (index / (sorted.length - 1)) * width),
    y: y + 7 + (1 - (Number(item.peso) - min) / range) * (height - 13),
  }));
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  points.slice(1).forEach((point, index) => doc.line(points[index].x, points[index].y, point.x, point.y));
  doc.setFillColor(...COLORS.teal);
  points.forEach(point => doc.circle(point.x, point.y, 1.5, 'F'));
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(`${values[0]} kg - ${dateLabel(sorted[0].fecha)}`, x, y + 47);
  const last = `${values[values.length - 1]} kg - ${dateLabel(sorted[sorted.length - 1].fecha)}`;
  doc.text(last, x + width, y + 47, { align: 'right' });
  return y + 56;
}

export async function generateReferralPdf(data: ReferralPdfData, options: ReferralPdfOptions) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const redact = createRedactor(options.redactions);
  const generatedAt = new Date();
  const reference = `REF-${generatedAt.toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  doc.setProperties({
    title: `Referencia veterinaria - ${redact(data.mascota.nombre)}`,
    subject: 'Historia clínica veterinaria anonimizada para referencia profesional',
    author: 'NANIVET',
    creator: 'Sistema clínico NANIVET',
    keywords: 'veterinaria, referencia, historia clínica, anonimizado',
  });

  // Portada y encabezado principal
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, PAGE_WIDTH, 48, 'F');
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 45, PAGE_WIDTH, 3, 'F');

  try {
    const logo = await imageAsJpeg('/logo.svg', 1000);
    doc.addImage(logo.dataUrl, 'JPEG', MARGIN, 8, 36, 24, undefined, 'FAST');
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...COLORS.white);
    doc.text('NANIVET', MARGIN, 23);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...COLORS.white);
  doc.text('INFORME DE REFERENCIA', PAGE_WIDTH - MARGIN, 16, { align: 'right' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Historia clínica veterinaria anonimizada', PAGE_WIDTH - MARGIN, 23, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(205, 225, 237);
  doc.text(reference, PAGE_WIDTH - MARGIN, 31, { align: 'right' });
  doc.text(`Generado: ${dateLabel(generatedAt.toISOString(), true)}`, PAGE_WIDTH - MARGIN, 36, { align: 'right' });

  let y = 56;
  const profileWidth = 38;
  const profileHeight = 38;
  if (data.mascota.fotoUrl) {
    try {
      const profile = await imageAsJpeg(data.mascota.fotoUrl, 900);
      doc.setDrawColor(...COLORS.border);
      doc.roundedRect(PAGE_WIDTH - MARGIN - profileWidth, y, profileWidth, profileHeight, 3, 3, 'S');
      const profileScale = Math.min((profileWidth - 2) / profile.width, (profileHeight - 2) / profile.height);
      const renderedWidth = profile.width * profileScale;
      const renderedHeight = profile.height * profileScale;
      doc.addImage(
        profile.dataUrl,
        'JPEG',
        PAGE_WIDTH - MARGIN - profileWidth + (profileWidth - renderedWidth) / 2,
        y + (profileHeight - renderedHeight) / 2,
        renderedWidth,
        renderedHeight,
        undefined,
        'FAST',
      );
    } catch {
      // La foto de perfil es decorativa; su ausencia no bloquea el informe.
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.setTextColor(...COLORS.navy);
  doc.text(redact(data.mascota.nombre, 'Paciente'), MARGIN, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text(`${redact(data.mascota.especie)} · ${redact(data.mascota.raza, 'Raza no registrada')} · ${redact(data.mascota.sexo)}`, MARGIN, y + 17);

  doc.setFillColor(...COLORS.teal);
  doc.roundedRect(MARGIN, y + 23, 61, 8, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);
  doc.text('DOCUMENTO CLÍNICO ANONIMIZADO', MARGIN + 30.5, y + 28.5, { align: 'center' });
  y += 46;

  y = drawKeyValueGrid(doc, [
    ['Fecha de nacimiento', dateLabel(data.mascota.fechaNacimiento)],
    ['Edad aproximada', ageLabel(data.mascota.fechaNacimiento)],
    ['Color', redact(data.mascota.color, 'No registrado')],
    ['Esterilización', yesNo(data.mascota.esterilizado)],
  ], y);

  if (data.mascota.alergias) {
    const allergyLines = doc.splitTextToSize(`ALERTA CLÍNICA · ${redact(data.mascota.alergias)}`, CONTENT_WIDTH - 10);
    const allergyHeight = 7 + allergyLines.length * 3.8;
    y = ensureSpace(doc, y, allergyHeight + 3);
    doc.setFillColor(255, 239, 240);
    doc.setDrawColor(...COLORS.danger);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, allergyHeight, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.danger);
    doc.text(allergyLines, MARGIN + 5, y + 6);
    y += allergyHeight + 4;
  }

  y = ensureSpace(doc, y, 22);
  doc.setFillColor(255, 249, 231);
  doc.setDrawColor(...COLORS.amber);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.navy);
  doc.text('PRIVACIDAD', MARGIN + 4, y + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const privacy = 'Este documento excluye deliberadamente datos del responsable de la mascota y datos personales de los profesionales tratantes. Su contenido es exclusivamente clínico y confidencial.';
  doc.text(doc.splitTextToSize(privacy, CONTENT_WIDTH - 8), MARGIN + 4, y + 10.5);
  y += 23;

  y = addSectionTitle(doc, 'Objetivo de la referencia', y);
  y = drawKeyValueGrid(doc, [
    ['Motivo', redact(options.motivo)],
    ['Especialidad de destino', redact(options.especialidadDestino, 'No especificada')],
  ], y);
  if (options.solicitud) y = drawParagraph(doc, `Solicitud clínica: ${redact(options.solicitud)}`, y);

  const latestCase = [...data.casos].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))[0];
  const activeHospitalizations = data.hospitalizaciones.filter(item => item.estado === 'hospitalizado');
  const activeTreatments = data.tratamientos.slice(0, 5).map(item => redact(item.nombre)).join(', ');
  y = addSectionTitle(doc, 'Resumen clínico', ensureSpace(doc, y + 2, 20), COLORS.teal);
  const summaryParts = [
    `Paciente ${redact(data.mascota.especie).toLowerCase()} de ${ageLabel(data.mascota.fechaNacimiento)}, con ${data.casos.length} caso(s) clínico(s), ${data.examenes.length} examen(es) y ${data.tratamientos.length} tratamiento(s) registrados.`,
    latestCase ? `Último caso (${dateLabel(latestCase.fecha)}): ${redact(latestCase.motivo)}. Diagnóstico: ${redact(latestCase.diagnostico, 'pendiente')}.` : 'No constan casos clínicos registrados.',
    data.mascota.alergias ? `Alergias o alertas: ${redact(data.mascota.alergias)}.` : 'No constan alergias registradas.',
    activeTreatments ? `Tratamientos registrados recientemente: ${activeTreatments}.` : '',
    activeHospitalizations.length ? `Actualmente presenta ${activeHospitalizations.length} hospitalización(es) activa(s).` : '',
  ].filter(Boolean).join(' ');
  y = drawParagraph(doc, summaryParts, y, { fontSize: 9.5 });
  if (data.mascota.notas) y = drawParagraph(doc, `Antecedentes y notas: ${redact(data.mascota.notas)}`, y, { color: COLORS.muted });

  const table = (title: string, head: string[][], body: string[][], startY: number, widths?: Record<number, { cellWidth: number }>) => {
    let tableY = addSectionTitle(doc, title, ensureSpace(doc, startY + 2, 20));
    autoTable(doc, {
      startY: tableY,
      head,
      body: body.length ? body : [['Sin registros', ...Array(Math.max(0, head[0].length - 1)).fill('')]],
      theme: 'grid',
      margin: { left: MARGIN, right: MARGIN, top: 18, bottom: 20 },
      styles: { font: 'helvetica', fontSize: 7.8, textColor: COLORS.navy, cellPadding: 2.2, overflow: 'linebreak', valign: 'top' },
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', lineColor: COLORS.primary },
      alternateRowStyles: { fillColor: [246, 250, 252] },
      columnStyles: widths,
      rowPageBreak: 'avoid',
      showHead: 'everyPage',
    });
    return ((doc as JsPdf & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || tableY) + 4;
  };

  y = table('Historial de atenciones', [['Fecha', 'Servicio', 'Estado', 'Motivo']], data.citas.map(item => [
    dateLabel(item.fechaHora, true),
    titleCase(item.tipoServicio),
    titleCase(item.estado),
    redact(item.motivo),
  ]), y, { 0: { cellWidth: 34 }, 1: { cellWidth: 31 }, 2: { cellWidth: 25 } });

  y = addSectionTitle(doc, 'Casos clínicos y diagnósticos', ensureSpace(doc, y + 2, 25));
  if (!data.casos.length) {
    y = drawParagraph(doc, 'Sin casos clínicos registrados.', y, { color: COLORS.muted });
  } else {
    for (const clinicalCase of [...data.casos].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))) {
      y = ensureSpace(doc, y, 39);
      const caseTitle = doc.splitTextToSize(
        `${dateLabel(clinicalCase.fecha)} · ${redact(clinicalCase.motivo)} · ${titleCase(clinicalCase.estado)}`,
        CONTENT_WIDTH - 8,
      ).slice(0, 2);
      const caseHeaderHeight = 6 + caseTitle.length * 4;
      doc.setFillColor(247, 251, 253);
      doc.setDrawColor(...COLORS.border);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, caseHeaderHeight, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORS.navy);
      doc.text(caseTitle, MARGIN + 4, y + 5.5);
      y += caseHeaderHeight + 3;
      y = drawParagraph(doc, `Diagnóstico: ${redact(clinicalCase.diagnostico, 'Pendiente')}`, y, { bold: true });
      const soapRows: Array<[string, string]> = [
        ['Subjetivo', redact(clinicalCase.soap?.subjetivo)],
        ['Objetivo', redact(clinicalCase.soap?.objetivo)],
        ['Análisis', redact(clinicalCase.soap?.analisis)],
        ['Plan', redact(clinicalCase.soap?.plan)],
      ];
      for (const [label, value] of soapRows) {
        if (value !== 'Sin registro') y = drawParagraph(doc, `${label}: ${value}`, y, { fontSize: 8.3, color: COLORS.muted, indent: 3 });
      }
      y += 2;
    }
  }

  y = table('Tratamientos', [['Fecha', 'Tratamiento', 'Dosis', 'Duración']], data.tratamientos.map(item => [
    dateLabel(item.fecha), redact(item.nombre), redact(item.dosis), redact(item.duracion),
  ]), y, { 0: { cellWidth: 29 }, 1: { cellWidth: 53 }, 2: { cellWidth: 50 } });

  y = table('Vacunación', [['Aplicación', 'Vacuna', 'Lote', 'Próxima dosis']], data.vacunas.map(item => [
    dateLabel(item.fechaAplicacion), redact(item.nombre), redact(item.lote), dateLabel(item.proximaDosis),
  ]), y, { 0: { cellWidth: 31 }, 1: { cellWidth: 54 }, 2: { cellWidth: 42 } });

  y = table('Desparasitación', [['Fecha', 'Producto', 'Dosis', 'Próxima dosis']], data.desparasitaciones.map(item => [
    dateLabel(item.fecha), redact(item.producto), redact(item.dosis), dateLabel(item.proximaDosis),
  ]), y, { 0: { cellWidth: 31 }, 1: { cellWidth: 54 }, 2: { cellWidth: 50 } });

  y = table('Cirugías y procedimientos', [['Fecha', 'Procedimiento', 'Anestesia', 'Pronóstico / notas']], data.cirugias.map(item => [
    dateLabel(item.fecha), redact(item.tipo), redact(item.anestesia), [redact(item.prognosis, ''), redact(item.notas, '')].filter(Boolean).join(' · ') || 'Sin registro',
  ]), y, { 0: { cellWidth: 29 }, 1: { cellWidth: 45 }, 2: { cellWidth: 42 } });

  y = table('Exámenes y estudios', [['Fecha', 'Tipo / título', 'Descripción', 'Anexo']], data.examenes.map(item => [
    dateLabel(item.fecha), redact(item.titulo || item.tipo), redact(item.descripcion), item.archivoUrl ? 'Imagen adjunta' : 'Sin archivo',
  ]), y, { 0: { cellWidth: 29 }, 1: { cellWidth: 47 }, 3: { cellWidth: 26 } });

  y = table('Evolución de peso', [['Fecha', 'Peso']], [...data.pesos]
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
    .map(item => [dateLabel(item.fecha), `${item.peso} kg`]), y, { 0: { cellWidth: 70 } });
  y = drawWeightChart(doc, data.pesos, y);

  y = addSectionTitle(doc, 'Hospitalizaciones', ensureSpace(doc, y + 2, 25), COLORS.teal);
  if (!data.hospitalizaciones.length) {
    y = drawParagraph(doc, 'Sin hospitalizaciones registradas.', y, { color: COLORS.muted });
  } else {
    for (const hospitalization of [...data.hospitalizaciones].sort((a, b) => String(b.fechaIngreso).localeCompare(String(a.fechaIngreso)))) {
      y = ensureSpace(doc, y, 35);
      const hospitalizationTitle = doc.splitTextToSize(
        `${dateLabel(hospitalization.fechaIngreso, true)} · ${titleCase(hospitalization.estado)} · ${redact(hospitalization.motivo)}`,
        CONTENT_WIDTH - 8,
      ).slice(0, 2);
      const hospitalizationHeaderHeight = 6 + hospitalizationTitle.length * 4;
      doc.setFillColor(...(hospitalization.estado === 'hospitalizado' ? COLORS.paleBlue : [247, 249, 250] as RGB));
      doc.setDrawColor(...COLORS.border);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, hospitalizationHeaderHeight, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.3);
      doc.setTextColor(...COLORS.navy);
      doc.text(hospitalizationTitle, MARGIN + 4, y + 5.5);
      y += hospitalizationHeaderHeight + 3;
      if (hospitalization.fechaAlta) y = drawParagraph(doc, `Alta: ${dateLabel(hospitalization.fechaAlta, true)}`, y, { fontSize: 8.2 });
      if (hospitalization.resumenAlta) y = drawParagraph(doc, `Resumen de alta: ${redact(hospitalization.resumenAlta)}`, y, { fontSize: 8.2 });
      if (hospitalization.indicacionesAlta) y = drawParagraph(doc, `Indicaciones: ${redact(hospitalization.indicacionesAlta)}`, y, { fontSize: 8.2 });

      const meds = data.medicaciones.filter(item => item.hospitalizacionId === hospitalization.id);
      if (meds.length) {
        y = table('Medicaciones de hospitalización', [['Medicamento', 'Dosis / vía', 'Frecuencia', 'Periodo', 'Administración']], meds.map(item => {
          const totalDoses = item.tomas?.length || 0;
          const administeredDoses = item.tomas?.filter(dose => dose.administrada).length || 0;
          return [
            redact(item.medicamento),
            `${redact(item.dosis)} / ${redact(item.via)}`,
            redact(item.frecuencia),
            `${dateLabel(item.fechaInicio)} - ${dateLabel(item.fechaFin)}`,
            totalDoses ? `${administeredDoses} de ${totalDoses} tomas registradas` : 'Sin tomas registradas',
          ];
        }), y, { 0: { cellWidth: 39 }, 1: { cellWidth: 38 }, 2: { cellWidth: 32 }, 3: { cellWidth: 38 } });
      }

      const evolutions = data.evoluciones.filter(item => item.hospitalizacionId === hospitalization.id);
      if (evolutions.length) {
        y = table('Evoluciones durante hospitalización', [['Fecha', 'Signos vitales', 'Estado general', 'Observaciones']], evolutions.map(item => [
          dateLabel(item.fecha, true), redact(item.signosVitales), redact(item.estadoGeneral), redact(item.observaciones),
        ]), y, { 0: { cellWidth: 32 }, 1: { cellWidth: 45 }, 2: { cellWidth: 45 } });
      }
    }
  }

  const radiographs = data.examenes.filter(item => item.archivoUrl && item.tipo.toLocaleLowerCase('es').includes('radiograf'));
  if (options.incluirRadiografias && radiographs.length) {
    y = addSectionTitle(doc, 'Anexos radiográficos', ensureSpace(doc, y + 3, 35), COLORS.teal);
    for (const radiograph of radiographs) {
      y = ensureSpace(doc, y, 155);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.navy);
      doc.text(`${redact(radiograph.titulo || 'Radiografía')} · ${dateLabel(radiograph.fecha)}`, MARGIN, y + 5);
      y += 9;
      y = drawParagraph(doc, redact(radiograph.descripcion), y, { fontSize: 8.3, color: COLORS.muted });
      try {
        const image = await imageAsJpeg(radiograph.archivoUrl as string, 2000);
        const maxWidth = CONTENT_WIDTH;
        const maxHeight = 130;
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
        const imageWidth = image.width * ratio;
        const imageHeight = image.height * ratio;
        y = ensureSpace(doc, y, imageHeight + 8);
        const imageX = MARGIN + (CONTENT_WIDTH - imageWidth) / 2;
        doc.setFillColor(20, 31, 43);
        doc.roundedRect(imageX - 1, y - 1, imageWidth + 2, imageHeight + 2, 2, 2, 'F');
        doc.addImage(image.dataUrl, 'JPEG', imageX, y, imageWidth, imageHeight, undefined, 'FAST');
        y += imageHeight + 8;
      } catch {
        y = drawParagraph(doc, 'La imagen no pudo incorporarse al PDF. El registro clínico y su descripción se conservaron en la sección de exámenes.', y, { color: COLORS.danger, fontSize: 8.3 });
      }
    }
  }

  y = addSectionTitle(doc, 'Cierre del informe', ensureSpace(doc, y + 4, 45));
  y = drawParagraph(doc, 'Este informe resume la información registrada en NANIVET hasta la fecha de generación. Debe interpretarse junto con la evaluación clínica directa del profesional receptor.', y, { color: COLORS.muted });
  y = ensureSpace(doc, y + 4, 28);
  doc.setDrawColor(...COLORS.border);
  doc.line(MARGIN, y + 13, MARGIN + 70, y + 13);
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text('Firma del profesional remitente', MARGIN, y + 18);
  doc.line(PAGE_WIDTH - MARGIN - 70, y + 13, PAGE_WIDTH - MARGIN, y + 13);
  doc.text('Fecha de entrega', PAGE_WIDTH - MARGIN - 70, y + 18);

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    if (page > 1) {
      doc.setFillColor(...COLORS.navy);
      doc.rect(0, 0, PAGE_WIDTH, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.white);
      doc.text('NANIVET · INFORME DE REFERENCIA VETERINARIA', MARGIN, 6.6);
      doc.setFont('helvetica', 'normal');
      doc.text(redact(data.mascota.nombre, 'Paciente'), PAGE_WIDTH - MARGIN, 6.6, { align: 'right' });
    }
    doc.setDrawColor(...COLORS.border);
    doc.line(MARGIN, 284, PAGE_WIDTH - MARGIN, 284);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...COLORS.muted);
    doc.text(`${reference} · Documento clínico confidencial y anonimizado`, MARGIN, 289);
    doc.text(`Página ${page} de ${totalPages}`, PAGE_WIDTH - MARGIN, 289, { align: 'right' });
  }

  const datePart = generatedAt.toISOString().slice(0, 10);
  doc.save(`referencia-nanivet-${safeFilename(data.mascota.nombre)}-${datePart}.pdf`);
}
