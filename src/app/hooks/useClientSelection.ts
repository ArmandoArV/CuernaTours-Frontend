import { useState, useCallback } from "react";
import { referenceService } from "@/services/api";
import { SearchableSelectOption } from "@/app/Components/SearchableSelectComponent/SearchableSelectComponent";

interface UseClientSelectionProps {
  onClientSelect: (data: any) => void;
  onError: (error: any) => void;
}

export function useClientSelection({
  onClientSelect,
  onError,
}: UseClientSelectionProps) {
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const handleClientSearch = useCallback(
    async (query: string): Promise<SearchableSelectOption[]> => {
      try {
        const results = await referenceService.searchClients(query);
        return results.map((client) => ({
          value: client.client_id.toString(),
          label: client.name,
          data: client,
        }));
      } catch (error) {
        console.error("Error searching clients:", error);
        return [];
      }
    },
    [],
  );

  const handleClientSelect = useCallback(
    async (clientId: string, option?: SearchableSelectOption) => {
      try {
        // Auto-fill contact information if available
        if (option?.data) {
          const clientDetails = await referenceService.getClientById(
            parseInt(clientId),
          );

          const primaryContact =
            clientDetails.primary_contact || clientDetails.contacts?.[0];

          let contactData = {};

          if (primaryContact) {
            contactData = {
              nombreContacto: primaryContact.name || "",
              primerApellido: primaryContact.first_lastname || "",
              segundoApellido: primaryContact.second_lastname || "",
              telefono: primaryContact.phone || "",
              correoElectronico: primaryContact.email || "",
              tieneWhatsapp: primaryContact.is_whatsapp_available ? "Si" : "No",
            };
          }

          onClientSelect({
            empresa: clientId,
            empresaNombre: clientDetails.name || option.label,
            empresaTipo: clientDetails.client_type_id?.toString() || "",
            ...contactData,
          });
        } else {
          onClientSelect({
            empresa: clientId,
            empresaNombre: option?.label || "",
            empresaTipo: "",
          });
        }
      } catch (error) {
        console.error("Error fetching client details:", error);
        // Fallback
        onClientSelect({
          empresa: clientId,
          empresaNombre: option?.label || "",
          empresaTipo: "",
        });
        onError(error);
      }
    },
    [onClientSelect, onError],
  );

  const handleCreateClient = useCallback(() => {
    setIsClientModalOpen(true);
  }, []);

  const handleClientCreated = useCallback(
    (clientId: number, clientName: string, contactData?: any) => {
      const contact = {
        nombreContacto: contactData?.name || "",
        primerApellido: contactData?.first_lastname || "",
        segundoApellido: contactData?.second_lastname || "",
        telefono: contactData?.phone || "",
        correoElectronico: contactData?.email || "",
        tieneWhatsapp: contactData?.is_whatsapp_available ? "Si" : "No",
      };

      onClientSelect({
        empresa: clientId.toString(),
        empresaNombre: clientName,
        ...contact,
      });
      setIsClientModalOpen(false);
    },
    [onClientSelect],
  );

  return {
    isClientModalOpen,
    setIsClientModalOpen,
    handleClientSearch,
    handleClientSelect,
    handleCreateClient,
    handleClientCreated,
  };
}
