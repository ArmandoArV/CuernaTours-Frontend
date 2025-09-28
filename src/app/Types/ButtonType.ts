export type IButtonProps = {
  text: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset" | "cancel";
}
