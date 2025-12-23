"use client";

import React, { useEffect, useState } from "react";
import DriverPaymentForm from "@/app/Components/forms/DriverPaymentForm";
import { useDriverPaymentForm } from "@/app/hooks/useDriverPaymentForm";
import { tripsService, usersService } from "@/services/api";
import { paymentsService } from "@/services/api/payments.service";
import { ContractTrip } from "@/app/backend_models/trip.model";
import { User } from "@/app/backend_models/user.model";

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

    const paymentData = {
      tripId,
      amount: parseFloat(formState.driverPayment),
      cashReceived: formState.cashReceived,
      cashAmount: formState.cashReceived
        ? parseFloat(formState.cashAmount)
        : undefined,
    };

    try {
      await paymentsService.payDriver(paymentData);
      console.log("Payment successful");
      onClose();
    } catch (error: any) {
      console.error("Payment failed:", error);
      setError(error.message || "Payment failed.");
    }
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
