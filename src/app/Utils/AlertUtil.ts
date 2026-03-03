import Swal, { SweetAlertIcon } from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("AlertUtil");

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
  (swalOptions as any).customClass = {
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
    log.error("SweetAlert2 failed to fire:", error);
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

export const showInputAlert = async (
  title: string,
  text: string,
  inputLabel: string,
  inputPlaceholder: string,
  confirmButtonText: string = "Confirmar",
  cancelButtonText: string = "Cancelar",
  confirmButtonColor: string = "#96781a",
  cancelButtonColor: string = "#ffffff"
): Promise<string | null> => {
  const result = await Swal.fire({
    title,
    text,
    input: "text",
    inputLabel,
    inputPlaceholder,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor,
    cancelButtonColor,
    customClass: {
      container: 'swal2-container-override',
      confirmButton: 'swal-confirm-button', // Re-use the global class for gold button
      cancelButton: 'swal-cancel-button'    // Re-use the global class for white/gold button
    },
    inputValidator: (value) => {
      if (!value) {
        return "¡Necesitas escribir una razón!";
      }
      return null;
    }
  });

  if (result.isConfirmed) {
    return result.value;
  }
  return null;
};
