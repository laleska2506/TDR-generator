import.meta.env.VITE_API_URL

const MODEL_NAME = "gemini-3.1-pro-preview";

export interface TDRData {
  organo: string;
  actividadPoi: string;
  denominacion: string;
  finalidadPublica: string;
  objetivo: string;
  actividades: string[];
  perfil: {
    requisitos: string[];
    formacion: string[];
    experiencia: string;
  };
  lugar: string;
  plazo: string;
  entregables: {
    numero: number;
    descripcion: string;
    plazo: string;
  }[];
  pagos: {
    entregable: string;
    condicion: string;
    porcentaje: string;
  }[];
}

export async function generateTDR(
    activities: string,
    area: string,
    numEntregables: number,
    cvText?: string,
    examples?: string[]
): Promise<TDRData> {

  const response = await fetch('http://localhost:8080/api/tdr/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      area,
      activities,
      numEntregables,
      cvText: cvText ?? '',
      examples: examples ?? []
    })
  });

  if (!response.ok) {
    throw new Error('Error al generar el TDR');
  }

  return response.json() as Promise<TDRData>;
}