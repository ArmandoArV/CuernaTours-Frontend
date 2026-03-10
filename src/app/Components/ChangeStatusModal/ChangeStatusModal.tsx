"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  Radio,
  makeStyles,
} from "@fluentui/react-components";
import { getStatusColor, getStatusTextColor } from "@/app/Utils/statusUtils";

export const STATUS_OPTIONS = [
  { value: "2", label: "Por asignar" },
  { value: "3", label: "Próximo" },
  { value: "4", label: "En curso" },
  { value: "5", label: "Por pagar" },
  { value: "6", label: "Finalizado" },
];

const STATUS_LABEL_TO_VALUE: Record<string, string> = {
  "Por asignar": "2",
  "Próximo": "3",
  "En curso": "4",
  "Por pagar": "5",
  "Finalizado": "6",
};

const useStyles = makeStyles({
  radioItem: {
    padding: "6px 0",
  },
  badge: {
    display: "inline-block",
    padding: "4px 16px",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "600",
    minWidth: "110px",
    textAlign: "center",
    marginLeft: "8px",
    cursor: "pointer",
  },
  content: {
    paddingTop: "12px",
    paddingBottom: "4px",
  },
});

interface ChangeStatusModalProps {
  open: boolean;
  currentStatus?: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
}

export default function ChangeStatusModal({
  open,
  currentStatus,
  onClose,
  onConfirm,
}: ChangeStatusModalProps) {
  const styles = useStyles();

  const labelToValue = (label?: string) =>
    (label && STATUS_LABEL_TO_VALUE[label]) || "";

  const [selected, setSelected] = useState(() => labelToValue(currentStatus));

  useEffect(() => {
    if (open) setSelected(labelToValue(currentStatus));
  }, [open, currentStatus]);

  return (
    <Dialog open={open} onOpenChange={(_, data) => { if (!data.open) onClose(); }}>
      <DialogSurface className="modal-enter">
        <DialogBody>
          <DialogTitle>Cambiar estatus del contrato</DialogTitle>

          <DialogContent className={styles.content}>
            <RadioGroup
              value={selected}
              onChange={(_, data) => setSelected(data.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <div key={opt.value} className={styles.radioItem}>
                  <Radio
                    value={opt.value}
                    label={
                      <span
                        className={styles.badge}
                        style={{
                          backgroundColor: getStatusColor(opt.label),
                          color: getStatusTextColor(opt.label),
                        }}
                      >
                        {opt.label}
                      </span>
                    }
                  />
                </div>
              ))}
            </RadioGroup>
          </DialogContent>

          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              appearance="primary"
              disabled={!selected}
              onClick={() => { if (selected) onConfirm(selected); }}
              style={{ backgroundColor: "#96781a", borderColor: "#96781a" }}
            >
              Cambiar
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
