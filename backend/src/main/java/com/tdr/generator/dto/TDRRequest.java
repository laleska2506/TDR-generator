package com.tdr.generator.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"cvText", "examples"}) // ocultar campos grandes en logs
public class TDRRequest {
    private String area;
    private String activities;
    private int numEntregables;
    private String cvText;
    private List<String> examples;
}