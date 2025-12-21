export type IButtonProps = {
  text?: string;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset" | "cancel";
  icon?: React.ReactNode;
}
