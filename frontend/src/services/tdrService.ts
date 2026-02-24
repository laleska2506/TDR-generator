import { TDRData, TDRRequest } from '../types/tdr';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function generateTDR(request: TDRRequest): Promise<TDRData> {
  const response = await fetch(`${API_URL}/api/tdr/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}