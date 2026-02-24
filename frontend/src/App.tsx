import { useState } from 'react';
import { generateTDR } from './services/tdrService';
import { TDRData, TDRRequest } from './types/tdr';
import TDRForm from './components/TDRForm';
import TDRPreview from './components/TDRPreview';
import './App.css';

function App() {
  const [tdrData, setTdrData] = useState<TDRData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (request: TDRRequest) => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateTDR(request);
      setTdrData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar el TDR');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <img src="/sunass-logo.png" alt="SUNASS" className="logo" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <div>
              <h1>Generador de TDR Inteligente</h1>
              <p>Superintendencia Nacional de Servicios de Saneamiento</p>
            </div>
          </div>
        </header>

        <main className="app-main">
          <div className="container">
            <TDRForm onGenerate={handleGenerate} loading={loading} />

            {error && (
                <div className="error-banner">
                  <strong>Error:</strong> {error}
                </div>
            )}

            {tdrData && <TDRPreview data={tdrData} />}
          </div>
        </main>
      </div>
  );
}

export default App;
