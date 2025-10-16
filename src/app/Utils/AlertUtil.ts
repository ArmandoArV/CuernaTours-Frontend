import Swal, { SweetAlertIcon } from "sweetalert2";

export type AlertOptions = {
  title: string;
  text: string;
  icon?: SweetAlertIcon;
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
  func?: () => void;
  cancelFunc?: () => void;
};
const defaultOptions = {
  icon: "info" as SweetAlertIcon,
  confirmButtonText: "OK",
};

export const showAlert = (options: AlertOptions) => {
  const mergedOptions = { ...defaultOptions, ...options };
  Swal.fire(mergedOptions).then((result: any) => {
    if (result.isConfirmed && options.func) {
      options.func();
    } else if (result.isDismissed && options.cancelFunc) {
      options.cancelFunc();
    }
  });
};

export const showSuccessAlert = (
  title: string,
  text: string,
  func?: () => void
) => {
  showAlert({
    title,
    text,
    icon: "success",
    confirmButtonText: "OK",
    func,
  });
};

export const showErrorAlert = (
  title: string,
  text: string,
  func?: () => void
) => {
  showAlert({
    title,
    text,
    icon: "error",
    confirmButtonText: "OK",
    func,
  });
};

export const showInfoAlert = (
  title: string,
  text: string,
  func?: () => void
) => {
  showAlert({
    title,
    text,
    icon: "info",
    confirmButtonText: "OK",
    func,
  });
};

export const showWarningAlert = (
  title: string,
  text: string,
  func?: () => void
) => {
  showAlert({
    title,
    text,
    icon: "warning",
    confirmButtonText: "OK",
    func,
  });
};

export const showConfirmAlert = (
  title: string,
  text: string,
  confirmButtonText: string,
  func: () => void,
  cancelFunc?: () => void
) => {
  showAlert({
    title,
    text,
    icon: "warning",
    confirmButtonText,
    showCancelButton: true,
    cancelButtonText: "Cancel",
    func,
    cancelFunc,
  });
};

export const showCustomAlert = (options: AlertOptions) => {
  showAlert(options);
};
