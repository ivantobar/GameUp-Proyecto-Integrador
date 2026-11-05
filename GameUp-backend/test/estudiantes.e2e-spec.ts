import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { CONSULTA_CONSENTIMIENTO } from '../src/modules/consentimiento/domain/consulta-consentimiento.js';
import { ConsultaConsentimientoSimulada } from '../src/modules/consentimiento/infrastructure/consultas-consentimiento.js';
import { crearAppDePrueba } from './dobles/app-de-prueba.js';
import {
  escenarioEstudiantes,
  TOKENS_ESCENARIO,
} from './dobles/escenario-estudiantes.js';
import { VerificadorTokenFalso } from './dobles/verificador-token-falso.js';

type Token = keyof typeof TOKENS_ESCENARIO | null;

async function crearApp(simularConsentimiento = false) {
  const { usuarios, estudiantes } = escenarioEstudiantes();
  const app = await crearAppDePrueba({
    usuarios,
    estudiantes,
    verificador: new VerificadorTokenFalso(TOKENS_ESCENARIO),
    reemplazos: simularConsentimiento
      ? [
          {
            provide: CONSULTA_CONSENTIMIENTO,
            useValue: new ConsultaConsentimientoSimulada(),
          },
        ]
      : [],
  });
  return { app, estudiantes };
}

function cliente(app: INestApplication<App>) {
  return (token: Token) => {
    const agente = request(app.getHttpServer());
    const con = <T extends request.Test>(r: T) =>
      token ? r.set('Authorization', `Bearer ${token}`) : r;
    return {
      get: (ruta: string) => con(agente.get(`/api/v1${ruta}`)),
      post: (ruta: string, cuerpo: object) =>
        con(agente.post(`/api/v1${ruta}`).send(cuerpo)),
      put: (ruta: string, cuerpo: object) =>
        con(agente.put(`/api/v1${ruta}`).send(cuerpo)),
      patch: (ruta: string, cuerpo: object) =>
        con(agente.patch(`/api/v1${ruta}`).send(cuerpo)),
      delete: (ruta: string) => con(agente.delete(`/api/v1${ruta}`)),
    };
  };
}

