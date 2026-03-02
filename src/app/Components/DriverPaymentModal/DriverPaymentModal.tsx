"use client";

import React, { useEffect, useState } from "react";
import DriverPaymentForm from "@/app/Components/forms/DriverPaymentForm";
import { useDriverPaymentForm } from "@/app/hooks/useDriverPaymentForm";
import { tripsService, usersService } from "@/services/api";
import { contractsService } from "@/services/api/contracts.service";
import { ContractTrip } from "@/app/backend_models/trip.model";
import { User } from "@/app/backend_models/user.model";
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from "@/app/Utils/AlertUtil";

interface DriverPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string | null;
}

const DriverPaymentModal: React.FC<DriverPaymentModalProps> = ({
  isOpen,
  onClose,
  tripId,
}) => {
  const [tripData, setTripData] = useState<ContractTrip | null>(null);
  const [driverData, setDriverData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialState = {
    cashReceived: true,
    cashAmount: "",
    driverPayment: "",
  };

  const { formState, handleInputChange, handleRadioChange, setFormState } =
    useDriverPaymentForm(initialState);

  useEffect(() => {
    if (isOpen && tripId) {
      setLoading(true);
      setError(null);
      
      tripsService
        .getById(Number(tripId))
        .then(async (data) => {
          setTripData(data);
          
          // Fetch driver details if driver_id exists
          if (data.driver_id) {
            try {
              const driver = await usersService.getById(data.driver_id);
              setDriverData(driver);
            } catch (err) {
              console.error("Error fetching driver:", err);
            }
          } else {
            setDriverData(null);
          }
          
          setFormState((prevState) => ({
            ...prevState,
            driverPayment: "",
          }));
        })
        .catch((err) => {
          console.error("Error fetching trip:", err);
          setError(err.message || "Failed to fetch trip details.");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setTripData(null);
      setDriverData(null);
      setFormState(initialState);
    }
  }, [isOpen, tripId, setFormState]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tripId) return;

    // Validate payment amount
    const paymentAmount = parseFloat(formState.driverPayment);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      showErrorAlert(
        "Error de validación",
        "Ingrese un monto de pago válido."
      );
      return;
    }

    // Validate cash amount if cash was received
    if (formState.cashReceived) {
      const cashAmount = parseFloat(formState.cashAmount);
      if (isNaN(cashAmount) || cashAmount <= 0) {
        showErrorAlert(
          "Error de validación",
          "Ingrese un monto de efectivo válido."
        );
        return;
      }
    }

    const paymentData = {
      tripId,
      amount: paymentAmount,
      cashReceived: formState.cashReceived,
      cashAmount: formState.cashReceived
        ? parseFloat(formState.cashAmount)
        : undefined,
    };

    showConfirmAlert(
      "Confirmar pago",
      `¿Está seguro de registrar el pago de $${paymentAmount} para ${driverData ? `${driverData.name} ${driverData.first_lastname || ''}`.trim() : 'este chofer'}?`,
      "Confirmar",
      async () => {
        try {
          setLoading(true);
          const contractId = (tripData as any).contract_id;
          if (!contractId) {
             throw new Error("Contract ID not found for this trip");
          }

          const driverId = (tripData as any).driver_id;
          const externalDriverId = (tripData as any).external_driver_id;
          
          if (!driverId && !externalDriverId) {
             throw new Error("No driver assigned to this trip");
          }

          await contractsService.payDrivers(contractId, {
            payments: [{
                driver_id: driverId || externalDriverId,
                driver_type: driverId ? 'internal' : 'external',
                amount: parseFloat(formState.driverPayment)
            }],
            payment_date: new Date().toISOString()
          });
          showSuccessAlert(
            "Pago registrado",
            "El pago del chofer se ha registrado exitosamente.",
            () => {
              onClose();
            }
          );
        } catch (error: any) {
          console.error("Payment failed:", error);
          showErrorAlert(
            "Error al registrar pago",
            error.message || "No se pudo registrar el pago del chofer."
          );
        } finally {
          setLoading(false);
        }
      }
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {loading && (
          <div className="text-center py-4">Cargando datos del viaje...</div>
        )}
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {!loading && tripData && (
          <DriverPaymentForm
            tripCost={5000} // TODO: Fetch from contract
            vouchers={0} // TODO: Fetch from contract
            driverExpenses={1000} // TODO: Calculate based on trip data
            driverName={
              driverData
                ? `${driverData.name} ${driverData.first_lastname || ''}`.trim()
                : (tripData as any).external_driver
                ? (tripData as any).external_driver.driver_name
                : "Sin asignar"
            }
            formState={formState}
            onRadioChange={handleRadioChange}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        )}
      </div>
    </div>
  );
};

export default DriverPaymentModal;
