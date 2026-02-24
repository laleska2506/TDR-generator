package com.tdr.generator.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.List;

@Getter @Setter
@SpringBootApplication
public class TDRData {
		private String organo;
		private String actividadPoi;
		private String denominacion;
		private String finalidadPublica;
		private String objetivo;
		private List<String> actividades;
		private Perfil perfil;
		private String lugar;
		private String plazo;
		private List<Entregable> entregables;
		private List<Pago> pagos;

		@Getter @Setter
		public static class Perfil {
			private List<String> requisitos;
			private List<String> formacion;
			private String experiencia;
		}

		@Getter @Setter
		public static class Entregable {
			private int numero;
			private String descripcion;
			private String plazo;
		}

		@Getter @Setter
		public static class Pago {
			private String entregable;
			private String condicion;
			private String porcentaje;
		}
}