describe('Estudiantes (e2e)', () => {
  let app: INestApplication<App>;
  let como: ReturnType<typeof cliente>;
  let estudiantes: Awaited<ReturnType<typeof crearApp>>['estudiantes'];

  beforeEach(async () => {
    ({ app, estudiantes } = await crearApp());
    como = cliente(app);
  });

  afterEach(async () => {
    await app.close();
  });

  const ids = (body: { items: Array<{ id: string }> }) =>
    body.items.map((e) => e.id);

  describe('GET /estudiantes', () => {
    it('cada rol ve solo los suyos', async () => {
      expect(
        ids((await como('directora').get('/estudiantes').expect(200)).body),
      ).toEqual(['12', '10', '11']);
      expect(
        ids((await como('tallerista2').get('/estudiantes').expect(200)).body),
      ).toEqual(['10', '11']);
      expect(
        ids((await como('acudiente4').get('/estudiantes').expect(200)).body),
      ).toEqual(['10']);
    });

    it('resumen como lo espera la app (StudentSummary)', async () => {
      const res = await como('tallerista2')
        .get('/estudiantes?estado=ACTIVO')
        .expect(200);
      expect(res.body).toEqual({
        items: [
          {
            id: '10',
            displayName: 'Martín C.',
            initials: 'MC',
            nivel: { id: '1', nombre: 'BAJO' },
            estado: 'ACTIVO',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('query inválida → 400 con mensajes en español', async () => {
      const res = await como('directora')
        .get('/estudiantes?estado=OTRO&limit=99')
        .expect(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining([
          'estado debe ser uno de: ACTIVO, EGRESADO, RETIRADO.',
          'limit no puede ser mayor que 50.',
        ]),
      );
    });

    it('sin token → 401; estudiante → 403', async () => {
      await como(null).get('/estudiantes').expect(401);
      await como('estudiante10').get('/estudiantes').expect(403);
    });
  });

  describe('GET /estudiantes/me', () => {
    it('el estudiante ve su perfil (StudentProfile)', async () => {
      await como('estudiante10')
        .get('/estudiantes/me')
        .expect(200, {
          id: '10',
          displayName: 'Martín',
          personajeAvatar: null,
          nivel: { id: '1', nombre: 'BAJO' },
        });
    });

    it('un adulto → 403', async () => {
      await como('tallerista2').get('/estudiantes/me').expect(403);
    });
  });

  describe('GET /estudiantes/:id', () => {
    it('ficha del estudiante a cargo', async () => {
      const res = await como('tallerista2').get('/estudiantes/10').expect(200);
      expect(res.body).toMatchObject({
        id: '10',
        nombres: 'Martín José',
        fechaIngreso: '2026-02-03',
        cuentaActiva: true,
      });
      expect(res.body).not.toHaveProperty('idEstudianteExterno');
    });

    it.each([
      ['tallerista sin el estudiante a cargo', 'tallerista2', '12'],
      ['tallerista con vínculo inactivo', 'tallerista3', '10'],
      ['acudiente de otro estudiante', 'acudiente5', '10'],
    ] as const)(
      'estudiante ajeno (%s) → 404 igual que si no existiera',
      async (_c, token, id) => {
        const ajeno = await como(token).get(`/estudiantes/${id}`).expect(404);
        const inexistente = await como(token)
          .get('/estudiantes/999')
          .expect(404);
        expect(ajeno.body).toEqual(inexistente.body);
      },
    );

    it('id inválido → 400', async () => {
      await como('directora').get('/estudiantes/abc').expect(400);
    });
  });

  describe('PUT /estudiantes/:id/nivel e historial', () => {
    it('la directora cambia el nivel; el acudiente ve el historial', async () => {
      const res = await como('directora')
        .put('/estudiantes/10/nivel', {
          nivelId: '2',
          motivo: 'Reconoce vocales',
        })
        .expect(200);
      expect(res.body.nivel).toEqual({ id: '2', nombre: 'MEDIO' });
      expect(estudiantes.notificados).toEqual([10n]);

      const historial = await como('acudiente4')
        .get('/estudiantes/10/historial-nivel')
        .expect(200);
      expect(historial.body.items[0]).toMatchObject({
        nivel: { id: '2', nombre: 'MEDIO' },
        motivo: 'Reconoce vocales',
        asignadoPor: { id: '1', displayName: 'Diana Directora' },
      });
    });

    it('mismo nivel → 422; nivelId inválido → 400; tallerista → 403; ajeno en historial → 404', async () => {
      await como('directora')
        .put('/estudiantes/10/nivel', { nivelId: '1' })
        .expect(422);
      await como('directora')
        .put('/estudiantes/10/nivel', { nivelId: 'dos' })
        .expect(400);
      await como('tallerista2')
        .put('/estudiantes/10/nivel', { nivelId: '2' })
        .expect(403);
      await como('tallerista3')
        .get('/estudiantes/10/historial-nivel')
        .expect(404);
    });
  });

  describe('talleristas del estudiante (directora)', () => {
    it('asignar da acceso a la tallerista; retirar se lo quita al instante', async () => {
      await como('tallerista2').get('/estudiantes/12').expect(404);

      const res = await como('directora')
        .post('/estudiantes/12/talleristas', { talleristaId: '2' })
        .expect(201);
      expect(res.body).toMatchObject({
        talleristaId: '2',
        displayName: 'Ana Gómez',
        activo: true,
      });
      await como('tallerista2').get('/estudiantes/12').expect(200);

      await como('directora')
        .delete('/estudiantes/12/talleristas/2')
        .expect(204);
      await como('tallerista2').get('/estudiantes/12').expect(404);
      await como('directora')
        .delete('/estudiantes/12/talleristas/2')
        .expect(404);
    });

    it('lista el historial de talleristas', async () => {
      const res = await como('directora')
        .get('/estudiantes/10/talleristas')
        .expect(200);
      expect(
        res.body.map((t: { talleristaId: string; activo: boolean }) => [
          t.talleristaId,
          t.activo,
        ]),
      ).toEqual([
        ['2', true],
        ['3', false],
      ]);
    });

    it('ya a cargo → 409; cuenta que no es tallerista → 422; cuerpo inválido → 400', async () => {
      await como('directora')
        .post('/estudiantes/10/talleristas', { talleristaId: '2' })
        .expect(409);
      await como('directora')
        .post('/estudiantes/10/talleristas', { talleristaId: '4' })
        .expect(422);
      const res = await como('directora')
        .post('/estudiantes/10/talleristas', {})
        .expect(400);
      expect(res.body.message[0]).toMatch(
        /talleristaId debe ser un id numérico/,
      );
    });

    it('otro rol → 403; estudiante inexistente → 404', async () => {
      await como('tallerista2').get('/estudiantes/10/talleristas').expect(403);
      await como('directora').get('/estudiantes/999/talleristas').expect(404);
    });
  });

  describe('acudientes del estudiante (directora)', () => {
    it('vincular, cambiar el principal y desvincular', async () => {
      await como('directora')
        .post('/estudiantes/10/acudientes', {
          acudienteId: '5',
          parentesco: 'Padre',
        })
        .expect(201);
      // Ya hay un principal (acudiente 4).
      await como('directora')
        .post('/estudiantes/12/acudientes', {
          acudienteId: '4',
          parentesco: 'Tía',
          esPrincipal: true,
        })
        .expect(201);
      await como('directora')
        .patch('/estudiantes/10/acudientes/5', { esPrincipal: true })
        .expect(200);

      const lista = await como('directora')
        .get('/estudiantes/10/acudientes')
        .expect(200);
      expect(lista.body).toEqual([
        {
          acudienteId: '5',
          displayName: 'Pedro Mora',
          parentesco: 'Padre',
          esPrincipal: true,
        },
        {
          acudienteId: '4',
          displayName: 'Laura Cruz',
          parentesco: 'Madre',
          esPrincipal: false,
        },
      ]);

      // El acudiente 5 ahora ve al estudiante 10.
      await como('acudiente5').get('/estudiantes/10').expect(200);
      await como('directora')
        .delete('/estudiantes/10/acudientes/5')
        .expect(204);
      await como('acudiente5').get('/estudiantes/10').expect(404);
    });

    it('segundo principal → 409; ya vinculado → 409; parentesco vacío → 400', async () => {
      await como('directora')
        .post('/estudiantes/10/acudientes', {
          acudienteId: '5',
          parentesco: 'Padre',
          esPrincipal: true,
        })
        .expect(409);
      await como('directora')
        .post('/estudiantes/10/acudientes', {
          acudienteId: '4',
          parentesco: 'Madre',
        })
        .expect(409);
      await como('directora')
        .post('/estudiantes/10/acudientes', {
          acudienteId: '5',
          parentesco: '',
        })
        .expect(400);
    });

    it('PATCH sin cambios → 422; acudiente no vinculado → 404; otro rol → 403', async () => {
      await como('directora')
        .patch('/estudiantes/10/acudientes/4', {})
        .expect(422);
      await como('directora')
        .patch('/estudiantes/10/acudientes/5', { parentesco: 'Tío' })
        .expect(404);
      await como('acudiente4').get('/estudiantes/10/acudientes').expect(403);
    });
  });

  describe('consentimiento de voz', () => {
    it('sin la API del núcleo familiar: no concedido (falla cerrado)', async () => {
      const res = await como('estudiante10')
        .get('/estudiantes/me/consentimiento-voz')
        .expect(200);
      expect(res.body).toMatchObject({
        concedido: false,
        motivo: 'NO_VERIFICABLE',
      });
      expect(res.body).not.toHaveProperty('codigoVersion');
    });

    it('acudiente del estudiante: 200; estudiante ajeno: 404; sin token: 401', async () => {
      await como('acudiente4')
        .get('/estudiantes/10/consentimiento-voz')
        .expect(200);
      await como('acudiente5')
        .get('/estudiantes/10/consentimiento-voz')
        .expect(404);
      await como(null).get('/estudiantes/10/consentimiento-voz').expect(401);
      await como('estudiante10')
        .get('/estudiantes/10/consentimiento-voz')
        .expect(403);
    });
  });
});

describe('Consentimiento simulado (solo desarrollo) (e2e)', () => {
  it('con CONSENTIMIENTO_SIMULADO el estudiante figura con consentimiento', async () => {
    const { app } = await crearApp(true);
    try {
      await cliente(app)('estudiante10')
        .get('/estudiantes/me/consentimiento-voz')
        .expect(200)
        .expect((res) =>
          expect(res.body).toMatchObject({
            concedido: true,
            motivo: 'ACEPTADO',
          }),
        );
    } finally {
      await app.close();
    }
  });
});
