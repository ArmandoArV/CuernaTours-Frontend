export type SelectOption = {
  value: string;
  label: string;
};

export type SelectTypes = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  id?: string;
  required?: boolean;
};