package com.tdr.generator.dto;

public class TDRRequest {

    private String area;
    private String activities;
    private int numEntregables;
    private String cvText;
    private java.util.List<String> examples;

    // Constructores
    public TDRRequest() {}

    public TDRRequest(String area, String activities, int numEntregables,
                      String cvText, java.util.List<String> examples) {
        this.area = area;
        this.activities = activities;
        this.numEntregables = numEntregables;
        this.cvText = cvText;
        this.examples = examples;
    }

    // Getters
    public String getArea() {
        return area;
    }

    public String getActivities() {
        return activities;
    }

    public int getNumEntregables() {
        return numEntregables;
    }

    public String getCvText() {
        return cvText;
    }

    public java.util.List<String> getExamples() {
        return examples;
    }

    // Setters
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

    public void setExamples(java.util.List<String> examples) {
        this.examples = examples;
    }

    @Override
    public String toString() {
        return "TDRRequest{" +
                "area='" + area + '\'' +
                ", activities='" + activities + '\'' +
                ", numEntregables=" + numEntregables +
                ", cvText='" + (cvText != null ? "[presente]" : "null") + '\'' +
                ", examples=" + (examples != null ? examples.size() + " ejemplos" : "null") +
                '}';
    }
}