import { TDRData } from '../types/tdr';

interface Props {
  data: TDRData;
}

export default function TDRPreview({ data }: Props) {
  const handleCopy = () => {
    const text = formatTDRAsText(data);
    navigator.clipboard.writeText(text);
    alert('TDR copiado al portapapeles');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="tdr-preview card">
      <div className="preview-header">
        <h2>TDR Generado</h2>
        <div className="preview-actions">
          <button className="btn-secondary" onClick={handleCopy}>📋 Copiar</button>
          <button className="btn-secondary" onClick={handlePrint}>🖨️ Imprimir</button>
        </div>
      </div>

      <div className="tdr-document" id="tdr-print">
        <div className="tdr-section">
          <h3>1. ÓRGANO RESPONSABLE</h3>
          <p>{data.organo}</p>
        </div>

        <div className="tdr-section">
          <h3>2. ACTIVIDAD DEL POI</h3>
          <p>{data.actividadPoi}</p>
        </div>

        <div className="tdr-section">
          <h3>3. DENOMINACIÓN DEL SERVICIO</h3>
          <p>{data.denominacion}</p>
        </div>

        <div className="tdr-section">
          <h3>4. FINALIDAD PÚBLICA</h3>
          <p>{data.finalidadPublica}</p>
        </div>

        <div className="tdr-section">
          <h3>5. OBJETIVO DEL SERVICIO</h3>
          <p>{data.objetivo}</p>
        </div>

        <div className="tdr-section">
          <h3>6. ACTIVIDADES</h3>
          <ol>
            {data.actividades.map((act, i) => (
              <li key={i}>{act}</li>
            ))}
          </ol>
        </div>

        <div className="tdr-section">
          <h3>7. PERFIL DEL CONSULTOR</h3>
          <h4>7.1 Requisitos Mínimos</h4>
          <ul>
            {data.perfil.requisitos.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
          <h4>7.2 Formación Académica</h4>
          <ul>
            {data.perfil.formacion.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
          <h4>7.3 Experiencia</h4>
          <p>{data.perfil.experiencia}</p>
        </div>

        <div className="tdr-section">
          <h3>8. LUGAR DE PRESTACIÓN</h3>
          <p>{data.lugar}</p>
        </div>

        <div className="tdr-section">
          <h3>9. PLAZO DE EJECUCIÓN</h3>
          <p>{data.plazo}</p>
        </div>

        <div className="tdr-section">
          <h3>10. ENTREGABLES</h3>
          <table className="tdr-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Descripción</th>
                <th>Plazo</th>
              </tr>
            </thead>
            <tbody>
              {data.entregables.map((e) => (
                <tr key={e.numero}>
                  <td>{e.numero}</td>
                  <td>{e.descripcion}</td>
                  <td>{e.plazo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="tdr-section">
          <h3>11. FORMA DE PAGO</h3>
          <table className="tdr-table">
            <thead>
              <tr>
                <th>Entregable</th>
                <th>Condición</th>
                <th>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              {data.pagos.map((p, i) => (
                <tr key={i}>
                  <td>{p.entregable}</td>
                  <td>{p.condicion}</td>
                  <td>{p.porcentaje}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatTDRAsText(data: TDRData): string {
  return `TÉRMINOS DE REFERENCIA
======================

1. ÓRGANO RESPONSABLE
${data.organo}

2. ACTIVIDAD DEL POI
${data.actividadPoi}

3. DENOMINACIÓN DEL SERVICIO
${data.denominacion}

4. FINALIDAD PÚBLICA
${data.finalidadPublica}

5. OBJETIVO DEL SERVICIO
${data.objetivo}

6. ACTIVIDADES
${data.actividades.map((a, i) => `${i + 1}. ${a}`).join('\n')}

7. PERFIL DEL CONSULTOR
7.1 Requisitos Mínimos
${data.perfil.requisitos.map(r => `- ${r}`).join('\n')}

7.2 Formación Académica
${data.perfil.formacion.map(f => `- ${f}`).join('\n')}

7.3 Experiencia
${data.perfil.experiencia}

8. LUGAR DE PRESTACIÓN
${data.lugar}

9. PLAZO DE EJECUCIÓN
${data.plazo}

10. ENTREGABLES
${data.entregables.map(e => `Entregable ${e.numero}: ${e.descripcion} (${e.plazo})`).join('\n')}

11. FORMA DE PAGO
${data.pagos.map(p => `${p.entregable}: ${p.condicion} - ${p.porcentaje}`).join('\n')}
`;
}
