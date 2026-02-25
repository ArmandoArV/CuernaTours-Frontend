import { useMemo } from "react";

export function useOrderValidation(formData: any, showErrors: boolean) {
  const getMissingRequiredFields = () => {
    const missing: Record<string, string> = {};

    const required = [
      "empresa",
      "nombreContacto",
      "primerApellido",
      "tieneWhatsapp",
      "costoViaje",
      "aplicaIva",
      "llevaComision",
      "tipoPago",
    ];

    required.forEach((field) => {
      if (!formData[field]) missing[field] = "Campo obligatorio";
    });

    if (formData.llevaComision === "Si") {
      if (!formData.tipoComision) missing.tipoComision = "Campo obligatorio";
    }

    return missing;
  };

  const requiredErrors = useMemo(
    () => (showErrors ? getMissingRequiredFields() : {}),
    [formData, showErrors],
  );

  const isValid = Object.keys(requiredErrors).length === 0;

  return {
    requiredErrors,
    isValid,
  };
}
