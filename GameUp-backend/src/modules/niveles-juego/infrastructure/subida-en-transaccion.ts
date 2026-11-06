import type { Prisma } from '../../../generated/prisma/client.js';
import { esJuegoConEscalera } from '../../catalogo/domain/juegos/niveles-juego.js';
import {
  TIPO_AVISO_NIVEL_JUEGO,
  mensajeSubida,
  subidaPorAprobacion,
  type SubidaNivel,
} from '../domain/nivel-juego.js';

/**
 * Dentro de la transacción que acaba de crear la validación APROBADA de un
 * intento: si es de la escalera y de su nivel actual, sube un nivel (o lo
 * completa en el 5), guarda el historial y avisa a los acudientes. Si no le
 * corresponde, no hace nada.
 *
 * La actualización es condicional (nivel y estado leídos): si otra
 * validación ya cambió el nivel, esta no sube. Así nunca se salta un nivel,
 * aunque dos personas aprueben a la vez.
 */
export async function subirSiCorresponde(
  tx: Prisma.TransactionClient,
  intentoId: bigint,
  validadorId: bigint,
): Promise<SubidaNivel | null> {
  const intento = await tx.intento.findUnique({
    where: { id: intentoId },
    select: {
      asignacion_id: true,
      estudiante_id: true,
      estudiante: { select: { usuario: { select: { nombres: true } } } },
      actividad: {
        select: {
          nivel_juego: true,
          tipo_juego: { select: { id: true, codigo: true, nombre: true } },
        },
      },
    },
  });
  if (
    !intento ||
    intento.asignacion_id !== null ||
    intento.actividad.nivel_juego === null
  ) {
    return null;
  }
  const tipo = intento.actividad.tipo_juego;
  if (!esJuegoConEscalera(tipo.codigo)) return null;

  const clave = {
    estudiante_id: intento.estudiante_id,
    tipo_juego_id: tipo.id,
  };
  const estado = await tx.nivel_juego_estudiante.findUnique({
    where: { estudiante_id_tipo_juego_id: clave },
  });
  if (!estado) return null;
  const cambio = subidaPorAprobacion(
    { nivelActual: estado.nivel_actual, completado: estado.completado },
    intento.actividad.nivel_juego,
  );
  if (!cambio) return null;

  const { count } = await tx.nivel_juego_estudiante.updateMany({
    where: {
      ...clave,
      nivel_actual: cambio.nivelAnterior,
      completado: cambio.completadoAnterior,
    },
    data: {
      nivel_actual: cambio.nivelNuevo,
      completado: cambio.completado,
      actualizado_en: new Date(),
    },
  });
  if (count === 0) return null;

  // Triggers: rol y vínculo de quien valida; un intento sube una sola vez.
  await tx.historial_nivel_juego.create({
    data: {
      ...clave,
      nivel_anterior: cambio.nivelAnterior,
      nivel_nuevo: cambio.nivelNuevo,
      completado: cambio.completado,
      origen: 'VALIDACION',
      intento_id: intentoId,
      cambiado_por: validadorId,
    },
  });
  const mensaje = mensajeSubida(
    intento.estudiante.usuario.nombres,
    tipo.nombre,
    cambio,
  );
  await tx.$executeRaw`
    select public.fn_notificar_acudientes(${intento.estudiante_id}::bigint, ${TIPO_AVISO_NIVEL_JUEGO}, ${mensaje})`;

  return {
    ...cambio,
    intentoId,
    estudianteId: intento.estudiante_id,
    juego: tipo.codigo,
  };
}
