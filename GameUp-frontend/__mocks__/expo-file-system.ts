/**
 * Simulación de expo-file-system para Jest (el módulo nativo no existe en las
 * pruebas). Guarda los archivos en memoria: `__mockFiles` permite crear
 * archivos y comprobar cuáles se borraron.
 */
export const __mockFiles = new Set<string>();

type Part = string | { uri: string };

function join(parts: Part[]): string {
  return parts
    .map((part) => (typeof part === 'string' ? part : part.uri))
    .join('/')
    .replace(/([^:/])\/{2,}/g, '$1/');
}

export class File {
  uri: string;

  constructor(...parts: Part[]) {
    this.uri = join(parts);
  }

  get name(): string {
    return this.uri.split('/').pop() ?? '';
  }

  get exists(): boolean {
    return __mockFiles.has(this.uri);
  }

  create(): void {
    __mockFiles.add(this.uri);
  }

  delete(): void {
    if (!__mockFiles.delete(this.uri)) {
      throw new Error(`No existe: ${this.uri}`);
    }
  }

  bytes(): Promise<Uint8Array> {
    return Promise.resolve(new Uint8Array());
  }
}

export class Directory {
  uri: string;

  constructor(...parts: Part[]) {
    this.uri = join(parts);
  }

  get exists(): boolean {
    return [...__mockFiles].some((file) => file.startsWith(`${this.uri}/`));
  }

  list(): (File | Directory)[] {
    return [...__mockFiles]
      .filter((file) => file.startsWith(`${this.uri}/`))
      .filter((file) => !file.slice(this.uri.length + 1).includes('/'))
      .map((file) => new File(file));
  }
}

export const Paths = {
  get cache(): Directory {
    return new Directory('file:///cache');
  },
};
