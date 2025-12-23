export type InputTypes = {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: React.ReactNode | string;
  id?: string;
  name?: string;
  icon?: React.ReactNode;
  onIconClick?: () => void;
}