import Swal, { SweetAlertIcon } from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

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
  confirmButtonColor: "#96781a",
  cancelButtonColor: "#ffffff",
  customClass: {
    confirmButton: "swal-confirm-button",
    cancelButton: "swal-cancel-button",
  },
};

export const showAlert = (options: AlertOptions) => {
  const { func, cancelFunc, ...swalOptions } = { ...defaultOptions, ...options };
  // Force a very high z-index and ensure it's not overridden
  swalOptions.customClass = {
    ...(swalOptions.customClass || {}),
    container: 'swal2-container-override'
  };
  
  Swal.fire(swalOptions).then((result: any) => {
    if (result.isConfirmed && func) {
      func();
    } else if (result.isDismissed && cancelFunc) {
      cancelFunc();
    }
  }).catch(error => {
    console.error("SweetAlert2 failed to fire:", error);
  });
};

export const showSuccessAlert = (
  title: string,
  text: string,
  func?: () => void
) => {
  Swal.fire({
    title,
    text,
    icon: "success",
    confirmButtonText: "OK",
    confirmButtonColor: "#96781a",
    timer: 2000,
    timerProgressBar: true,
    customClass: {
      confirmButton: "swal-confirm-button",
      container: 'swal2-container-override' // Inject override here too
    },
  }).then((result: any) => {
    if ((result.isConfirmed || result.isDismissed) && func) {
      func();
    }
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
