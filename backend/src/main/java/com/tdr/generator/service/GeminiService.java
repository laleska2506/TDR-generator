package com.tdr.generator.service;

import com.tdr.generator.dto.TDRRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

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
        if (response == null) {
            throw new RuntimeException("No se recibió respuesta de la API de Gemini");
        }

        // Extraer el texto del campo candidates[0].content.parts[0].text
        int textStart = response.indexOf("\"text\":");
        if (textStart == -1) {
            throw new RuntimeException("Formato de respuesta inesperado: " + response.substring(0, Math.min(200, response.length())));
        }

        textStart += 8; // saltar '"text": '

        // Encontrar el inicio del contenido (después de la comilla de apertura)
        if (response.charAt(textStart) == '"') {
            textStart++;
        }

        int textEnd = response.lastIndexOf("\"");
        if (textEnd <= textStart) {
            throw new RuntimeException("No se pudo extraer el texto de la respuesta");
        }

        String extracted = response.substring(textStart, textEnd);

        // Decodificar secuencias de escape JSON
        extracted = extracted
                .replace("\\n", "\n")
                .replace("\\r", "\r")
                .replace("\\t", "\t")
                .replace("\\\"", "\"")
                .replace("\\\\", "\\");

        // Limpiar posibles backticks de markdown
        extracted = extracted.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

        return extracted;
    }
}