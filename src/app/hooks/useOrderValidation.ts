import { useMemo, useCallback } from "react";

export function useOrderValidation(formData: any, showErrors: boolean) {
  const getMissingRequiredFields = useCallback(() => {
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
      if (!formData.nombreRecibeComision)
        missing.nombreRecibeComision = "Campo obligatorio";
    }

    return missing;
  }, [formData]);

  const requiredErrors = useMemo(
    () => (showErrors ? getMissingRequiredFields() : {}),
    [formData, showErrors, getMissingRequiredFields],
  );

  const isValid = Object.keys(requiredErrors).length === 0;

  return {
    requiredErrors,
    isValid,
    getMissingRequiredFields,
  };
}
