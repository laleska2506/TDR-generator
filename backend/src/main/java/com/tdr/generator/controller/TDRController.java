package com.tdr.generator.controller;

import com.tdr.generator.dto.TDRRequest;
import com.tdr.generator.service.GeminiService;
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

    @PostMapping("/generate")
    public ResponseEntity<String> generateTDR(@RequestBody TDRRequest request) {
        try {
            String result = geminiService.generateTDR(request);
            return ResponseEntity.ok()
                    .header("Content-Type", "application/json; charset=utf-8")
                    .body(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .header("Content-Type", "application/json; charset=utf-8")
                    .body("{\"error\":\"" + e.getMessage().replace("\"","'") + "\"}");
        }
    }
}