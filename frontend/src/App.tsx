import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, Upload, Edit3, CheckCircle2, Loader2,
  ChevronRight, Plus, Trash2, FileDown, Files, X,
  Send, AlertTriangle, ArrowLeft,
} from 'lucide-react';
import { generateTDR, TDRData } from './services/tdrService';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, HeadingLevel,
} from 'docx';
import { saveAs } from 'file-saver';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/* ─────────────────────────────────────────────
   STEP INDICATOR
───────────────────────────────────────────── */
function StepIndicator({ step }: { step: number }) {
  return (
    <div className="hidden sm:flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step === 1 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-emerald-100 text-emerald-700'
          }`}>
          {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${step === 1 ? 'text-emerald-700' : 'text-emerald-500'}`}>
          Datos
        </span>
      </div>
      <div className={`w-12 h-0.5 rounded-full transition-colors duration-500 ${step === 2 ? 'bg-emerald-500' : 'bg-black/10'}`} />
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step === 2 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-black/5 text-black/30'
          }`}>
          2
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${step === 2 ? 'text-emerald-700' : 'text-black/30'}`}>
          Documento
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function App() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [area, setArea] = useState('');
  const [activities, setActivities] = useState('');
  const [cvText, setCvText] = useState('');
  const [cvName, setCvName] = useState('');
  const [numEntregables, setNumEntregables] = useState(2);
  const [examples, setExamples] = useState<{ name: string; text: string }[]>([]);
  const [tdrData, setTdrData] = useState<TDRData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── File upload ── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isExample = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (isExample && examples.length >= 5) { alert('Maximo 5 ejemplos'); break; }

      const processText = (text: string) => {
        if (isExample) setExamples(prev => [...prev, { name: file.name, text }]);
        else { setCvName(file.name); setCvText(text); }
      };

      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const arr = new Uint8Array(ev.target?.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(arr).promise;
          let full = '';
          for (let j = 1; j <= pdf.numPages; j++) {
            const page = await pdf.getPage(j);
            const tc = await page.getTextContent();
            full += tc.items.map((it: any) => it.str).join(' ') + '\n';
          }
          processText(full);
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => processText(ev.target?.result as string);
        reader.readAsText(file);
      }
    }
    e.target.value = '';
  };

  /* ── Generate ── */
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateTDR(activities, area, numEntregables, cvText, examples.map(ex => ex.text));
      setTdrData(data);
      setStep(2);
    } catch (err: any) {
      setError(err?.message ?? 'Error al generar el TDR. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Edit helper ── */
  const updateTdrField = (field: keyof TDRData, value: any) => {
    if (!tdrData) return;
    setTdrData({ ...tdrData, [field]: value });
  };

  /* ── Download Word ── */
  const downloadWord = async () => {
    if (!tdrData) return;
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'TERMINOS DE REFERENCIA PARA LA CONTRATACION DE SERVICIOS Y CONSULTORIAS', bold: true, size: 28 })],
          }),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 9360, type: WidthType.DXA }, columnWidths: [3120, 6240],
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Organo y/o Unidad Organica:', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(tdrData.organo)] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Actividad del POI / Accion Estrategica PEI:', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(tdrData.actividadPoi)] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Denominacion de la Contratacion:', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(tdrData.denominacion)] }),
                ]
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'I. FINALIDAD PUBLICA', bold: true })] }),
          new Paragraph({ text: tdrData.finalidadPublica, alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'II. OBJETIVO DE LA CONTRATACION', bold: true })] }),
          new Paragraph({ text: tdrData.objetivo, alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'III. ALCANCES Y DESCRIPCION DEL SERVICIO', bold: true })] }),
          ...tdrData.actividades.map(a => new Paragraph({ text: `- ${a}`, bullet: { level: 0 } })),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'IV. PERFIL DEL CONSULTOR', bold: true })] }),
          new Paragraph({ children: [new TextRun({ text: '4.1 REQUISITOS DEL CONTRATISTA', bold: true })] }),
          ...tdrData.perfil.requisitos.map(r => new Paragraph({ text: `- ${r}` })),
          new Paragraph({ children: [new TextRun({ text: '4.2 PERFIL DEL CONTRATISTA', bold: true })] }),
          ...tdrData.perfil.formacion.map(f => new Paragraph({ text: `- ${f}` })),
          new Paragraph({ text: `- ${tdrData.perfil.experiencia}` }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'V. LUGAR Y PLAZO DE EJECUCION', bold: true })] }),
          new Paragraph({ text: `LUGAR: ${tdrData.lugar}` }),
          new Paragraph({ text: `PLAZO: ${tdrData.plazo}` }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'VI. ENTREGABLES', bold: true })] }),
          new Table({
            width: { size: 9360, type: WidthType.DXA }, columnWidths: [936, 6552, 1872],
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'N', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Entregable', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Plazo', bold: true })] })] }),
                ]
              }),
              ...tdrData.entregables.map(e => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(String(e.numero))] }),
                  new TableCell({ children: [new Paragraph(e.descripcion)] }),
                  new TableCell({ children: [new Paragraph(e.plazo)] }),
                ]
              })),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'IX. FORMA Y CONDICIONES DE PAGO', bold: true })] }),
          new Table({
            width: { size: 9360, type: WidthType.DXA }, columnWidths: [2340, 5616, 1404],
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Entregable', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Condicion', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '% de Pago', bold: true })] })] }),
                ]
              }),
              ...tdrData.pagos.map(p => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(p.entregable)] }),
                  new TableCell({ children: [new Paragraph(p.condicion)] }),
                  new TableCell({ children: [new Paragraph(p.porcentaje)] }),
                ]
              })),
            ],
          }),
          new Paragraph({ text: '' }),
          ...([
            ['X. CONFIDENCIALIDAD', 'El contratista debera mantener estricta confidencialidad sobre la informacion a la que tendra acceso durante la ejecucion del servicio.'],
            ['XI. RESPONSABILIDAD DEL PROVEEDOR', 'El proveedor es responsable por la calidad ofrecida y por los vicios ocultos del servicio ofertado por un plazo no menor de un (01) ano.'],
            ['XII. CONSIDERACIONES GENERALES', 'Los derechos intelectuales de los productos elaborados son propiedad de la Entidad.'],
            ['XIII. PENALIDADES POR MORA', 'Penalidad diaria = 0.10 x monto / (F x plazo). Donde F = 0.40 para bienes y servicios.'],
            ['XIV. RESOLUCION CONTRACTUAL', 'Cualquiera de las partes puede resolver el contrato conforme al articulo 68 de la Ley N 32069.'],
            ['XV. SANCIONES', 'El proveedor se compromete a cumplir las obligaciones derivadas del contrato segun los articulos 87 al 92.'],
            ['XVI. APLICACION SUPLETORIA', 'Tambien se considera el Codigo Civil vigente, Ley No. 32069.'],
            ['XVII. MEDIDAS DE SEGURIDAD', 'No aplica.'],
            ['XVIII. SOLUCION DE CONTROVERSIAS', 'Las controversias se resuelven mediante conciliacion conforme al articulo 81 de la Ley N 32069.'],
            ['XIX. OBLIGACION ANTICORRUPCION', 'EL CONTRATISTA declara y garantiza no haber ofrecido ningun beneficio ilegal a funcionarios de la entidad.'],
            ['XX. CLAUSULA ANTISOBORNO', 'El contratista se compromete a actuar con integridad y a denunciar intentos de soborno al canal de la SUNASS.'],
            ['XXI. CLAUSULA GESTION DE RIESGO', 'LAS PARTES realizan la gestion de riesgos de acuerdo con lo establecido en el presente contrato.'],
            ['XXII. CLAUSULA DE VICIOS OCULTOS', 'El contratista es responsable por los vicios ocultos por un plazo no menor de un ano. Art. 69.2 literal c).'],
            ['XXIII. CLAUSULA MODIFICACION CONTRACTUAL', 'Las partes pueden acordar modificaciones que permitan alcanzar la finalidad del contrato de manera oportuna.'],
            ['XXIV. GARANTIAS', 'No aplica.'],
          ] as [string, string][]).flatMap(([title, text]) => [
            new Paragraph({ children: [new TextRun({ text: title, bold: true })] }),
            new Paragraph({ text, alignment: AlignmentType.JUSTIFIED }),
            new Paragraph({ text: '' }),
          ]),
        ],
      }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `TDR_${tdrData.denominacion.replace(/\s+/g, '_')}.docx`);
  };

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#1A1A1A] font-sans selection:bg-emerald-100">

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-[15%] -left-[10%] w-[45%] h-[45%] bg-emerald-500/[0.04] blur-[140px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/[0.04] blur-[120px] rounded-full" />
      </div>

      {/* ══════════════════════════════
          HEADER
      ══════════════════════════════ */}
      <header className="border-b border-black/[0.06] bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
              <FileText className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight whitespace-nowrap">
              TDR Generator <span className="text-emerald-600">AI</span>
            </span>
          </div>

          {/* Step indicator */}
          <StepIndicator step={step} />

          {/* Right actions */}
          {step === 2 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(v => !v)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition-all ${isEditing
                    ? 'border-emerald-400 text-emerald-700 bg-emerald-50'
                    : 'border-black/10 text-black/55 hover:bg-black/5'
                  }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isEditing ? 'Listo' : 'Editar'}
              </button>
              <button
                onClick={downloadWord}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all text-xs font-bold shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Descargar</span> .docx
              </button>
            </div>
          ) : (
            /* Spacer to keep step indicator visually centered */
            <div className="w-[120px] hidden sm:block" />
          )}
        </div>
      </header>

      {/* ══════════════════════════════
          MAIN
      ══════════════════════════════ */}
      <main className="relative z-10 px-4 sm:px-6 py-10 md:py-16">
        <div className="w-full max-w-7xl mx-auto">
          <AnimatePresence mode="wait">

            {/* ────────────────────────
                STEP 1  ·  FORM
            ──────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center"
              >
                {/* Hero text */}
                <div className="text-center mb-10 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full mb-5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                      Generador Inteligente &middot; SUNASS
                    </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-serif font-medium mb-3 tracking-tight leading-tight">
                    Crea tus<br className="hidden sm:block" /> Términos de Referencia
                  </h1>
                  <p className="text-black/45 text-base leading-relaxed">
                    Describe lo que necesitas y la IA redactará el documento formal siguiendo los estándares de SUNASS.
                  </p>
                </div>

                {/* Card */}
                <div className="w-full max-w-[680px] bg-white rounded-3xl shadow-xl shadow-black/[0.06] border border-black/[0.05] overflow-hidden">

                  {/* ── A: Service info ── */}
                  <div className="p-7 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-600/25 flex-shrink-0">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-black/80">Información del Servicio</h2>
                        <p className="text-[10px] text-black/35 font-semibold uppercase tracking-wider mt-0.5">
                          Datos principales de la contratación
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Area + Entregables */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-black/40">
                            Área o Unidad Orgánica <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={area}
                            onChange={e => setArea(e.target.value)}
                            placeholder="Ej: Unidad de Modernización"
                            className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/8 outline-none transition-all bg-black/[0.015] text-sm font-medium placeholder:text-black/20"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-black/40">
                            N.º de Entregables
                          </label>
                          <div className="flex p-1 bg-black/[0.025] rounded-xl border border-black/8 gap-0.5">
                            {[1, 2, 3, 4, 5].map(n => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setNumEntregables(n)}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-150 ${numEntregables === n
                                    ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5'
                                    : 'text-black/30 hover:text-black/60'
                                  }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Activities */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-black/40">
                          Actividades a Realizar <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={activities}
                          onChange={e => setActivities(e.target.value)}
                          placeholder="Describe las tareas principales. Ej: Elaboración de diagnóstico situacional, propuesta de mejora de procesos, talleres de validación..."
                          rows={5}
                          className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/8 outline-none transition-all resize-none bg-black/[0.015] text-sm font-medium leading-relaxed placeholder:text-black/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mx-7 md:mx-8 h-px bg-black/[0.06] border-0" style={{ backgroundImage: 'repeating-linear-gradient(90deg,rgba(0,0,0,0.08) 0,rgba(0,0,0,0.08) 4px,transparent 4px,transparent 8px)' }} />

                  {/* ── B: Attachments ── */}
                  <div className="p-7 md:p-8">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Upload className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-black/80">Archivos Opcionales</h2>
                        <p className="text-[10px] text-black/35 font-semibold uppercase tracking-wider mt-0.5">
                          Mejoran la calidad del resultado
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                      {/* CV Upload */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-black/45 uppercase tracking-wider">CV del Consultor</p>
                        <div className="relative group">
                          <input
                            type="file"
                            onChange={e => handleFileUpload(e, false)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            accept=".pdf,.txt"
                          />
                          <div className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-200 ${cvName
                              ? 'border-emerald-400 bg-emerald-50/60'
                              : 'border-black/10 group-hover:border-blue-300 group-hover:bg-blue-50/30'
                            }`}>
                            {cvName ? (
                              <div className="flex items-center gap-3 justify-center">
                                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div className="text-left overflow-hidden">
                                  <p className="font-bold text-xs text-emerald-800 truncate leading-tight">{cvName}</p>
                                  <p className="text-[9px] text-emerald-600/60 font-semibold uppercase tracking-wider mt-0.5">Cargado</p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <Upload className="w-5 h-5 text-black/15 mx-auto" />
                                <p className="text-xs font-semibold text-black/40">Haz clic o arrastra</p>
                                <p className="text-[9px] text-black/25 uppercase tracking-widest">PDF o .txt</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {cvName && (
                          <button
                            onClick={() => { setCvName(''); setCvText(''); }}
                            className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-600 transition-colors font-bold uppercase tracking-wider mx-auto"
                          >
                            <X className="w-3 h-3" /> Eliminar
                          </button>
                        )}
                      </div>

                      {/* TDR Examples */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold text-black/45 uppercase tracking-wider">TDRs de Referencia</p>
                          <span className={`text-[10px] font-bold tabular-nums ${examples.length >= 5 ? 'text-amber-500' : 'text-black/20'}`}>
                            {examples.length}/5
                          </span>
                        </div>

                        {/* List */}
                        {examples.length > 0 && (
                          <div className="space-y-1.5 max-h-[108px] overflow-y-auto">
                            {examples.map((ex, idx) => (
                              <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-amber-50/70 rounded-xl border border-amber-100">
                                <Files className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                <span className="text-[11px] font-semibold text-black/60 truncate flex-1">{ex.name}</span>
                                <button
                                  onClick={() => setExamples(prev => prev.filter((_, i) => i !== idx))}
                                  className="p-1 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-black/20"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add zone */}
                        {examples.length < 5 && (
                          <div className="relative group">
                            <input
                              type="file"
                              multiple
                              onChange={e => handleFileUpload(e, true)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              accept=".pdf,.txt"
                            />
                            <div className={`border-2 border-dashed border-black/10 rounded-2xl text-center group-hover:border-amber-400 group-hover:bg-amber-50/20 bg-black/[0.01] transition-all ${examples.length > 0 ? 'py-3' : 'py-5'
                              }`}>
                              <Plus className="w-4 h-4 text-black/15 mx-auto mb-1" />
                              <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest">
                                {examples.length === 0 ? 'Añadir TDRs de referencia' : 'Añadir otro'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Error banner */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mx-7 md:mx-8 mb-1 flex items-start gap-3 bg-red-50 border border-red-200/80 rounded-2xl px-4 py-3.5">
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-px" />
                          <p className="text-sm text-red-700 font-medium leading-snug">{error}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Generate button */}
                  <div className="px-7 md:px-8 pb-7 md:pb-8 pt-3">
                    <button
                      onClick={handleGenerate}
                      disabled={loading || !area.trim() || !activities.trim()}
                      className="group relative w-full px-6 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 hover:bg-emerald-700 active:scale-[0.985] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/20 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Generando documento...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Generar TDR Formal</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-black/20 font-semibold uppercase tracking-widest mt-4">
                      Impulsado por Gemini AI &middot; Estándares SUNASS
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ────────────────────────
                STEP 2  ·  DOCUMENT
            ──────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Sub-header */}
                <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
                  <button
                    onClick={() => { setStep(1); setError(null); }}
                    className="flex items-center gap-2 text-sm font-semibold text-black/40 hover:text-black transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a parámetros
                  </button>
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" />
                    Documento generado
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                  {/* Sidebar */}
                  <aside className="lg:col-span-3 sticky top-24 hidden lg:block space-y-3">
                    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 mb-3">
                        Secciones
                      </p>
                      <nav className="space-y-0.5">
                        {[
                          { id: 'sec-header', label: 'Encabezado' },
                          { id: 'sec-i', label: 'I. Finalidad Pública' },
                          { id: 'sec-ii', label: 'II. Objetivo' },
                          { id: 'sec-iii', label: 'III. Alcances' },
                          { id: 'sec-iv', label: 'IV. Perfil Consultor' },
                          { id: 'sec-v', label: 'V. Lugar y Plazo' },
                          { id: 'sec-vi', label: 'VI. Entregables' },
                          { id: 'sec-ix', label: 'IX. Cond. de Pago' },
                          { id: 'sec-x', label: 'X. Confidencialidad' },
                          { id: 'sec-xiii', label: 'XIII. Penalidades' },
                          { id: 'sec-xix', label: 'XIX. Anticorrupción' },
                        ].map(item => (
                          <button
                            key={item.id}
                            onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-black/45 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                          >
                            {item.label}
                          </button>
                        ))}
                      </nav>
                    </div>

                    {/* Edit mode hint */}
                    {isEditing && (
                      <div className="px-4 py-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                          Modo edición activo
                        </p>
                        <p className="text-[10px] text-emerald-600/70 leading-relaxed">
                          Haz clic en los campos verdes para modificarlos directamente.
                        </p>
                      </div>
                    )}
                  </aside>

                  {/* Document */}
                  <div className="lg:col-span-9">
                    <div className="bg-white shadow-xl shadow-black/[0.06] rounded-lg border border-black/[0.05] overflow-x-auto">
                      <div
                        id="tdr-document"
                        className="p-8 md:p-14 w-full max-w-[800px] mx-auto leading-[1.65] text-black"
                        style={{ fontFamily: 'Arial, sans-serif', fontSize: '10.5pt' }}
                      >
                        {/* Logo header */}
                        <div id="sec-header" className="flex justify-between items-start mb-10 pb-4 border-b-2 border-[#E30613]">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-[#E30613] flex items-center justify-center text-white font-black leading-tight text-center" style={{ fontSize: '9px' }}>
                              SUNASS
                            </div>
                            <div className="border-l border-black/15 pl-3 leading-tight">
                              <p style={{ fontSize: '8.5px' }} className="font-bold uppercase tracking-tight text-black/70">
                                Superintendencia Nacional de
                              </p>
                              <p style={{ fontSize: '18px' }} className="font-black text-[#E30613] tracking-tight leading-none mt-0.5">
                                Servicios de Saneamiento
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p style={{ fontSize: '8px' }} className="font-bold text-black/30 uppercase tracking-widest">Documento de Trabajo</p>
                            <p style={{ fontSize: '8px' }} className="font-bold text-black/30 uppercase tracking-widest">Version IA 1.0</p>
                          </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-center font-bold uppercase underline mb-7" style={{ fontSize: '13pt' }}>
                          Términos de Referencia para la Contratación de Servicios y Consultorías
                        </h2>

                        {/* Info table */}
                        <table className="w-full border-collapse border border-black mb-8" style={{ fontSize: '9.5pt' }}>
                          <tbody>
                            {([
                              { label: 'Órgano y/o Unidad Orgánica:', field: 'organo' as keyof TDRData, value: tdrData?.organo },
                              { label: 'Actividad del POI / Acción Estratégica PEI:', field: 'actividadPoi' as keyof TDRData, value: tdrData?.actividadPoi },
                              { label: 'Denominación de la Contratación:', field: 'denominacion' as keyof TDRData, value: tdrData?.denominacion },
                            ]).map(row => (
                              <tr key={row.field}>
                                <td className="border border-black p-2 font-bold bg-gray-50 align-top" style={{ width: '38%' }}>{row.label}</td>
                                <td className="border border-black p-2">
                                  {isEditing
                                    ? <input className="w-full bg-emerald-50 border border-emerald-200 rounded px-2 py-1 outline-none text-[9.5pt]" value={row.value ?? ''} onChange={e => updateTdrField(row.field, e.target.value)} />
                                    : row.value}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Sections */}
                        <div className="space-y-7" style={{ fontSize: '9.5pt' }}>

                          <section id="sec-i">
                            <h3 className="font-bold mb-2 uppercase" style={{ fontSize: '10pt' }}>I. Finalidad Pública</h3>
                            {isEditing
                              ? <textarea className="w-full bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5 outline-none min-h-[80px] resize-y" value={tdrData?.finalidadPublica ?? ''} onChange={e => updateTdrField('finalidadPublica', e.target.value)} />
                              : <p className="text-justify leading-relaxed">{tdrData?.finalidadPublica}</p>}
                          </section>

                          <section id="sec-ii">
                            <h3 className="font-bold mb-2 uppercase" style={{ fontSize: '10pt' }}>II. Objetivo de la Contratación</h3>
                            {isEditing
                              ? <textarea className="w-full bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5 outline-none min-h-[60px] resize-y" value={tdrData?.objetivo ?? ''} onChange={e => updateTdrField('objetivo', e.target.value)} />
                              : <p className="text-justify leading-relaxed">{tdrData?.objetivo}</p>}
                          </section>

                          <section id="sec-iii">
                            <h3 className="font-bold mb-2 uppercase" style={{ fontSize: '10pt' }}>III. Alcances y Descripción del Servicio</h3>
                            <p className="mb-3">Para la ejecución del servicio, se desarrollarán las siguientes actividades:</p>
                            <ul className="list-disc pl-6 space-y-1.5">
                              {tdrData?.actividades.map((act, idx) => (
                                <li key={idx}>
                                  {isEditing ? (
                                    <div className="flex gap-2 items-center">
                                      <input className="flex-1 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 outline-none" value={act}
                                        onChange={e => { const n = [...tdrData.actividades]; n[idx] = e.target.value; updateTdrField('actividades', n); }} />
                                      <button onClick={() => updateTdrField('actividades', tdrData.actividades.filter((_, i) => i !== idx))}
                                        className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-black/20">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : act}
                                </li>
                              ))}
                            </ul>
                            {isEditing && (
                              <button onClick={() => updateTdrField('actividades', [...(tdrData?.actividades ?? []), 'Nueva actividad'])}
                                className="mt-3 text-xs text-emerald-600 flex items-center gap-1.5 hover:text-emerald-800 transition-colors">
                                <Plus className="w-3.5 h-3.5" /> Añadir actividad
                              </button>
                            )}
                          </section>

                          <section id="sec-iv">
                            <h3 className="font-bold mb-3 uppercase" style={{ fontSize: '10pt' }}>IV. Perfil del Consultor</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="font-bold underline mb-2 uppercase">4.1 Requisitos del Contratista</p>
                                <ul className="pl-6 space-y-1.5">
                                  {tdrData?.perfil.requisitos.map((req, idx) => (
                                    <li key={idx} className="list-[lower-alpha]">
                                      {isEditing
                                        ? <input className="w-full bg-emerald-50 border border-emerald-200 rounded px-2 py-1 outline-none" value={req}
                                          onChange={e => { const n = [...tdrData.perfil.requisitos]; n[idx] = e.target.value; updateTdrField('perfil', { ...tdrData.perfil, requisitos: n }); }} />
                                        : req}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="font-bold mb-2 uppercase">4.2 Perfil del Contratista</p>
                                <ul className="pl-6 space-y-1.5">
                                  {tdrData?.perfil.formacion.map((form, idx) => (
                                    <li key={idx} className="list-[lower-alpha]">
                                      {isEditing
                                        ? <input className="w-full bg-emerald-50 border border-emerald-200 rounded px-2 py-1 outline-none" value={form}
                                          onChange={e => { const n = [...tdrData.perfil.formacion]; n[idx] = e.target.value; updateTdrField('perfil', { ...tdrData.perfil, formacion: n }); }} />
                                        : form}
                                    </li>
                                  ))}
                                  <li className="list-[lower-alpha]">
                                    {isEditing
                                      ? <input className="w-full bg-emerald-50 border border-emerald-200 rounded px-2 py-1 outline-none" value={tdrData?.perfil.experiencia ?? ''}
                                        onChange={e => updateTdrField('perfil', { ...tdrData!.perfil, experiencia: e.target.value })} />
                                      : tdrData?.perfil.experiencia}
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </section>

                          <section id="sec-v">
                            <h3 className="font-bold mb-3 uppercase" style={{ fontSize: '10pt' }}>V. Lugar y Plazo de Ejecución</h3>
                            <div className="space-y-2">
                              {[
                                { label: 'LUGAR', field: 'lugar' as keyof TDRData, value: tdrData?.lugar },
                                { label: 'PLAZO', field: 'plazo' as keyof TDRData, value: tdrData?.plazo },
                              ].map(row => (
                                <div key={row.field} className="flex items-start gap-2">
                                  <span className="font-bold flex-shrink-0">{row.label}:</span>
                                  {isEditing
                                    ? <input className="flex-1 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 outline-none" value={row.value ?? ''} onChange={e => updateTdrField(row.field, e.target.value)} />
                                    : <span>{row.value}</span>}
                                </div>
                              ))}
                            </div>
                          </section>

                          <section id="sec-vi">
                            <h3 className="font-bold mb-3 uppercase" style={{ fontSize: '10pt' }}>VI. Entregables</h3>
                            <table className="w-full border-collapse border border-black">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border border-black p-2 text-center" style={{ width: '52px' }}>N°</th>
                                  <th className="border border-black p-2 text-left">Entregable</th>
                                  <th className="border border-black p-2 text-center" style={{ width: '136px' }}>Plazo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tdrData?.entregables.map((ent, idx) => (
                                  <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                                    <td className="border border-black p-2 text-center">{ent.numero}</td>
                                    <td className="border border-black p-2">
                                      {isEditing
                                        ? <input className="w-full bg-emerald-50 border border-emerald-200 rounded px-2 py-1 outline-none" value={ent.descripcion}
                                          onChange={e => { const n = [...tdrData.entregables]; n[idx] = { ...n[idx], descripcion: e.target.value }; updateTdrField('entregables', n); }} />
                                        : ent.descripcion}
                                    </td>
                                    <td className="border border-black p-2 text-center">
                                      {isEditing
                                        ? <input className="w-full bg-emerald-50 border border-emerald-200 rounded px-2 py-1 outline-none text-center" value={ent.plazo}
                                          onChange={e => { const n = [...tdrData.entregables]; n[idx] = { ...n[idx], plazo: e.target.value }; updateTdrField('entregables', n); }} />
                                        : ent.plazo}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </section>

                          <section>
                            <h3 className="font-bold mb-2 uppercase" style={{ fontSize: '10pt' }}>VII. Conformidad</h3>
                            <p className="text-justify leading-relaxed">La conformidad será otorgada de acuerdo con el Artículo 144 del Reglamento de la Ley General de Contrataciones Públicas, por el/la Jefe/a de la Unidad correspondiente. El Área Usuaria deberá verificar el cumplimiento de cada actividad establecida en los términos de referencia.</p>
                          </section>

                          <section>
                            <h3 className="font-bold mb-2 uppercase" style={{ fontSize: '10pt' }}>VIII. Supervisión</h3>
                            <p className="text-justify leading-relaxed">La supervisión del servicio será realizada por el/la Jefe/a de la Unidad de Modernización.</p>
                          </section>

                          <section id="sec-ix">
                            <h3 className="font-bold mb-3 uppercase" style={{ fontSize: '10pt' }}>IX. Forma y Condiciones de Pago</h3>
                            <table className="w-full border-collapse border border-black">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border border-black p-2 text-left">Entregable</th>
                                  <th className="border border-black p-2 text-left">Condición</th>
                                  <th className="border border-black p-2 text-center" style={{ width: '100px' }}>% de Pago</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tdrData?.pagos.map((pago, idx) => (
                                  <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                                    <td className="border border-black p-2">{pago.entregable}</td>
                                    <td className="border border-black p-2">{pago.condicion}</td>
                                    <td className="border border-black p-2 text-center font-semibold">{pago.porcentaje}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </section>

                          {/* Clauses X–XXIV */}
                          {([
                            { id: 'sec-x', num: 'X', title: 'Confidencialidad', text: 'El contratista deberá mantener estricta confidencialidad sobre la información a la que tendrá acceso durante la ejecución del servicio. No podrá disponer de ésta para fines distintos al servicio. El proveedor podrá ser evaluado de acuerdo con los lineamientos de seguridad de la información de la SUNASS.' },
                            { id: '', num: 'XI', title: 'Responsabilidad del Proveedor', text: 'El proveedor es responsable por la calidad ofrecida y por los vicios ocultos del servicio ofertado por un plazo no menor de un (01) año, contado a partir del día siguiente de la conformidad otorgada por la Entidad.' },
                            { id: '', num: 'XII', title: 'Consideraciones Generales a los Productos', text: 'Los derechos intelectuales de los productos y documentos elaborados por el proveedor son propiedad de la Entidad, así como toda aquella información interna de la institución a la que tenga acceso para la ejecución del servicio.' },
                            { id: 'sec-xiii', num: 'XIII', title: 'Penalidades por Mora', text: null },
                            { id: '', num: 'XIV', title: 'Resolución Contractual', text: 'Cualquiera de las partes puede resolver el contrato, de conformidad con el numeral 68.1 al 68.5 del artículo 68 de la Ley N° 32069, Ley General de Contrataciones Públicas, y el artículo 122 del Reglamento aprobado por D.S. N° 009-2025-EF.' },
                            { id: '', num: 'XV', title: 'Sanciones', text: 'El proveedor se compromete a cumplir las obligaciones derivadas del contrato, siendo aplicable lo previsto según los artículos 87 al 92 de la Ley General de Contrataciones Públicas.' },
                            { id: '', num: 'XVI', title: 'Aplicación Supletoria', text: 'A la Ley de Contrataciones y su Reglamento – Ley N° 32069 también se considera el Código Civil vigente, teniendo en cuenta ese orden de prelación.' },
                            { id: '', num: 'XVII', title: 'Medidas de Seguridad en la Prestación del Servicio', text: 'No aplica.' },
                            { id: '', num: 'XVIII', title: 'Solución de Controversias', text: 'Todas las controversias se resuelven mediante conciliación, conforme al numeral 81.3 del artículo 81 de la Ley N° 32069 y el Art. 330 del Reglamento.' },
                            { id: 'sec-xix', num: 'XIX', title: 'Obligación Anticorrupción', text: 'EL CONTRATISTA declara y garantiza no haber ofrecido, negociado ni prometido ningún pago o incentivo ilegal a los evaluadores del proceso o cualquier servidor de la entidad. Se obliga a mantener una conducta proba e íntegra durante y después de la vigencia del contrato.' },
                            { id: '', num: 'XX', title: 'Cláusula Antisoborno', text: 'El contratista declara conocer la Política antisoborno de la SUNASS. Se compromete a actuar con integridad y a abstenerse de ofrecer beneficio alguno a funcionarios públicos. Se compromete a denunciar cualquier intento de soborno a través del canal de denuncias de la SUNASS.' },
                            { id: '', num: 'XXI', title: 'Cláusula Gestión de Riesgo', text: 'LAS PARTES realizan la gestión de riesgos de acuerdo con lo establecido en el presente contrato y sus documentos, con el fin de tomar decisiones informadas durante la ejecución contractual.' },
                            { id: '', num: 'XXII', title: 'Cláusula de Vicios Ocultos', text: 'El contratista es responsable por la calidad ofrecida y los vicios ocultos por un plazo no menor de un año contado a partir de la conformidad otorgada por la entidad. Art. 69.2 literal c).' },
                            { id: '', num: 'XXIII', title: 'Cláusula Modificación Contractual', text: 'Las partes pueden acordar modificaciones al contrato, siempre que permitan alcanzar su finalidad de manera oportuna y eficiente sin aumentar el monto ni desnaturalizar el requerimiento.' },
                            { id: '', num: 'XXIV', title: 'Garantías', text: 'No aplica.' },
                          ] as { id: string; num: string; title: string; text: string | null }[]).map(clause => (
                            <section key={clause.num} id={clause.id || undefined}>
                              <h3 className="font-bold mb-2 uppercase" style={{ fontSize: '10pt' }}>
                                {clause.num}. {clause.title}
                              </h3>
                              {clause.num === 'XIII' ? (
                                <>
                                  <p className="text-justify leading-relaxed mb-3">
                                    En caso de retraso injustificado, la entidad aplica automáticamente una penalidad por mora por cada día de atraso (Art. 120.1 del Reglamento):
                                  </p>
                                  <div className="my-3 text-center font-mono bg-gray-50 border border-black/10 rounded py-3 px-4" style={{ fontSize: '9.5pt' }}>
                                    Penalidad diaria = 0.10 &times; monto / (F &times; plazo)
                                  </div>
                                  <p>Donde F = 0.40 para bienes y servicios.</p>
                                </>
                              ) : (
                                <p className="text-justify leading-relaxed">{clause.text}</p>
                              )}
                            </section>
                          ))}

                        </div>{/* end space-y-7 */}
                      </div>{/* end doc div */}
                    </div>{/* end card */}
                  </div>{/* end col-9 */}

                </div>{/* end grid */}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-10 border-t border-black/[0.05] text-center">
        <p className="text-[10px] font-semibold text-black/25 uppercase tracking-widest">
          &copy; 2026 Generador de TDR &mdash; SUNASS &middot; Impulsado por Gemini AI
        </p>
      </footer>

    </div>
  );
}
