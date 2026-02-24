package com.tdr.generator.controller;

import com.tdr.generator.dto.TDRRequest;
import com.tdr.generator.model.TDRData;
import com.tdr.generator.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tdr")
@CrossOrigin(origins = "http://localhost:5173","http://localhost:3000") // permite llamadas desde React
public class TDRController {

    private final GeminiService geminiService;

    public TDRController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/generate")
    public ResponseEntity<TDRData> generate(@RequestBody TDRRequest request) {
        TDRData result = geminiService.generateTDR(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("TDR Generator API is running");
    }
}
