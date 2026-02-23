import { GoogleGenAI, Type } from "@google/genai";

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
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const prompt = `
    Genera un documento de Términos de Referencia (TDR) formal para la contratación de un servicio de consultoría en una entidad pública peruana (estilo SUNASS).
    
    PARÁMETROS DEL USUARIO:
    - Área/Unidad Orgánica: ${area}
    - Actividades deseadas (lenguaje natural): ${activities}
    - Número de entregables requerido: ${numEntregables}
    ${cvText ? `- Perfil basado en este CV: ${cvText}` : ""}
    ${examples && examples.length > 0 ? `- Guíate de estos ejemplos de TDR para el estilo y estructura específica: ${examples.join("\n\n--- SIGUIENTE EJEMPLO ---\n\n")}` : ""}

    ESTRUCTURA REQUERIDA (Responde estrictamente en formato JSON):
    {
      "organo": "Nombre formal de la unidad orgánica",
      "actividadPoi": "Descripción formal de la actividad del POI/PEI relacionada",
      "denominacion": "Denominación formal de la contratación",
      "finalidadPublica": "Redacción formal de la finalidad pública (contexto normativo y necesidad)",
      "objetivo": "Objetivo general de la contratación",
      "actividades": ["Lista de actividades detalladas y técnicas"],
      "perfil": {
        "requisitos": ["Requisitos legales y administrativos"],
        "formacion": ["Carreras y capacitaciones específicas"],
        "experiencia": "Descripción de la experiencia mínima requerida"
      },
      "lugar": "Descripción del lugar de prestación",
      "plazo": "Plazo estimado total en días calendario",
      "entregables": [
        { "numero": 1, "descripcion": "Descripción del primer entregable", "plazo": "Plazo en días" }
        // Debe haber exactamente ${numEntregables} entregables
      ],
      "pagos": [
        { "entregable": "Entregable N° 1", "condicion": "Previa conformidad del entregable", "porcentaje": "X%" }
        // Debe haber exactamente ${numEntregables} pagos. 
        // IMPORTANTE: El porcentaje de pago debe ser el mismo para todos los entregables (ej: si son 2, 50% cada uno; si son 4, 25% cada uno).
        // La suma de los porcentajes debe ser exactamente 100%.
      ]
    }

    REGLAS DE REDACCIÓN:
    - Usa un lenguaje técnico, administrativo y formal.
    - Asegúrate de que las actividades sean coherentes con el área y el perfil.
    - Si se proporcionó un CV, moldea el perfil del consultor para que coincida con las fortalezas de ese CV pero manteniendo estándares profesionales.
    - La finalidad pública debe sonar institucional.
    - IMPORTANTE: Genera exactamente ${numEntregables} entregables.
    - NOTA: Los puntos del X en adelante son fijos y no necesitas generarlos, el sistema los añadirá automáticamente. Solo enfócate en los puntos I al IX.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text || "{}") as TDRData;
}
