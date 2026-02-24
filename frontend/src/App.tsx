import React, { useState, useRef } from 'react';
import './App.css';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Upload,
  Send,
  Download,
  Edit3,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Plus,
  Trash2,
  FileDown,
  Files,
  X
} from 'lucide-react';
import { generateTDR, TDRData } from './services/tdrService';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function App() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [area, setArea] = useState('');
  const [activities, setActivities] = useState('');
  const [cvText, setCvText] = useState('');
  const [cvName, setCvName] = useState('');
  const [numEntregables, setNumEntregables] = useState(2);
  const [examples, setExamples] = useState<{ name: string, text: string }[]>([]);
  const [tdrData, setTdrData] = useState<TDRData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const tdrRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isExample: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (isExample && examples.length >= 5) {
        alert("Máximo 5 ejemplos permitidos");
        break;
      }

      const reader = new FileReader();

      const processText = (text: string) => {
        if (isExample) {
          setExamples(prev => [...prev, { name: file.name, text }]);
        } else {
          setCvName(file.name);
          setCvText(text);
        }
      };

      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = '';
          for (let j = 1; j <= pdf.numPages; j++) {
            const page = await pdf.getPage(j);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          }
          processText(fullText);
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          processText(event.target?.result as string);
        };
        reader.readAsText(file);
      }
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateTDR(activities, area, numEntregables, cvText, examples.map(e => e.text));
      setTdrData(data);
      setStep(2);
    } catch (error) {
      console.error('Error generating TDR:', error);
      alert('Hubo un error al generar el TDR. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const downloadWord = async () => {
    if (!tdrData) return;

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.SINGLE, size: 24, color: "E30613" },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    shading: { fill: "E30613" },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "SUNASS", color: "FFFFFF", bold: true, size: 20 })],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 85, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "  SUPERINTENDENCIA NACIONAL DE", size: 16, bold: true }),
                          new TextRun({ break: 1 }),
                          new TextRun({ text: "  SERVICIOS DE SANEAMIENTO", size: 24, bold: true, color: "E30613" }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [new TextRun({ text: "TÉRMINOS DE REFERENCIA PARA LA CONTRATACIÓN DE SERVICIOS Y CONSULTORÍAS", bold: true, size: 28 })],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Órgano y/o Unidad Orgánica:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(tdrData.organo)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Actividad del POI / Acción Estratégica PEI:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(tdrData.actividadPoi)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Denominación de la Contratación:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(tdrData.denominacion)] }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "I. FINALIDAD PÚBLICA", bold: true })] }),
          new Paragraph({ text: tdrData.finalidadPublica, alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "II. OBJETIVO DE LA CONTRATACIÓN", bold: true })] }),
          new Paragraph({ text: tdrData.objetivo, alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "III. ALCANCES Y DESCRIPCION DEL SERVICIO", bold: true })] }),
          ...tdrData.actividades.map(act => new Paragraph({ text: `• ${act}`, bullet: { level: 0 } })),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "IV. PERFIL DEL CONSULTOR", bold: true })] }),
          new Paragraph({ children: [new TextRun({ text: "REQUISITOS DEL CONTRATISTA", bold: true })] }),
          ...tdrData.perfil.requisitos.map(req => new Paragraph({ text: `- ${req}` })),
          new Paragraph({ children: [new TextRun({ text: "4.2 PERFIL DEL CONTRATISTA", bold: true })] }),
          ...tdrData.perfil.formacion.map(form => new Paragraph({ text: `- ${form}` })),
          new Paragraph({ text: `- ${tdrData.perfil.experiencia}` }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "V. LUGAR Y PLAZO DE EJECUCIÓN", bold: true })] }),
          new Paragraph({ text: `LUGAR: ${tdrData.lugar}` }),
          new Paragraph({ text: `PLAZO: ${tdrData.plazo}` }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "VI. ENTREGABLES", bold: true })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "N°", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Entregable", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Plazo", bold: true })] })] }),
                ],
              }),
              ...tdrData.entregables.map(ent => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(ent.numero.toString())] }),
                  new TableCell({ children: [new Paragraph(ent.descripcion)] }),
                  new TableCell({ children: [new Paragraph(ent.plazo)] }),
                ],
              })),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "IX. FORMA Y CONDICIONES DE PAGO", bold: true })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Entregable", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Condición", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "% de Pago", bold: true })] })] }),
                ],
              }),
              ...tdrData.pagos.map(pago => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(pago.entregable)] }),
                  new TableCell({ children: [new Paragraph(pago.condicion)] }),
                  new TableCell({ children: [new Paragraph(pago.porcentaje)] }),
                ],
              })),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "X. CONFIDENCIALIDAD", bold: true })] }),
          new Paragraph({ text: "El contratista deberá mantener estricta confidencialidad sobre la información a la que tendrá acceso durante la ejecución del servicio. Asimismo, no podrá disponer de ésta para fines distintos al servicio que presta. El contratista deberá de tener conocimiento de las “Disposiciones de seguridad de la información para proveedores” que serán comunicadas por la SUNASS si por la contratación el proveedor tiene acceso a algún activo de información de la SUNASS (sistemas de información, instalaciones de procesamiento, entre otros). El contratista deberá de enviar al correo electrónico del personal responsable de la contratación del servicio la declaración jurada de compromiso de confidencialidad de proveedores de la Sunass firmada. El proveedor podrá ser evaluado de acuerdo con los lineamientos de seguridad de la información.", alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "XI. RESPONSABILIDAD DEL PROVEEDOR", bold: true })] }),
          new Paragraph({ text: "El proveedor es responsable por la calidad ofrecida y por los vicios ocultos del servicio ofertado por un plazo no menor de un (01) año, contado a partir del día siguiente de la conformidad otorgada por la Entidad.", alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "XII. CONSIDERACIONES GENERALES A LOS PRODUCTOS", bold: true })] }),
          new Paragraph({ text: "Los derechos intelectuales de los productos y documentos elaborados por el proveedor que resulte seleccionado son propiedad de la Entidad, así como toda aquella información interna de la institución a la que tenga acceso para la ejecución del servicio.", alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "XIII. PENALIDADES POR MORA", bold: true })] }),
          new Paragraph({ text: "En caso de retraso injustificado del contratista en la ejecución de las prestaciones objeto del contrato, la entidad contratante le aplica automáticamente una penalidad por mora por cada día de atraso que le sea imputable. La penalidad se aplica automáticamente Art. 120.1 (Reglamento) y se calcula de acuerdo con la siguiente fórmula:", alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: "Penalidad diaria = 0.10 x monto / (F x plazo)", alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "Donde F tiene los siguientes valores: Para bienes y servicios: F = 0.40", alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "XIV. RESOLUCIÓN CONTRACTUAL", bold: true })] }),
          new Paragraph({ text: "Cualquiera de las partes puede resolver el contrato, de conformidad con el numeral 68.1 al 68.5 del artículo 68 de la Ley N° 32069, Ley General de Contrataciones Públicas. De encontrarse en alguno de los supuestos de resolución del contrato, LAS PARTES proceden de acuerdo con lo establecido en el artículo 122 del Reglamento de la Ley N° 32069, Ley General de Contrataciones Públicas, aprobado por Decreto Supremo N° 009-2025-EF. Asimismo, son causales de resolución de contrato la presentación con información inexacta o falsa de la Declaración Jurada de Prohibiciones e Incompatibilidades a que se hace referencia en la Ley de prevención y mitigación del conflicto de intereses en el acceso y salida de personal del servicio público Ley N° 31564, en caso se incumpla con los impedimentos señalados en el artículo 5 de dicha ley se aplicará la inhabilitación por cinco años para contratar o prestar servicios al Estado, bajo cualquier modalidad (De corresponder).", alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "XV. SANCIONES", bold: true })] }),
          new Paragraph({ text: "El proveedor se compromete a cumplir las obligaciones derivadas de la orden de compra, orden de servicio o el contrato, siendo aplicable lo previsto en la Ley según el artículo 87 al 92, así como del reglamento de la LEY GENERAL DE CONTRATACIONES PÚBLICAS", alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "XVI. APLICACIÓN SUPLETORIA", bold: true })] }),
          new Paragraph({ text: "A la aplicación de la Ley de Contrataciones y su Reglamento – Ley No. 32069, también se considera el Código Civil vigente, teniendo en cuenta ese orden de prelación, según corresponda, siempre que no se contradiga con las disposiciones establecidas en los términos de referencia.", alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "XVII. MEDIDAS DE SEGURIDAD EN LA PRESTACIÓN DEL SERVICIO", bold: true })] }),
          new Paragraph({ text: "No aplica.", alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "XVIII. SOLUCIÓN DE CONTROVERSIAS", bold: true })] }),
          new Paragraph({ text: "Todas las controversias que surjan entre las partes sobre la validez, nulidad, interpretación, ejecución, terminación o eficacia de los contratos menores se resuelven mediante conciliación, conforme lo dispuesto en el numeral 81.3 del artículo 81 de la Ley N° 32069 Ley General de Contrataciones Públicas y Art. 330 Reglamento.", alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "XIX. OBLIGACIÓN ANTICORRUPCIÓN", bold: true })] }),
          new Paragraph({ text: "A la suscripción de este contrato, EL CONTRATISTA declara y garantiza no haber ofrecido, negociado, prometido o efectuado ningún pago o entrega de cualquier beneficio o incentivo ilegal, de manera directa o indirecta, a los evaluadores del proceso de contratación o cualquier servidor de la entidad contratante. Asimismo, EL CONTRATISTA se obliga a mantener una conducta proba e íntegra durante la vigencia del contrato, y después de culminado el mismo en caso existan controversias pendientes de resolver, lo que supone actuar con probidad, sin cometer actos ilícitos, directa o indirectamente. Aunado a ello, EL CONTRATISTA se obliga a abstenerse de ofrecer, negociar, prometer o dar regalos, cortesías, invitaciones, donativos o cualquier beneficio o incentivo ilegal, directa o indirectamente, a funcionarios públicos, servidores públicos, locadores de servicios o proveedores de servicios del área usuaria, de la dependencia encargada de la contratación, actores del proceso de contratación y/o cualquier servidor de la entidad contratante, con la finalidad de obtener alguna ventaja indebida o beneficio ilícito. En esa línea, se obliga a adoptar las medidas técnicas, organizativas y/o de personal necesarias para asegurar que no se practiquen los actos previamente señalados. Adicionalmente, EL CONTRATISTA se compromete a denunciar oportunamente ante las autoridades competentes los actos de corrupción o de inconducta funcional de los cuales tuviera conocimiento durante la ejecución del contrato con LA ENTIDAD CONTRATANTE. Tratándose de una persona jurídica, lo anterior se extiende a sus accionistas, participacionistas, integrantes de los órganos de administración, apoderados, representantes legales, funcionarios, asesores o cualquier persona vinculada a la persona jurídica que representa; comprometiéndose a informarles sobre los alcances de las obligaciones asumidas en virtud del presente contrato. Finalmente, el incumplimiento de las obligaciones establecidas en esta cláusula, durante la ejecución contractual, otorga a LA ENTIDAD CONTRATANTE el derecho de resolver total o parcialmente el contrato.", alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "XX. CLÁUSULA ANTISOBORNO", bold: true })] }),
          new Paragraph({ text: "a. El contratista declara conocer los compromisos antisoborno de la SUNASS, el cual se establece en su Política antisoborno y se encuentra disponible en el portal web de la SUNASS. b. El contratista declara no haber, directa o indirectamente, ofrecido, negociado o efectuado pago o, en general, entregado beneficio o incentivo ilegal en relación al servicio a prestarse o bien a proporcionarse. En línea con ello, se compromete a actuar en todo momento con integridad, a abstenerse de ofrecer, dar o prometer, regalo u objeto alguno a cambio de cualquier beneficio, percibido de manera directa o indirecta; a cualquier miembro del Consejo Directivo, funcionarios públicos, empleados de confianza, servidores públicos; así como a terceros que tengan participación directa o indirecta en la determinación de las características técnicas y/o valor referencial o valor estimado, elaboración de documentos del procedimiento de selección, calificación y evaluación de oferta, y la conformidad de los contratos derivados de dicho procedimiento. c. El contratista se compromete a denunciar, sobre la base de una creencia razonable o de buena fe, cualquier intento de soborno, supuesto o real, que tuviera conocimiento a través del canal de denuncias de soborno ubicado en el portal web de la SUNASS.", alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "XXI. CLAUSULA GESTION DE RIESGO", bold: true })] }),
          new Paragraph({ text: "LAS PARTES realizan la gestión de riesgos de acuerdo con lo establecido en el presente contrato/orden de servicio u compra y los documentos que lo conforman, a fin de tomar decisiones informadas, aprovechando el impacto de riesgos positivos y disminuyendo la probabilidad de los riesgos negativos y su impacto durante la ejecución contractual, considerando la finalidad pública de la contratación.", alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "XXII. CLAUSULA DE VICIOS OCULTOS", bold: true })] }),
          new Paragraph({ text: "En los contratos de bienes y servicios, el contratista es responsable por la calidad ofrecida y por los vicios ocultos por un plazo no menor de un año contado a partir de la conformidad otorgada por la entidad contratante. El contrato puede establecer excepciones para bienes fungibles o perecibles, siempre que la naturaleza de estos no se adecue a este plazo, así se haya determinado en la estrategia de contratación. Arti.69.2 literal c).", alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "XXIII. CLAUSULA MODIFICACION CONTRACTUAL", bold: true })] }),
          new Paragraph({ text: "Las partes pueden acortar modificaciones al contrato menor, siempre que las mismas permitan alcanzar su finalidad de manera oportuna y eficiente y no aumenten el monto ni desnaturalicen el requerimiento. La modificación se perfecciona mediante un acta suscrita por ambas partes que se registra en la Pladicop, de corresponder.", alignment: AlignmentType.JUSTIFIED }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: "XXIV. GARANTÍAS", bold: true })] }),
          new Paragraph({ text: "No aplica.", alignment: AlignmentType.JUSTIFIED }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `TDR_${tdrData.denominacion.replace(/\s+/g, '_')}.docx`);
  };

  const updateTdrField = (field: keyof TDRData, value: any) => {
    if (!tdrData) return;
    setTdrData({ ...tdrData, [field]: value });
  };

  return (
      <div className="min-h-screen bg-[#F8F7F4] text-[#1A1A1A] font-sans selection:bg-emerald-100">
        {/* Background Decorative Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        </div>

        {/* Header */}
        <header className="border-b border-black/5 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <FileText className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight">TDR Generator <span className="text-emerald-600">AI</span></span>
            </div>
            {step === 2 && (
                <div className="flex items-center gap-3">
                  <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 hover:bg-black/5 transition-colors text-sm font-medium"
                  >
                    <Edit3 className="w-4 h-4" />
                    {isEditing ? 'Finalizar Edición' : 'Editar'}
                  </button>
                  <button
                      onClick={downloadWord}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"
                  >
                    <FileDown className="w-4 h-4" />
                    Descargar Word (.docx)
                  </button>
                </div>
            )}
          </div>
        </header>

        <main className="relative z-10 px-6 py-12 min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="w-full max-w-7xl">
          <AnimatePresence mode="wait">
            {step === 1 ? (
                <motion.div
                    key="step1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full"
                >
                  <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4 tracking-tight">Crea tus Términos de Referencia</h1>
                    <p className="text-black/50 text-lg max-w-2xl mx-auto">Describe lo que necesitas y nuestra IA redactará un documento formal siguiendo los estándares institucionales de SUNASS.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start justify-items-center">
                    {/* Left Column: Main Form */}
                    <div className="w-full max-w-[560px] space-y-6">
                      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-black/5 space-y-8">
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 pb-4 border-b border-black/5">
                            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h2 className="text-lg font-bold text-black/80">Información del Servicio</h2>
                              <p className="text-xs text-black/40 font-medium uppercase tracking-wider">Detalles principales de la contratación</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Área o Unidad Orgánica</label>
                              <input
                                  type="text"
                                  value={area}
                                  onChange={(e) => setArea(e.target.value)}
                                  placeholder="Ej: Unidad de Modernización"
                                  className="w-full px-5 py-4 rounded-2xl border border-black/10 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all bg-black/[0.02] font-medium"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Número de Entregables</label>
                              <div className="flex p-1.5 bg-black/[0.02] rounded-2xl border border-black/10">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => setNumEntregables(num)}
                                        className={`flex-1 py-2.5 rounded-xl transition-all text-sm font-bold ${numEntregables === num ? 'bg-white text-emerald-600 shadow-sm' : 'text-black/30 hover:text-black/60'}`}
                                    >
                                      {num}
                                    </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Actividades a realizar</label>
                            <textarea
                                value={activities}
                                onChange={(e) => setActivities(e.target.value)}
                                placeholder="Describe las tareas principales. Ej: Elaboración de diagnóstico situacional, propuesta de mejora de procesos..."
                                rows={6}
                                className="w-full px-5 py-4 rounded-2xl border border-black/10 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all resize-none bg-black/[0.02] font-medium leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Support Files */}
                    <div className="w-full max-w-[440px] space-y-6">
                      {/* CV Upload */}
                      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-black/5 space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Upload className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h2 className="text-base font-bold text-black/80">Perfil del Consultor</h2>
                            <p className="text-[10px] text-black/40 font-medium uppercase tracking-wider">Opcional: Sube un CV para guiar el perfil</p>
                          </div>
                        </div>

                        <div className="relative group">
                          <input
                              type="file"
                              onChange={(e) => handleFileUpload(e, false)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              accept=".pdf,.txt"
                          />
                          <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${cvName ? 'border-emerald-500 bg-emerald-50/50' : 'border-black/10 group-hover:border-blue-400 bg-black/[0.01]'}`}>
                            {cvName ? (
                                <div className="space-y-2">
                                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                  </div>
                                  <p className="font-bold text-sm text-emerald-800 truncate px-4">{cvName}</p>
                                  <p className="text-[10px] text-emerald-600/60 font-bold uppercase">Archivo cargado correctamente</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                  <Upload className="w-8 h-8 text-black/10 mx-auto mb-2" />
                                  <p className="text-sm font-bold text-black/60">Haz clic o arrastra un CV</p>
                                  <p className="text-[10px] text-black/30 font-medium uppercase tracking-widest">PDF o Texto plano</p>
                                </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Examples Upload */}
                      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-black/5 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                              <Files className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <h2 className="text-base font-bold text-black/80">TDRs de Referencia</h2>
                              <p className="text-[10px] text-black/40 font-medium uppercase tracking-wider">Máximo 5 ejemplos</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-black/20">{examples.length}/5</span>
                        </div>

                        <div className="space-y-4">
                          {examples.length > 0 && (
                              <div className="grid grid-cols-1 gap-2">
                                {examples.map((ex, idx) => (
                                    <div key={idx} className="flex items-center justify-between px-4 py-3 bg-black/[0.02] rounded-xl border border-black/5 group">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                        <FileText className="w-4 h-4 text-black/20 flex-shrink-0" />
                                        <span className="text-xs font-bold text-black/60 truncate">{ex.name}</span>
                                      </div>
                                      <button
                                          onClick={() => setExamples(prev => prev.filter((_, i) => i !== idx))}
                                          className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-black/20"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                ))}
                              </div>
                          )}

                          {examples.length < 5 && (
                              <div className="relative group">
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) => handleFileUpload(e, true)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    accept=".pdf,.txt"
                                />
                                <div className="border-2 border-dashed border-black/10 rounded-2xl py-6 text-center group-hover:border-amber-400 bg-black/[0.01] transition-all">
                                  <Plus className="w-5 h-5 text-black/20 mx-auto mb-1" />
                                  <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Añadir ejemplos</p>
                                </div>
                              </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !area || !activities}
                        className="group relative px-12 py-5 bg-emerald-600 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-emerald-600/30 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      {loading ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span>Generando Documento...</span>
                          </>
                      ) : (
                          <>
                            <span className="text-lg">Generar TDR Formal</span>
                            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                          </>
                      )}
                    </button>
                  </div>
                </motion.div>
            ) : (
                <motion.div
                    key="step2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <button
                        onClick={() => setStep(1)}
                        className="text-sm font-medium text-black/40 hover:text-black transition-colors flex items-center gap-1"
                    >
                      ← Volver a editar parámetros
                    </button>
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold uppercase tracking-widest">
                      <CheckCircle2 className="w-4 h-4" />
                      Documento Generado
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Sidebar: Navigation */}
                    <div className="lg:col-span-3 sticky top-24 space-y-4 hidden lg:block">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-4">Secciones del Documento</h4>
                        <nav className="space-y-1">
                          {[
                            { id: 'sec-i', label: 'I. Finalidad Pública' },
                            { id: 'sec-ii', label: 'II. Objetivo' },
                            { id: 'sec-iii', label: 'III. Alcances' },
                            { id: 'sec-iv', label: 'IV. Perfil' },
                            { id: 'sec-v', label: 'V. Lugar y Plazo' },
                            { id: 'sec-vi', label: 'VI. Entregables' },
                            { id: 'sec-ix', label: 'IX. Condiciones de Pago' },
                            { id: 'sec-x', label: 'X. Confidencialidad' },
                            { id: 'sec-xiii', label: 'XIII. Penalidades' },
                            { id: 'sec-xix', label: 'XIX. Anticorrupción' },
                          ].map((item) => (
                              <button
                                  key={item.id}
                                  onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                  className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-black/50 hover:bg-emerald-50 hover:text-emerald-700 transition-all border border-transparent hover:border-emerald-100"
                              >
                                {item.label}
                              </button>
                          ))}
                        </nav>
                      </div>
                    </div>

                    {/* Right Content: Document Preview */}
                    <div className="lg:col-span-9 space-y-8">
                      <div className="bg-white shadow-2xl rounded-sm overflow-hidden border border-black/5 overflow-x-auto">
                        <div
                            ref={tdrRef}
                            className="p-8 md:p-16 w-full max-w-[210mm] mx-auto bg-white text-[10pt] md:text-[11pt] leading-relaxed text-black"
                            style={{ fontFamily: 'Arial, sans-serif' }}
                        >
                          {/* Logo Placeholder */}
                          <div className="flex justify-between items-start mb-12 border-b-2 border-[#E30613] pb-4">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-[#E30613] flex items-center justify-center text-white font-black text-xs leading-none">
                                  SUNASS
                                </div>
                              </div>
                              <div className="flex flex-col leading-tight border-l border-black/20 pl-3">
                                <span className="text-[9px] text-black font-bold uppercase tracking-tighter">Superintendencia Nacional de</span>
                                <span className="text-xl font-black text-[#E30613] tracking-tighter">Servicios de Saneamiento</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] font-bold text-black/40 uppercase tracking-widest">Documento de Trabajo</p>
                              <p className="text-[8px] font-bold text-black/40 uppercase tracking-widest">Versión IA 1.0</p>
                            </div>
                          </div>

                          <h2 className="text-center font-bold text-lg mb-8 uppercase underline">
                            TÉRMINOS DE REFERENCIA PARA LA CONTRATACIÓN DE SERVICIOS Y CONSULTORÍAS
                          </h2>

                          {/* Header Table */}
                          <table className="w-full border-collapse border border-black mb-8">
                            <tbody>
                            <tr>
                              <td className="border border-black p-2 font-bold w-1/3 bg-gray-50">Órgano y/o Unidad Orgánica:</td>
                              <td className="border border-black p-2">
                                {isEditing ? (
                                    <input
                                        className="w-full bg-emerald-50 p-1 outline-none"
                                        value={tdrData?.organo}
                                        onChange={(e) => updateTdrField('organo', e.target.value)}
                                    />
                                ) : tdrData?.organo}
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-black p-2 font-bold bg-gray-50">Actividad del POI / Acción Estratégica PEI:</td>
                              <td className="border border-black p-2">
                                {isEditing ? (
                                    <input
                                        className="w-full bg-emerald-50 p-1 outline-none"
                                        value={tdrData?.actividadPoi}
                                        onChange={(e) => updateTdrField('actividadPoi', e.target.value)}
                                    />
                                ) : tdrData?.actividadPoi}
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-black p-2 font-bold bg-gray-50">Denominación de la Contratación:</td>
                              <td className="border border-black p-2">
                                {isEditing ? (
                                    <input
                                        className="w-full bg-emerald-50 p-1 outline-none"
                                        value={tdrData?.denominacion}
                                        onChange={(e) => updateTdrField('denominacion', e.target.value)}
                                    />
                                ) : tdrData?.denominacion}
                              </td>
                            </tr>
                            </tbody>
                          </table>

                          {/* Sections */}
                          <div className="space-y-8">
                            <section id="sec-i">
                              <h3 className="font-bold mb-2">I. FINALIDAD PÚBLICA</h3>
                              {isEditing ? (
                                  <textarea
                                      className="w-full bg-emerald-50 p-2 outline-none min-h-[100px]"
                                      value={tdrData?.finalidadPublica}
                                      onChange={(e) => updateTdrField('finalidadPublica', e.target.value)}
                                  />
                              ) : (
                                  <p className="text-justify">{tdrData?.finalidadPublica}</p>
                              )}
                            </section>

                            <section id="sec-ii">
                              <h3 className="font-bold mb-2">II. OBJETIVO DE LA CONTRATACIÓN</h3>
                              {isEditing ? (
                                  <textarea
                                      className="w-full bg-emerald-50 p-2 outline-none min-h-[80px]"
                                      value={tdrData?.objetivo}
                                      onChange={(e) => updateTdrField('objetivo', e.target.value)}
                                  />
                              ) : (
                                  <p className="text-justify">{tdrData?.objetivo}</p>
                              )}
                            </section>

                            <section id="sec-iii">
                              <h3 className="font-bold mb-2">III. ALCANCES Y DESCRIPCION DEL SERVICIO</h3>
                              <p className="mb-2">Para la ejecución del servicio, se desarrollarán las siguientes actividades:</p>
                              <ul className="list-disc pl-8 space-y-2">
                                {tdrData?.actividades.map((act, idx) => (
                                    <li key={idx}>
                                      {isEditing ? (
                                          <div className="flex gap-2">
                                            <input
                                                className="flex-1 bg-emerald-50 p-1 outline-none"
                                                value={act}
                                                onChange={(e) => {
                                                  const newActs = [...tdrData.actividades];
                                                  newActs[idx] = e.target.value;
                                                  updateTdrField('actividades', newActs);
                                                }}
                                            />
                                            <button onClick={() => {
                                              const newActs = tdrData.actividades.filter((_, i) => i !== idx);
                                              updateTdrField('actividades', newActs);
                                            }}><Trash2 className="w-4 h-4 text-red-500" /></button>
                                          </div>
                                      ) : act}
                                    </li>
                                ))}
                              </ul>
                              {isEditing && (
                                  <button
                                      onClick={() => updateTdrField('actividades', [...tdrData!.actividades, 'Nueva actividad'])}
                                      className="mt-2 text-xs text-emerald-600 flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" /> Añadir actividad
                                  </button>
                              )}
                            </section>

                            <section id="sec-iv">
                              <h3 className="font-bold mb-2">IV. PERFIL DEL CONSULTOR</h3>
                              <div className="space-y-4">
                                <div>
                                  <p className="font-bold underline mb-1 uppercase">4.1 Requisitos del contratista</p>
                                  <ul className="list-alpha pl-8 space-y-1">
                                    {tdrData?.perfil.requisitos.map((req, idx) => (
                                        <li key={idx} className="list-[lower-alpha]">
                                          {isEditing ? (
                                              <input
                                                  className="w-full bg-emerald-50 p-1 outline-none"
                                                  value={req}
                                                  onChange={(e) => {
                                                    const newReqs = [...tdrData.perfil.requisitos];
                                                    newReqs[idx] = e.target.value;
                                                    updateTdrField('perfil', { ...tdrData.perfil, requisitos: newReqs });
                                                  }}
                                              />
                                          ) : req}
                                        </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <p className="font-bold mb-1 uppercase">4.2 Perfil del contratista</p>
                                  <ul className="list-alpha pl-8 space-y-1">
                                    {tdrData?.perfil.formacion.map((form, idx) => (
                                        <li key={idx} className="list-[lower-alpha]">
                                          {isEditing ? (
                                              <input
                                                  className="w-full bg-emerald-50 p-1 outline-none"
                                                  value={form}
                                                  onChange={(e) => {
                                                    const newForm = [...tdrData.perfil.formacion];
                                                    newForm[idx] = e.target.value;
                                                    updateTdrField('perfil', { ...tdrData.perfil, formacion: newForm });
                                                  }}
                                              />
                                          ) : form}
                                        </li>
                                    ))}
                                    <li className="list-[lower-alpha]">
                                      {isEditing ? (
                                          <input
                                              className="w-full bg-emerald-50 p-1 outline-none"
                                              value={tdrData?.perfil.experiencia}
                                              onChange={(e) => updateTdrField('perfil', { ...tdrData!.perfil, experiencia: e.target.value })}
                                          />
                                      ) : tdrData?.perfil.experiencia}
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </section>

                            <section id="sec-v">
                              <h3 className="font-bold mb-2">V. LUGAR Y PLAZO DE EJECUCIÓN</h3>
                              <div className="space-y-2">
                                <p><span className="font-bold">LUGAR:</span> {isEditing ? <input className="bg-emerald-50 p-1 outline-none w-full" value={tdrData?.lugar} onChange={(e) => updateTdrField('lugar', e.target.value)} /> : tdrData?.lugar}</p>
                                <p><span className="font-bold">PLAZO:</span> {isEditing ? <input className="bg-emerald-50 p-1 outline-none w-full" value={tdrData?.plazo} onChange={(e) => updateTdrField('plazo', e.target.value)} /> : tdrData?.plazo}</p>
                              </div>
                            </section>

                            <section id="sec-vi">
                              <h3 className="font-bold mb-2">VI. ENTREGABLES</h3>
                              <table className="w-full border-collapse border border-black">
                                <thead className="bg-gray-50">
                                <tr>
                                  <th className="border border-black p-2 text-center w-20">N°</th>
                                  <th className="border border-black p-2 text-left">Entregable</th>
                                  <th className="border border-black p-2 text-center w-40">Plazo</th>
                                </tr>
                                </thead>
                                <tbody>
                                {tdrData?.entregables.map((ent, idx) => (
                                    <tr key={idx}>
                                      <td className="border border-black p-2 text-center">{ent.numero}</td>
                                      <td className="border border-black p-2">
                                        {isEditing ? (
                                            <input
                                                className="w-full bg-emerald-50 p-1 outline-none"
                                                value={ent.descripcion}
                                                onChange={(e) => {
                                                  const newEnts = [...tdrData.entregables];
                                                  newEnts[idx].descripcion = e.target.value;
                                                  updateTdrField('entregables', newEnts);
                                                }}
                                            />
                                        ) : ent.descripcion}
                                      </td>
                                      <td className="border border-black p-2 text-center">
                                        {isEditing ? (
                                            <input
                                                className="w-full bg-emerald-50 p-1 outline-none text-center"
                                                value={ent.plazo}
                                                onChange={(e) => {
                                                  const newEnts = [...tdrData.entregables];
                                                  newEnts[idx].plazo = e.target.value;
                                                  updateTdrField('entregables', newEnts);
                                                }}
                                            />
                                        ) : ent.plazo}
                                      </td>
                                    </tr>
                                ))}
                                </tbody>
                              </table>
                            </section>

                            <section>
                              <h3 className="font-bold mb-2">VII. CONFORMIDAD</h3>
                              <p className="text-justify">La conformidad será otorgada de acuerdo con el Artículo 144 del Reglamento de la Ley General de Contrataciones Públicas, por el/la Jefe/a de la Unidad de Modernización de la SUNASS, para que se otorgue la conformidad, el Área Usuaria deberá verificar el cumplimiento de cada una de las actividades establecidas en los términos de referencia por parte del Contratista, caso contrario no aceptará y observará al Contratista.</p>
                            </section>

                            <section>
                              <h3 className="font-bold mb-2">VIII. SUPERVISIÓN</h3>
                              <p className="text-justify">La supervisión del servicio será realizada por el/la Jefe/a de la Unidad de Modernización.</p>
                            </section>

                            <section id="sec-ix">
                              <h3 className="font-bold mb-2">IX. FORMA Y CONDICIONES DE PAGO</h3>
                              <table className="w-full border-collapse border border-black">
                                <thead className="bg-gray-50">
                                <tr>
                                  <th className="border border-black p-2 text-left">Entregable</th>
                                  <th className="border border-black p-2 text-left">Condición</th>
                                  <th className="border border-black p-2 text-center w-32">% de Pago</th>
                                </tr>
                                </thead>
                                <tbody>
                                {tdrData?.pagos.map((pago, idx) => (
                                    <tr key={idx}>
                                      <td className="border border-black p-2">{pago.entregable}</td>
                                      <td className="border border-black p-2">{pago.condicion}</td>
                                      <td className="border border-black p-2 text-center">{pago.porcentaje}</td>
                                    </tr>
                                ))}
                                </tbody>
                              </table>
                            </section>

                            {/* Fixed Sections X-XXIV */}
                            <section id="sec-x">
                              <h3 className="font-bold mb-2">X. CONFIDENCIALIDAD</h3>
                              <p className="text-justify">El contratista deberá mantener estricta confidencialidad sobre la información a la que tendrá acceso durante la ejecución del servicio. Asimismo, no podrá disponer de ésta para fines distintos al servicio que presta. El contratista deberá de tener conocimiento de las “Disposiciones de seguridad de la información para proveedores” que serán comunicadas por la SUNASS si por la contratación el proveedor tiene acceso a algún activo de información de la SUNASS (sistemas de información, instalaciones de procesamiento, entre otros). El contratista deberá de enviar al correo electrónico del personal responsable de la contratación del servicio la declaración jurada de compromiso de confidencialidad de proveedores de la Sunass firmada. El proveedor podrá ser evaluado de acuerdo con los lineamientos de seguridad de la información.</p>
                            </section>

                            <section>
                              <h3 className="font-bold mb-2">XI. RESPONSABILIDAD DEL PROVEEDOR</h3>
                              <p className="text-justify">El proveedor es responsable por la calidad ofrecida y por los vicios ocultos del servicio ofertado por un plazo no menor de un (01) año, contado a partir del día siguiente de la conformidad otorgada por la Entidad.</p>
                            </section>

                            <section>
                              <h3 className="font-bold mb-2">XII. CONSIDERACIONES GENERALES A LOS PRODUCTOS</h3>
                              <p className="text-justify">Los derechos intelectuales de los productos y documentos elaborados por el proveedor que resulte seleccionado son propiedad de la Entidad, así como toda aquella información interna de la institución a la que tenga acceso para la ejecución del servicio.</p>
                            </section>

                            <section id="sec-xiii">
                              <h3 className="font-bold mb-2">XIII. PENALIDADES POR MORA</h3>
                              <p className="text-justify">En caso de retraso injustificado del contratista en la ejecución de las prestaciones objeto del contrato, la entidad contratante le aplica automáticamente una penalidad por mora por cada día de atraso que le sea imputable. La penalidad se aplica automáticamente Art. 120.1 (Reglamento) y se calcula de acuerdo con la siguiente fórmula:</p>
                              <div className="my-4 text-center font-mono text-sm bg-gray-50 p-4 border border-black/10 rounded">
                                Penalidad diaria = 0.10 x monto / (F x plazo)
                              </div>
                              <p className="text-justify">Donde F tiene los siguientes valores: Para bienes y servicios: F = 0.40</p>
                            </section>

                            <section>
                              <h3 className="font-bold mb-2">XIV. RESOLUCIÓN CONTRACTUAL</h3>
                              <p className="text-justify">Cualquiera de las partes puede resolver el contrato, de conformidad con el numeral 68.1 al 68.5 del artículo 68 de la Ley N° 32069, Ley General de Contrataciones Públicas. De encontrarse en alguno de los supuestos de resolución del contrato, LAS PARTES proceden de acuerdo con lo establecido en el artículo 122 del Reglamento de la Ley N° 32069, Ley General de Contrataciones Públicas, aprobado por Decreto Supremo N° 009-2025-EF. Asimismo, son causales de resolución de contrato la presentación con información inexacta o falsa de la Declaración Jurada de Prohibiciones e Incompatibilidades a que se hace referencia en la Ley de prevención y mitigación del conflicto de intereses en el acceso y salida de personal del servicio público Ley N° 31564, en caso se incumpla con los impedimentos señalados en el artículo 5 de dicha ley se aplicará la inhabilitación por cinco años para contratar o prestar servicios al Estado, bajo cualquier modalidad (De corresponder).</p>
                            </section>

                            <section>
                              <h3 className="font-bold mb-2">XV. SANCIONES</h3>
                              <p className="text-justify">El proveedor se compromete a cumplir las obligaciones derivadas de la orden de compra, orden de servicio o el contrato, siendo aplicable lo previsto en la Ley según el artículo 87 al 92, así como del reglamento de la LEY GENERAL DE CONTRATACIONES PÚBLICAS</p>
                            </section>

                            <section>
                              <h3 className="font-bold mb-2">XVI. APLICACIÓN SUPLETORIA</h3>
                              <p className="text-justify">A la aplicación de la Ley de Contrataciones y su Reglamento – Ley No. 32069, también se considera el Código Civil vigente, teniendo en cuenta ese orden de prelación, según corresponda, siempre que no se contradiga con las disposiciones establecidas en los términos de referencia.</p>
                            </section>

                            <section>
                              <h3 className="font-bold mb-2">XVII. MEDIDAS DE SEGURIDAD EN LA PRESTACIÓN DEL SERVICIO</h3>
                              <p className="text-justify">No aplica.</p>
                            </section>

                            <section>
                              <h3 className="font-bold mb-2">XVIII. SOLUCIÓN DE CONTROVERSIAS</h3>
                              <p className="text-justify">Todas las controversias que surjan entre las partes sobre la validez, nulidad, interpretación, ejecución, terminación o eficacia de los contratos menores se resuelven mediante conciliación, conforme lo dispuesto en el numeral 81.3 del artículo 81 de la Ley N° 32069 Ley General de Contrataciones Públicas y Art. 330 Reglamento.</p>
                            </section>

                            <section id="sec-xix">
                              <h3 className="font-bold mb-2">XIX. OBLIGACIÓN ANTICORRUPCIÓN</h3>
                              <p className="text-justify">A la suscripción de este contrato, EL CONTRATISTA declara y garantiza no haber ofrecido, negociado, prometido o efectuado ningún pago o entrega de cualquier beneficio o incentivo ilegal, de manera directa o indirecta, a los evaluadores del proceso de contratación o cualquier servidor de la entidad contratante. Asimismo, EL CONTRATISTA se obliga a mantener una conducta proba e íntegra durante la vigencia del contrato, y después de culminado el mismo en caso existan controversias pendientes de resolver, lo que supone actuar con probidad, sin cometer actos ilícitos, directa o indirectamente. Aunado a ello, EL CONTRATISTA se obliga a abstenerse de ofrecer, negociar, prometer o dar regalos, cortesías, invitaciones, donativos o cualquier beneficio o incentivo ilegal, directa o indirectamente, a funcionarios públicos, servidores públicos, locadores de servicios o proveedores de servicios del área usuaria, de la dependencia encargada de la contratación, actores del proceso de contratación y/o cualquier servidor de la entidad contratante, con la finalidad de obtener alguna ventaja indebida o beneficio ilícito. En esa línea, se obliga a adoptar las medidas técnicas, organizativas y/o de personal necesarias para asegurar que no se practiquen los actos previamente señalados. Adicionalmente, EL CONTRATISTA se compromete a denunciar oportunamente ante las autoridades competentes los actos de corrupción o de inconducta funcional de los cuales tuviera conocimiento durante la ejecución del contrato con LA ENTIDAD CONTRATANTE. Tratándose de una persona jurídica, lo anterior se extiende a sus accionistas, participacionistas, integrantes de los órganos de administración, apoderados, representantes legales, funcionarios, asesores o cualquier persona vinculada a la persona jurídica que representa; comprometiéndose a informarles sobre los alcances de las obligaciones asumidas en virtud del presente contrato. Finalmente, el incumplimiento de las obligaciones establecidas en esta cláusula, durante la ejecución contractual, otorga a LA ENTIDAD CONTRATANTE el derecho de resolver total o parcialmente el contrato.</p>
                            </section>

                            <section>
                              <h3 className="font-bold mb-2">XX. CLÁUSULA ANTISOBORNO</h3>
                              <p className="text-justify">a. El contratista declara conocer los compromisos antisoborno de la SUNASS, el cual se establece en su Política antisoborno y se encuentra disponible en el portal web de la SUNASS. b. El contratista declara no haber, directa o indirectamente, ofrecido, negociado o efectuado pago o, en general, entregado beneficio o incentivo ilegal en relación al servicio a prestarse o bien a proporcionarse. En línea con ello, se compromete a actuar en todo momento con integridad, a abstenerse de ofrecer, dar o prometer, regalo u objeto alguno a cambio de cualquier beneficio, percibido de manera directa o indirecta; a cualquier miembro del Consejo Directivo, funcionarios públicos, empleados de confianza, servidores públicos; así como a terceros que tengan participación directa o indirecta en la determinación de las características técnicas y/o valor referencial o valor estimado, elaboración de documentos del procedimiento de selección, calificación y evaluación de oferta, y la conformidad de los contratos derivados de dicho procedimiento. c. El contratista se compromete a denunciar, sobre la base de una creencia razonable o de buena fe, cualquier intento de soborno, supuesto o real, que tuviera conocimiento a través del canal de denuncias de soborno ubicado en el portal web de la SUNASS.</p>
                            </section>

                            <section>
                              <h3 className="font-bold mb-2">XXI. CLAUSULA GESTION DE RIESGO</h3>
                              <p className="text-justify">LAS PARTES realizan la gestión de riesgos de acuerdo con lo establecido en el presente contrato/orden de servicio u compra y los documentos que lo conforman, a fin de tomar decisiones informadas, aprovechando el impacto de riesgos positivos y disminuyendo la probabilidad de los riesgos negativos y su impacto durante la ejecución contractual, considerando la finalidad pública de la contratación.</p>
                            </section>

                            <section>
                              <h3 className="font-bold mb-2">XXII. CLAUSULA DE VICIOS OCULTOS</h3>
                              <p className="text-justify">En los contratos de bienes y servicios, el contratista es responsable por la calidad ofrecida y por los vicios ocultos por un plazo no menor de un año contado a partir de la conformidad otorgada por la entidad contratante. El contrato puede establecer excepciones para bienes fungibles o perecibles, siempre que la naturaleza de estos no se adecue a este plazo, así se haya determinado en la estrategia de contratación. Arti.69.2 literal c).</p>
                            </section>

                            <section>
                              <h3 className="font-bold mb-2">XXIII. CLAUSULA MODIFICACION CONTRACTUAL</h3>
                              <p className="text-justify">Las partes pueden acortar modificaciones al contrato menor, siempre que las mismas permitan alcanzar su finalidad de manera oportuna y eficiente y no aumenten el monto ni desnaturalicen el requerimiento. La modificación se perfecciona mediante un acta suscrita por ambas partes que se registra en la Pladicop, de corresponder.</p>
                            </section>

                            <section>
                              <h3 className="font-bold mb-2">XXIV. GARANTÍAS</h3>
                              <p className="text-justify">No aplica.</p>
                            </section>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
            )}
          </AnimatePresence>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-12 border-t border-black/5 text-center text-black/40 text-sm">
          <p>© 2024 Generador de TDR Inteligente. Desarrollado con Gemini AI.</p>
        </footer>
      </div>
  );
}