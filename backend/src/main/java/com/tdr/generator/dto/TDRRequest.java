package com.tdr.generator.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter @Setter
public class TDRRequest {
    private String area;
    private String activities;
    private int numEntregables;
    private String cvText;           // texto extraído del PDF
    private List<String> examples;   // textos de TDRs de ejemplo

    public void setArea(String area) {
        this.area = area;
    }

    public void setActivities(String activities) {
        this.activities = activities;
    }

    public void setNumEntregables(int numEntregables) {
        this.numEntregables = numEntregables;
    }

    public void setCvText(String cvText) {
        this.cvText = cvText;
    }

    public void setExamples(List<String> examples) {
        this.examples = examples;
    }
}