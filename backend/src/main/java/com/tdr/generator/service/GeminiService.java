package com.tdr.generator.service;

import com.tdr.generator.dto.TDRRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent}")
    private String apiUrl;

    private final WebClient webClient;

    public GeminiService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    private final ObjectMapper mapper = new ObjectMapper();

    public String generateTDR(TDRRequest request) {
        String prompt = buildPrompt(request);

        String requestBody = """
                {
                  "contents": [{
                    "parts": [{
                      "text": %s
                    }]
                  }],
                  "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 8192,
                    "responseMimeType": "application/json"
                  }
                }
                """.formatted(escapeJson(prompt));

        String response = webClient.post()
                .uri(apiUrl + "?key=" + apiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return extractTextFromResponse(response);
    }

    private String buildPrompt(TDRRequest request) {
        StringBuilder sb = new StringBuilder();

        sb.append("Eres un experto en redacción de Términos de Referencia (TDR) para SUNASS (Superintendencia Nacional de Servicios de Saneamiento) del Perú. ");
        sb.append("Genera un TDR completo y formal en formato JSON con la siguiente estructura exacta:\\n\\n");

        sb.append("Área/Unidad Orgánica: ").append(request.getArea()).append("\\n");
        sb.append("Actividades del servicio: ").append(request.getActivities()).append("\\n");
        sb.append("Número de entregables: ").append(request.getNumEntregables()).append("\\n");

        if (request.getCvText() != null && !request.getCvText().isBlank()) {
            sb.append("\\nPerfil del consultor (basado en CV adjunto):\\n");
            // Limitar el CV a 2000 caracteres para no exceder límites
            String cv = request.getCvText();
            if (cv.length() > 2000) cv = cv.substring(0, 2000) + "...";
            sb.append(cv).append("\\n");
        }

        List<String> examples = request.getExamples();
        if (examples != null && !examples.isEmpty()) {
            sb.append("\\nEjemplos de TDRs anteriores para referencia de estilo y formato:\\n");
            for (int i = 0; i < Math.min(examples.size(), 2); i++) {
                String ex = examples.get(i);
                if (ex.length() > 1000) ex = ex.substring(0, 1000) + "...";
                sb.append("Ejemplo ").append(i + 1).append(": ").append(ex).append("\\n");
            }
        }

        sb.append("""
                
                Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta (sin texto adicional):
                {
                  "organo": "nombre del órgano/unidad orgánica",
                  "actividadPoi": "descripción de la actividad POI",
                  "denominacion": "denominación formal de la contratación",
                  "finalidadPublica": "texto de la finalidad pública",
                  "objetivo": "objetivo de la contratación",
                  "actividades": ["actividad 1", "actividad 2", ...],
                  "perfil": {
                    "requisitos": ["requisito 1", "requisito 2", ...],
                    "formacion": ["formación académica requerida", ...],
                    "experiencia": "descripción de experiencia requerida"
                  },
                  "lugar": "Lima, Perú - modalidad presencial/remota",
                  "plazo": "X días calendarios",
                  "entregables": [
                    {"numero": 1, "descripcion": "descripción del entregable", "plazo": "X días"},
                    ...
                  ],
                  "pagos": [
                    {"entregable": "Entregable 1", "condicion": "A la aprobación del entregable 1", "porcentaje": "XX%"},
                    ...
                  ]
                }
                """);

        return sb.toString();
    }

    private String escapeJson(String text) {
        return "\"" + text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t")
                + "\"";
    }

    private String extractTextFromResponse(String response) {
        try {
            if (response == null || response.isBlank()) {
                throw new RuntimeException("No se recibió respuesta de la API de Gemini");
            }

            JsonNode root = mapper.readTree(response);

            // candidates[0].content.parts[*].text
            JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
            if (!parts.isArray()) {
                throw new RuntimeException("Formato inesperado de Gemini: faltan candidates[0].content.parts");
            }

            StringBuilder sb = new StringBuilder();
            for (JsonNode p : parts) {
                String t = p.path("text").asText("");
                if (!t.isBlank()) sb.append(t);
            }

            String raw = sb.toString().trim();

            // Limpia fences ```json ``` si el modelo lo manda
            raw = raw.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

            // Recorta desde el primer { hasta el último }
            int start = raw.indexOf("{");
            int end = raw.lastIndexOf("}");
            if (start < 0 || end < 0 || end <= start) {
                throw new RuntimeException("Gemini no devolvió un JSON con llaves { }");
            }

            String jsonStr = raw.substring(start, end + 1);

            // ✅ valida que sea JSON real
            mapper.readTree(jsonStr);

            return jsonStr;
        } catch (Exception e) {
            throw new RuntimeException("No se pudo extraer JSON válido de Gemini: " + e.getMessage(), e);
        }
    }
}