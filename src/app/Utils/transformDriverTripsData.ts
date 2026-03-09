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
        .filter((trip: any) => {
          // Driver is assigned at the unit level (source of truth)
          return (trip.units || []).some(
            (unit: any) => unit.driver_id === driverId || unit.driver?.id === driverId
          );
        })
        .map((trip: any) => {
          const contractStatusId =
            contract.contract_status_id || contract.status?.id;

          const contractStatus =
            TRIP_STATUS_MAP[contractStatusId] ||
            contract.contract_status_name ||
            contract.status?.name ||
            "";

          // Find the unit assigned to this driver
          const driverUnit = (trip.units || []).find(
            (unit: any) => unit.driver_id === driverId || unit.driver?.id === driverId
          );

          const vehicleDisplay =
            driverUnit?.vehicle?.license_plate ||
            driverUnit?.vehicle_license_plate ||
            "No asignada";

          return {
            trip_id: trip.trip_id,
            contract_id: contract.contract_id,

            "ID Viaje": trip.trip_id,
            Cliente: formatPersonName(contract.client_name) || "",
            Fecha: formatDateStandard(trip.service_date),
            Hora: trip.origin_time || trip.service_time || "",
            Origen: trip.origin?.name || trip.origin_name || "",
            Destino: trip.destination?.name || trip.destination_name || "",
            Unidad: vehicleDisplay,
            Estatus: contractStatus,

            _tripData: trip,
          };
        })
    )
    .sort(
      (a, b) =>
        new Date(a._tripData.service_date).getTime() -
        new Date(b._tripData.service_date).getTime()
    );
}
