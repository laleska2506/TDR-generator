export interface TDRRequest {
  area: string;
  activities: string;
  numEntregables: number;
  cvText: string;
  examples?: string;
}

export interface Perfil {
  requisitos: string[];
  formacion: string[];
  experiencia: string;
}

export interface Entregable {
  numero: number;
  descripcion: string;
  plazo: string;
}

export interface Pago {
  entregable: string;
  condicion: string;
  porcentaje: string;
}

export interface TDRData {
  organo: string;
  actividadPoi: string;
  denominacion: string;
  finalidadPublica: string;
  objetivo: string;
  actividades: string[];
  perfil: Perfil;
  lugar: string;
  plazo: string;
  entregables: Entregable[];
  pagos: Pago[];
}
