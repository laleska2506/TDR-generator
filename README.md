# 🏛️ Generador de TDR Inteligente — SUNASS

Aplicación web para generar automáticamente **Términos de Referencia (TDR)** para contrataciones de la Superintendencia Nacional de Servicios de Saneamiento (SUNASS), utilizando inteligencia artificial (Google Gemini).

---

## 📐 Arquitectura

```
┌─────────────────────┐         ┌──────────────────────┐         ┌──────────────────┐
│  Frontend (React)   │  HTTP   │  Backend (Java/Spring) │  HTTP   │   Gemini API     │
│  Puerto 5173        │ ──────► │  Puerto 8080           │ ──────► │  Google AI       │
└─────────────────────┘         └──────────────────────┘         └──────────────────┘
```

**Por qué esta arquitectura:**
- 🔐 **Seguridad**: La API key de Gemini nunca se expone al navegador
- 🧩 **Separación de responsabilidades**: Frontend maneja UI, backend maneja lógica e integración
- 📈 **Escalabilidad**: El backend puede agregar caché, base de datos, autenticación, etc.

---

## 📁 Estructura del Proyecto

```
generador-de-tdr-inteligente/
├── backend/                          # Java Spring Boot
│   ├── src/main/java/com/tdr/generator/
│   │   ├── TDRGeneratorApplication.java   # Clase principal
│   │   ├── controller/
│   │   │   └── TDRController.java         # Endpoints REST
│   │   ├── dto/
│   │   │   └── TDRRequest.java            # Datos del formulario
│   │   ├── model/
│   │   │   └── TDRData.java               # Estructura del TDR
│   │   └── service/
│   │       └── GeminiService.java         # Integración con Gemini
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
│
├── frontend/                         # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── TDRForm.tsx                # Formulario de entrada
│   │   │   └── TDRPreview.tsx             # Visualización del TDR
│   │   ├── services/
│   │   │   └── tdrService.ts              # Llamadas al backend
│   │   ├── types/
│   │   │   └── tdr.ts                     # Interfaces TypeScript
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env                          # ⚠️ No subir a Git
│   ├── package.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md
```

---

## 🚀 Configuración e Instalación

### Prerrequisitos

- **Java 17+** — [Descargar](https://adoptium.net/)
- **Maven 3.8+** — incluido via `mvnw`
- **Node.js 18+** — [Descargar](https://nodejs.org/)
- **API Key de Google Gemini** — [Obtener gratis](https://aistudio.google.com/app/apikey)

---

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/generador-de-tdr-inteligente.git
cd generador-de-tdr-inteligente
```

### 2. Configurar el Backend

```bash
cd backend
```

Establece tu API key de Gemini como variable de entorno:

**Linux / macOS:**
```bash
export GEMINI_API_KEY="tu_api_key_aqui"
```

**Windows (PowerShell):**
```powershell
$env:GEMINI_API_KEY="tu_api_key_aqui"
```

Inicia el servidor:
```bash
./mvnw spring-boot:run
```

✅ El backend estará disponible en `http://localhost:8080`  
Verifica con: `curl http://localhost:8080/api/tdr/health`

---

### 3. Configurar el Frontend

```bash
cd ../frontend
```

Instala dependencias:
```bash
npm install
```

El archivo `.env` ya está configurado para conectar con el backend local. Si necesitas cambiarlo:
```
VITE_API_URL=http://localhost:8080
```

Inicia el servidor de desarrollo:
```bash
npm run dev
```

✅ La aplicación estará disponible en `http://localhost:5173`

---

## 💡 Uso

1. Abre `http://localhost:5173` en tu navegador
2. Completa el formulario:
   - **Área / Unidad Orgánica**: Departamento que solicita el servicio
   - **Actividades**: Descripción de lo que hará el consultor
   - **Número de entregables**: Cuántos productos se esperan (1-6)
   - **CV del consultor**: Pega el contenido del CV
   - **Ejemplos anteriores** (opcional): TDRs previos para mantener el estilo
3. Haz clic en **"Generar TDR"**
4. Revisa el TDR generado y usa los botones de copiar o imprimir

---

## 🌐 Endpoints del Backend

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/tdr/health` | Estado del servidor |
| POST | `/api/tdr/generate` | Genera un TDR |

**Ejemplo de request:**
```json
POST /api/tdr/generate
Content-Type: application/json

{
  "area": "Gerencia de Regulación Tarifaria",
  "activities": "Análisis de estructuras tarifarias de EPS...",
  "numEntregables": 3,
  "cvText": "Ingeniero civil con 5 años de experiencia...",
  "examples": "Texto de TDRs anteriores..."
}
```

---

## 🔒 Seguridad

- La `GEMINI_API_KEY` **nunca** debe subirse a Git (está en `.gitignore`)
- En producción, usa un gestor de secretos (AWS Secrets Manager, Azure Key Vault, etc.)
- El CORS está configurado para aceptar solo `localhost:5173` en desarrollo

---

## 📦 Build para Producción

**Frontend:**
```bash
cd frontend
npm run build
# Los archivos estáticos quedan en frontend/dist/
```

**Backend:**
```bash
cd backend
./mvnw package -DskipTests
java -jar target/tdr-generator-backend-1.0.0.jar
```

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|------|------------|
| Frontend | React 18, TypeScript, Vite |
| Backend | Java 17, Spring Boot 3, WebFlux |
| IA | Google Gemini 1.5 Pro |
| Build | Maven, npm |
