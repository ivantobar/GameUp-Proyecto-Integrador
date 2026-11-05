/**
 * Puerto Reloj: la hora actual se inyecta para que las reglas que dependen
 * del tiempo (caché de tokens, «lo practicamos hoy», plazo de 30 días de las
 * grabaciones) se puedan probar con un reloj fijo.
 */
export interface Reloj {
  ahora(): Date;
}

export const RELOJ = Symbol('RELOJ');

/** Adaptador real: la hora del sistema. */
export class RelojSistema implements Reloj {
  ahora(): Date {
    return new Date();
  }
}

/** Adaptador para pruebas: hora fija que se puede adelantar. */
export class RelojFijo implements Reloj {
  constructor(private actual: Date) {}

  ahora(): Date {
    return new Date(this.actual);
  }

  avanzar(ms: number): void {
    this.actual = new Date(this.actual.getTime() + ms);
  }
}
