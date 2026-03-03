// utils/transformDriverTripsData.ts

import { formatDateStandard, formatPersonName } from "@/app/Utils/FormatUtil";
import { TRIP_STATUS_MAP } from "@/app/Utils/statusUtils";

export function transformDriverTripsData(
  apiData: any[],
  driverId: number
): any[] {
  return apiData
    .flatMap((contract) =>
      (contract.trips || [])
        .filter(
          (trip: any) =>
            (trip.driver?.id || trip.driver_id) === driverId
        )
        .map((trip: any) => {
          const contractStatusId =
            contract.contract_status_id || contract.status?.id;

          const contractStatus =
            TRIP_STATUS_MAP[contractStatusId] ||
            contract.contract_status_name ||
            contract.status?.name ||
            "";

          return {
            trip_id: trip.trip_id,
            contract_id: contract.contract_id,

            "ID Viaje": trip.trip_id,
            Cliente: formatPersonName(contract.client_name) || "",
            Fecha: formatDateStandard(trip.service_date),
            Hora: trip.service_time || "",
            Origen: trip.origin?.name || trip.origin_name || "",
            Destino: trip.destination?.name || trip.destination_name || "",
            Unidad:
              trip.vehicle?.plates ||
              trip.vehicle_plates ||
              "No asignada",
            Estatus: contractStatus,

            _tripData: trip, // keep for sorting
          };
        })
    )
    .sort(
      (a, b) =>
        new Date(a._tripData.service_date).getTime() -
        new Date(b._tripData.service_date).getTime()
    );
}
