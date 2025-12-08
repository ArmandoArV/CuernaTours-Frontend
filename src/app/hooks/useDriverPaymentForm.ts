'use client';

import { useState } from 'react';

export interface DriverPaymentFormState {
  cashReceived: boolean;
  cashAmount: string;
  driverPayment: string;
}

export const useDriverPaymentForm = (initialState: DriverPaymentFormState) => {
  const [formState, setFormState] = useState<DriverPaymentFormState>(initialState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRadioChange = (value: boolean) => {
    setFormState(prevState => ({
      ...prevState,
      cashReceived: value,
    }));
  };

  return {
    formState,
    setFormState,
    handleInputChange,
    handleRadioChange,
  };
};
