"use client";

import { useState } from "react";
import { Country } from "@/app/Types/Country";
import countriesData from "@/app/Data/countries.json";
import SelectComponent from "@/app/Components/SelectComponent/SelectComponent";

interface CountrySelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  className?: string;
}

export default function CountrySelect({
  value,
  onChange,
  disabled,
  className,
}: CountrySelectProps) {
  const countries: Country[] = countriesData;

  return (
    <SelectComponent
      label="Código"
      options={countries.map((country: Country) => ({
        value: country.value,
        label: `${country.flag} ${country.value}`, // Using emoji directly
      }))}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
    />
  );
}
