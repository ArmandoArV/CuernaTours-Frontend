// utils/transformDriverTripsData.ts

import { formatDateStandard, formatPersonName } from "@/app/Utils/FormatUtil";
import { CONTRACT_STATUS_MAP } from "@/app/Utils/statusUtils";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("transformDriverTripsData");

export function transformDriverTripsData(
  apiResponse: any,
  driverId: number
): any[] {
  log.info("🔍 Raw API response:", apiResponse);
  
  // Handle new API response format: { driver_id, upcoming: [], historical: [], summary }
  let contracts: any[] = [];
  
  if (apiResponse?.upcoming !== undefined && apiResponse?.historical !== undefined) {
    // New format from /contracts/driver/:id endpoint (direct structure)
    const { upcoming = [], historical = [] } = apiResponse;
    contracts = [...upcoming, ...historical];
    log.info(`📦 Merged contracts: ${contracts.length} (${upcoming.length} upcoming + ${historical.length} historical)`);
  } else if (apiResponse?.data) {
    // Wrapped format: { data: { upcoming: [], historical: [] } }
    const { upcoming = [], historical = [] } = apiResponse.data;
    contracts = [...upcoming, ...historical];
    log.info(`📦 Wrapped format: ${contracts.length} contracts`);
  } else if (Array.isArray(apiResponse)) {
    // Old format (array of contracts)
    contracts = apiResponse;
    log.info(`📦 Array format: ${contracts.length} contracts`);
  } else {
    log.warn("⚠️ Unexpected response format, returning empty array");
    return [];
  }

  const transformed = contracts
    .flatMap((contract) => {
      const trips = contract.trips || [];
      log.info(`Contract ${contract.contract_id}: ${trips.length} trips`);
      
      return trips.map((trip: any) => {
        const contractStatusId = contract.contract_status?.contract_status_id || contract.contract_status_id;
        const contractStatusName = contract.contract_status?.name || "";
        const contractStatus = CONTRACT_STATUS_MAP[contractStatusId] || contractStatusName || "";

        // New format: single unit per trip for this driver
        const driverUnit = trip.unit;
        const vehicleDisplay = driverUnit?.vehicle?.license_plate || "No asignada";

        const transformed = {
          trip_id: trip.contract_trip_id,
          contract_id: contract.contract_id,

          "ID Viaje": trip.contract_trip_id,
          Cliente: formatPersonName(contract.client_name) || "",
          Fecha: formatDateStandard(trip.service_date),
          Hora: trip.origin_time || "",
          Origen: trip.origin?.name || "",
          Destino: trip.destination?.name || "",
          Unidad: vehicleDisplay,
          Estatus: contractStatus,

          _tripData: trip,
          _contractData: contract,
        };
        
        log.info(`✅ Transformed trip ${trip.contract_trip_id}:`, transformed);
        return transformed;
      });
    })
    .sort(
      (a, b) =>
        new Date(a._tripData.service_date).getTime() -
        new Date(b._tripData.service_date).getTime()
    );

  log.info(`✨ Final result: ${transformed.length} trips`);
  return transformed;
}
