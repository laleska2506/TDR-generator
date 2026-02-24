package com.tdr.generator.service;

import com.tdr.generator.dto.TDRRequest;
import com.tdr.generator.model.TDRData;
import lombok.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public GeminiService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    public TDRData generateTDR(TDRRequest request) {
        String prompt = buildPrompt(request);

        // Construir el body para Gemini
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "temperature", 0.7,
                        "maxOutputTokens", 8192
                )
        );

        // Llamar a Gemini
        String response = webClient.post()
                .uri(apiUrl + "/models/gemini-1.5-pro:generateContent?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        // Extraer el texto del JSON de respuesta de Gemini
        // y deserializarlo a TDRData
        return parseGeminiResponse(response);
    }

    private String buildPrompt(TDRRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("Eres un experto en redacción de Términos de Referencia (TDR) para la Superintendencia Nacional de Servicios de Saneamiento (SUNASS) del Perú.\n\n");
        sb.append("Genera un TDR completo y profesional en formato JSON con la siguiente estructura exacta:\n\n");
        sb.append("{\n");
        sb.append("  \"organo\": \"string - Órgano o unidad orgánica que requiere el servicio\",\n");
        sb.append("  \"actividadPoi\": \"string - Actividad del POI\",\n");
        sb.append("  \"denominacion\": \"string - Denominación del servicio\",\n");
        sb.append("  \"finalidadPublica\": \"string - Finalidad pública del servicio\",\n");
        sb.append("  \"objetivo\": \"string - Objetivo general del servicio\",\n");
        sb.append("  \"actividades\": [\"string array - Lista de actividades a realizar\"],\n");
        sb.append("  \"perfil\": {\n");
        sb.append("    \"requisitos\": [\"string array - Requisitos mínimos\"],\n");
        sb.append("    \"formacion\": [\"string array - Formación académica requerida\"],\n");
        sb.append("    \"experiencia\": \"string - Experiencia laboral requerida\"\n");
        sb.append("  },\n");
        sb.append("  \"lugar\": \"string - Lugar de prestación del servicio\",\n");
        sb.append("  \"plazo\": \"string - Plazo de ejecución\",\n");
        sb.append("  \"entregables\": [\n");
        sb.append("    {\n");
        sb.append("      \"numero\": number,\n");
        sb.append("      \"descripcion\": \"string\",\n");
        sb.append("      \"plazo\": \"string\"\n");
        sb.append("    }\n");
        sb.append("  ],\n");
        sb.append("  \"pagos\": [\n");
        sb.append("    {\n");
        sb.append("      \"entregable\": \"string\",\n");
        sb.append("      \"condicion\": \"string\",\n");
        sb.append("      \"porcentaje\": \"string\"\n");
        sb.append("    }\n");
        sb.append("  ]\n");
        sb.append("}\n\n");

        sb.append("Datos del consultor (extraídos del CV):\n");
        sb.append(request.getCvText()).append("\n\n");

        sb.append("Área de trabajo: ").append(request.getArea()).append("\n");
        sb.append("Actividades requeridas: ").append(request.getActivities()).append("\n");
        sb.append("Número de entregables: ").append(request.getNumEntregables()).append("\n\n");

        if (request.getExamples() != null && !request.getExamples().isBlank()) {
            sb.append("Ejemplos de TDRs anteriores para referencia de estilo y formato:\n");
            sb.append(request.getExamples()).append("\n\n");
        }

        sb.append("IMPORTANTE: Responde ÚNICAMENTE con el JSON válido, sin texto adicional, sin bloques de código markdown, sin explicaciones. Solo el JSON puro.");

        return sb.toString();
    }

    private TDRData parseGeminiResponse(String response) {
        JsonNode root = objectMapper.readTree(response);
        String text = root.path("candidates")
                .get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text")
                .asText();

        // Remove Markdown code blocks if present
        text = text.trim();
        if (text.startsWith("```json")) {
            text = text.substring(7);
        } else if (text.startsWith("```")) {
            text = text.substring(3);
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length() - 3);
        }
        text = text.trim();

        return objectMapper.readValue(text, TDRData.class);
    }
}
