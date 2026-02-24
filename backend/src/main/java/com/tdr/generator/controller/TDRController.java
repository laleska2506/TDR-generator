package com.tdr.generator.controller;

import com.tdr.generator.dto.TDRRequest;
import com.tdr.generator.service.GeminiService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tdr")
@CrossOrigin(origins = "*")
public class TDRController {

    private final GeminiService geminiService;

    public TDRController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping(
            value = "/generate",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE  // ✅ Garantiza Content-Type correcto en éxito
    )
    public ResponseEntity<String> generateTDR(@RequestBody TDRRequest request) {
        // ✅ Validación básica antes de llamar a Gemini
        if (request.getArea() == null || request.getArea().isBlank()) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"El campo 'area' es obligatorio.\"}");
        }
        if (request.getActivities() == null || request.getActivities().isBlank()) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"El campo 'activities' es obligatorio.\"}");
        }
        if (request.getNumEntregables() < 1 || request.getNumEntregables() > 10) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"'numEntregables' debe estar entre 1 y 10.\"}");
        }

        try {
            String result = geminiService.generateTDR(request);
            // result ya es JSON puro validado por GeminiService
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(result);

        } catch (Exception e) {
            // ✅ Serializar mensaje de error como JSON válido escapando caracteres especiales
            String safeMessage = escapeJsonString(e.getMessage() != null
                    ? e.getMessage()
                    : "Error interno al generar el TDR.");
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"" + safeMessage + "\"}");
        }
    }

    /**
     * Escapa una cadena para incluirla de forma segura como valor JSON.
     * Evita inyección de JSON si el mensaje contiene comillas o barras.
     */
    private String escapeJsonString(String text) {
        if (text == null) return "";
        return text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}