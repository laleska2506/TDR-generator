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

type BackendError = { error?: string; message?: string };

type GenerateTDRPayload = {
    area: string;
    activities: string;
    numEntregables: number;
    cvText?: string;
    examples?: string[];
};

function getApiBaseUrl(): string {
    const envUrl = import.meta.env.VITE_API_URL as string | undefined;
    return envUrl?.trim() ? envUrl.trim() : "http://localhost:8080";
}

function safeJsonParse<T>(text: string): T | null {
    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}

function extractJson(text: string): string {
    const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
        throw new Error("No se encontró un objeto JSON en la respuesta del backend.");
    }
    return cleaned.slice(start, end + 1);
}

export async function generateTDR(
    activities: string,
    area: string,
    numEntregables: number,
    cvText?: string,
    examples?: string[]
): Promise<TDRData> {
    const baseUrl = getApiBaseUrl();
    const endpoint = "/api/tdr/generate";

    const payload: GenerateTDRPayload = {
        area,
        activities,
        numEntregables,
        cvText: cvText?.trim() ? cvText : undefined,
        examples: examples && examples.length ? examples : undefined,
    };

    const res = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const text = await res.text();

    if (!res.ok) {
        const maybeError = safeJsonParse<BackendError>(text);
        const msg = maybeError?.error || maybeError?.message || text || `Error ${res.status}`;
        throw new Error(msg);
    }

    const jsonStr = extractJson(text);
    const data = safeJsonParse<TDRData>(jsonStr);

    if (!data) {
        throw new Error(
            `El backend respondió, pero no devolvió JSON válido. Primeros 200 chars:\n${text.slice(0, 200)}`
        );
    }

    if (!data.organo || !data.denominacion || !Array.isArray(data.entregables)) {
        throw new Error("El JSON recibido no tiene el formato esperado de TDRData.");
    }

    return data;
}
