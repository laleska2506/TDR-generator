package com.tdr.generator.service;

import com.fasterxml.jackson.databind.JsonNode;       // ✅ CORREGIDO: era tools.jackson (paquete inexistente)
import com.fasterxml.jackson.databind.ObjectMapper;   // ✅ CORREGIDO: era tools.jackson
import com.tdr.generator.dto.TDRRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    // ✅ Usando gemini-2.5-flash que está disponible en el plan gratuito
    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent}")
    private String apiUrl;

    private final WebClient webClient;

    // ✅ ObjectMapper es thread-safe, se instancia una sola vez
    private static final ObjectMapper mapper = new ObjectMapper();

    // ✅ Configuración de reintentos para error 429 (rate limit del plan gratuito)
    private static final int MAX_RETRIES = 5;
    private static final long RETRY_DELAY_MS = 15000; // 15 segundos base entre reintentos (el plan gratuito permite ~15 RPM)

    public GeminiService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
                .codecs(c -> c.defaultCodecs().maxInMemorySize(4 * 1024 * 1024)) // 4MB buffer
                .build();
    }

    public String generateTDR(TDRRequest request) {
        String prompt = buildPrompt(request);
        String requestBody = buildRequestBody(prompt);

        // ✅ Lógica de reintento para error 429 Too Many Requests (rate limit gratuito de Gemini)
        Exception lastException = null;
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            final int currentAttempt = attempt; // captura para uso en lambdas
            try {
                String response = webClient.post()
                        .uri(apiUrl + "?key=" + apiKey)
                        .header("Content-Type", "application/json; charset=utf-8")
                        .bodyValue(requestBody)
                        .retrieve()
                        .onStatus(
                                status -> status.value() == 429,
                                clientResponse -> clientResponse.bodyToMono(String.class)
                                        .map(body -> {
                                            System.out.println("[GeminiService] 429 response body: " + body);
                                            return new RuntimeException(
                                                "429 Too Many Requests - Límite de tasa de Gemini API alcanzado. " +
                                                        "Intento " + currentAttempt + " de " + MAX_RETRIES + ". " +
                                                        "Respuesta: " + body);
                                        })
                        )
                        .onStatus(
                                status -> status.is5xxServerError(),
                                clientResponse -> clientResponse.bodyToMono(String.class)
                                        .map(body -> new RuntimeException(
                                                "Error del servidor Gemini (" + clientResponse.statusCode() + "): " + body))
                        )
                        .bodyToMono(String.class)
                        .block(Duration.ofSeconds(60));

                return extractTextFromResponse(response);

            } catch (RuntimeException e) {
                lastException = e;
                String msg = e.getMessage() != null ? e.getMessage() : "";

                // Si es 429 y quedan reintentos, esperar y volver a intentar
                if (msg.contains("429") && attempt < MAX_RETRIES) {
                    try {
                        long waitMs = RETRY_DELAY_MS * attempt; // backoff exponencial simple
                        System.out.printf("[GeminiService] Rate limit alcanzado. Esperando %ds antes del reintento %d/%d...%n",
                                waitMs / 1000, attempt + 1, MAX_RETRIES);
                        Thread.sleep(waitMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Hilo interrumpido durante reintento", ie);
                    }
                    continue; // reintentar
                }

                // Cualquier otro error o último reintento: propagar
                throw new RuntimeException(buildUserFriendlyError(e), e);
            }
        }

        throw new RuntimeException("No se pudo obtener respuesta de Gemini tras " + MAX_RETRIES +
                " intentos. Causa: " + (lastException != null ? lastException.getMessage() : "desconocida"));
    }

    // ✅ CORREGIDO: el prompt se construye con saltos de línea Java reales,
    //    y se escapa correctamente al embeberse en el JSON del body
    private String buildPrompt(TDRRequest request) {
        StringBuilder sb = new StringBuilder();

        sb.append("Eres un experto en redacción de Términos de Referencia (TDR) para SUNASS ")
                .append("(Superintendencia Nacional de Servicios de Saneamiento) del Perú.\n\n")
                .append("ÁREA/UNIDAD ORGÁNICA: ").append(request.getArea()).append("\n")
                .append("ACTIVIDADES DEL SERVICIO: ").append(request.getActivities()).append("\n")
                .append("NÚMERO DE ENTREGABLES REQUERIDOS: ").append(request.getNumEntregables()).append("\n");

        if (request.getCvText() != null && !request.getCvText().isBlank()) {
            String cv = request.getCvText();
            if (cv.length() > 3000) cv = cv.substring(0, 3000) + "...";
            sb.append("\nPERFIL DEL CONSULTOR (extraído del CV adjunto):\n").append(cv).append("\n");
        }

        List<String> examples = request.getExamples();
        if (examples != null && !examples.isEmpty()) {
            sb.append("\nEJEMPLOS DE TDRs ANTERIORES (para referencia de estilo institucional):\n");
            for (int i = 0; i < Math.min(examples.size(), 2); i++) {
                String ex = examples.get(i);
                if (ex.length() > 1500) ex = ex.substring(0, 1500) + "...";
                sb.append("--- Ejemplo ").append(i + 1).append(" ---\n").append(ex).append("\n");
            }
        }

        sb.append("""

                INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con el objeto JSON a continuación.
                No incluyas texto antes ni después del JSON. No uses bloques ```json```. Solo el JSON puro.

                {
                  "organo": "Nombre del órgano/unidad orgánica de SUNASS",
                  "actividadPoi": "Descripción de la actividad del POI o Acción Estratégica PEI",
                  "denominacion": "Denominación formal y específica de la contratación",
                  "finalidadPublica": "Párrafo describiendo la finalidad pública del servicio",
                  "objetivo": "Objetivo claro y medible de la contratación",
                  "actividades": [
                    "Actividad detallada 1",
                    "Actividad detallada 2"
                  ],
                  "perfil": {
                    "requisitos": [
                      "Requisito legal o habilitante 1",
                      "Requisito legal o habilitante 2"
                    ],
                    "formacion": [
                      "Formación académica requerida",
                      "Especialización o certificación requerida"
                    ],
                    "experiencia": "Descripción de la experiencia mínima requerida en años y área"
                  },
                  "lugar": "Lima, Perú - modalidad presencial/remota según el servicio",
                  "plazo": "XX días calendarios",
                  "entregables": [
                    {"numero": 1, "descripcion": "Descripción detallada del entregable 1", "plazo": "XX días calendario desde el inicio"},
                    {"numero": 2, "descripcion": "Descripción detallada del entregable 2", "plazo": "XX días calendario desde la aprobación del Entregable 1"}
                  ],
                  "pagos": [
                    {"entregable": "Entregable 1", "condicion": "A la conformidad del Entregable 1 por parte del Área Usuaria", "porcentaje": "XX%"},
                    {"entregable": "Entregable 2", "condicion": "A la conformidad del Entregable 2 y conformidad final del servicio", "porcentaje": "XX%"}
                  ]
                }

                IMPORTANTE: El número de entregables y pagos debe ser exactamente """);
        sb.append(request.getNumEntregables()).append(".");

        return sb.toString();
    }

    // ✅ El JSON del body se construye con ObjectMapper para garantizar escape correcto
    private String buildRequestBody(String prompt) {
        try {
            // Construir el body como mapa para que Jackson lo serialice correctamente
            var partsNode = mapper.createArrayNode()
                    .add(mapper.createObjectNode().put("text", prompt));

            var contentNode = mapper.createObjectNode();
            contentNode.set("parts", partsNode);

            var contentsArray = mapper.createArrayNode().add(contentNode);

            var genConfig = mapper.createObjectNode();
            genConfig.put("temperature", 0.5);          // más determinístico
            genConfig.put("maxOutputTokens", 8192);
            genConfig.put("responseMimeType", "application/json");

            var root = mapper.createObjectNode();
            root.set("contents", contentsArray);
            root.set("generationConfig", genConfig);

            return mapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new RuntimeException("Error construyendo el body de la solicitud a Gemini", e);
        }
    }

    private String extractTextFromResponse(String response) {
        try {
            if (response == null || response.isBlank()) {
                throw new RuntimeException("No se recibió respuesta de la API de Gemini");
            }

            JsonNode root = mapper.readTree(response);

            // Revisar si Gemini devolvió un error estructurado
            if (root.has("error")) {
                String code    = root.path("error").path("code").asText("?");
                String message = root.path("error").path("message").asText("sin mensaje");
                throw new RuntimeException("Error de Gemini API [" + code + "]: " + message);
            }

            // Revisar finish reason — podría ser SAFETY, RECITATION, etc.
            JsonNode candidate = root.path("candidates").path(0);
            String finishReason = candidate.path("finishReason").asText("");
            if ("SAFETY".equals(finishReason) || "RECITATION".equals(finishReason)) {
                throw new RuntimeException("Gemini bloqueó la respuesta por política (" + finishReason + ")");
            }

            JsonNode parts = candidate.path("content").path("parts");
            if (!parts.isArray() || parts.isEmpty()) {
                throw new RuntimeException("Formato inesperado de Gemini: faltan candidates[0].content.parts. Respuesta: "
                        + response.substring(0, Math.min(500, response.length())));
            }

            StringBuilder sb = new StringBuilder();
            for (JsonNode p : parts) {
                String t = p.path("text").asText("");
                if (!t.isBlank()) sb.append(t);
            }

            String raw = sb.toString().trim();

            // Limpiar fences ```json ``` por si el modelo los incluyó
            raw = raw.replaceAll("(?s)```json\\s*", "").replaceAll("```", "").trim();

            // Recortar desde el primer { hasta el último }
            int start = raw.indexOf("{");
            int end   = raw.lastIndexOf("}");
            if (start < 0 || end < 0 || end <= start) {
                throw new RuntimeException("Gemini no devolvió JSON con llaves {}. Fragmento recibido: "
                        + raw.substring(0, Math.min(300, raw.length())));
            }

            String jsonStr = raw.substring(start, end + 1);

            // Validar que es JSON real antes de devolver
            mapper.readTree(jsonStr);

            return jsonStr;

        } catch (RuntimeException e) {
            throw e; // re-lanzar sin envolver
        } catch (Exception e) {
            throw new RuntimeException("No se pudo procesar la respuesta de Gemini: " + e.getMessage(), e);
        }
    }

    // ✅ Mensajes de error amigables según el tipo de fallo
    private String buildUserFriendlyError(Exception e) {
        String msg = e.getMessage() != null ? e.getMessage() : "error desconocido";

        if (msg.contains("429")) {
            return "Límite de solicitudes de Gemini API alcanzado (plan gratuito: ~15 req/min). " +
                    "Se realizaron " + MAX_RETRIES + " reintentos automáticos sin éxito. " +
                    "Espera 2 minutos e intenta nuevamente.";
        }
        if (msg.contains("401") || msg.contains("403")) {
            return "API Key de Gemini inválida o sin permisos. Verifica la variable gemini.api.key en application.properties.";
        }
        if (msg.contains("Connection refused") || msg.contains("timeout")) {
            return "No se pudo conectar con la API de Gemini. Verifica tu conexión a internet.";
        }
        return "Error al comunicarse con Gemini API: " + msg;
    }
}