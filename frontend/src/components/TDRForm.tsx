import { useState } from 'react';
import { TDRRequest } from '../types/tdr';

interface Props {
  onGenerate: (request: TDRRequest) => void;
  loading: boolean;
}

export default function TDRForm({ onGenerate, loading }: Props) {
  const [form, setForm] = useState<TDRRequest>({
    area: '',
    activities: '',
    numEntregables: 3,
    cvText: '',
    examples: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'numEntregables' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="tdr-form card">
      <h2>Datos para el TDR</h2>

      <div className="form-group">
        <label htmlFor="area">Área / Unidad Orgánica *</label>
        <input
          id="area"
          name="area"
          type="text"
          required
          placeholder="Ej: Gerencia de Regulación Tarifaria"
          value={form.area}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="activities">Actividades a Realizar *</label>
        <textarea
          id="activities"
          name="activities"
          required
          rows={4}
          placeholder="Describe las actividades principales que deberá realizar el consultor..."
          value={form.activities}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="numEntregables">Número de Entregables</label>
        <select
          id="numEntregables"
          name="numEntregables"
          value={form.numEntregables}
          onChange={handleChange}
        >
          {[1, 2, 3, 4, 5, 6].map(n => (
            <option key={n} value={n}>{n} entregable{n > 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="cvText">Texto del CV del Consultor *</label>
        <textarea
          id="cvText"
          name="cvText"
          required
          rows={8}
          placeholder="Pega aquí el contenido del CV del consultor (formación, experiencia, habilidades)..."
          value={form.cvText}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="examples">Ejemplos de TDRs Anteriores (opcional)</label>
        <textarea
          id="examples"
          name="examples"
          rows={5}
          placeholder="Pega aquí fragmentos de TDRs anteriores para mantener el estilo institucional..."
          value={form.examples}
          onChange={handleChange}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner" /> Generando TDR...
          </>
        ) : (
          '✨ Generar TDR'
        )}
      </button>
    </form>
  );
}
