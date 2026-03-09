"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Badge,
  Text,
  Spinner,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  DismissRegular,
  DocumentPdfRegular,
  DeleteRegular,
  ImageRegular,
  OpenRegular,
  MoneyRegular,
  CalendarRegular,
  TagRegular,
  CommentRegular,
} from "@fluentui/react-icons";
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from "@/app/Utils/AlertUtil";
import { filesService } from "@/services/api/files.service";
import { apiConfig, API_ENDPOINTS } from "@/config/api.config";
import { Logger } from "@/app/Utils/Logger";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import type { SpendingWithFiles, SpendingAttachedFile } from "@/services/api/spendings.service";
import styles from "./SpendingDetailModal.module.css";

const log = Logger.getLogger("SpendingDetailModal");

const CATEGORY_LABELS: Record<string, string> = {
  gas: "Gasolina",
  casetas: "Casetas",
  hotel: "Hotel",
  estacionamiento: "Estacionamiento",
  mantenimiento: "Mantenimiento",
  TAG: "TAG",
  otro: "Otro",
};

const useStyles = makeStyles({
  surface: {
    maxWidth: "680px",
    width: "100%",
    maxHeight: "90vh",
    padding: 0,
    borderRadius: "12px",
    overflow: "hidden",
  },
  dialogBody: {
    display: "flex",
    flexDirection: "column",
    padding: 0,
    gap: 0,
    maxHeight: "90vh",
  },
  header: {
    backgroundColor: "#1a2e47",
    padding: "20px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexShrink: 0,
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  headerTitle: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "20px",
    lineHeight: "1.2",
  },
  headerMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  closeBtn: {
    color: "rgba(255,255,255,0.8)",
    minWidth: "32px",
    flexShrink: 0,
    ":hover": {
      backgroundColor: "rgba(255,255,255,0.15)",
      color: "#ffffff",
    },
  },
  content: {
    overflowY: "auto",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    flex: 1,
  },
  amountCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: "10px",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  amountValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a2e47",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  infoItem: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: "8px",
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  infoLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: tokens.colorNeutralForeground3,
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  infoValue: {
    color: tokens.colorNeutralForeground1,
    fontWeight: "500",
    fontSize: "14px",
  },
  descriptionBox: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: "8px",
    padding: "14px 16px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  sectionTitle: {
    fontWeight: "600",
    color: tokens.colorNeutralForeground1,
    fontSize: "15px",
    marginBottom: "2px",
  },
  filesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
  },
  fileThumb: {
    position: "relative",
    borderRadius: "8px",
    overflow: "hidden",
    aspectRatio: "1",
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ":hover > .overlay": {
      opacity: 1,
    },
  },
  fileImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  pdfPlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px",
    textAlign: "center",
  },
  fileOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    opacity: 0,
    transition: "opacity 0.2s",
    borderRadius: "8px",
  },
  overlayBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "#ffffff",
    minWidth: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.3)",
    ":hover": {
      backgroundColor: "rgba(255,255,255,0.35)",
    },
  },
  deleteOverlayBtn: {
    backgroundColor: "rgba(196,43,28,0.7)",
    color: "#ffffff",
    minWidth: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "1px solid rgba(255,100,80,0.4)",
    ":hover": {
      backgroundColor: "rgba(196,43,28,0.9)",
    },
  },
  emptyFiles: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "32px 16px",
    borderRadius: "8px",
    border: `2px dashed ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground3,
  },
  footer: {
    padding: "16px 24px",
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    display: "flex",
    justifyContent: "flex-end",
    flexShrink: 0,
  },
});

interface Props {
  spending: SpendingWithFiles | null;
  open: boolean;
  onDismiss: () => void;
  onFilesChanged?: () => void;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

function getFileUrl(file: SpendingAttachedFile): string {
  return `${apiConfig.baseUrl}${API_ENDPOINTS.FILES.URL(file.file_id)}`;
}

function isImage(mime: string): boolean {
  return mime.startsWith("image/");
}

export default function SpendingDetailModal({
  spending,
  open,
  onDismiss,
  onFilesChanged,
}: Props) {
  const s = useStyles();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [localFiles, setLocalFiles] = useState<SpendingAttachedFile[] | null>(null);
  const isMobile = useIsMobile();

  const files = localFiles ?? spending?.files ?? [];

  const statusConfig = {
    pending: { label: "Pendiente", color: "warning" as const },
    approved: { label: "Aprobado", color: "success" as const },
    denied: { label: "Rechazado", color: "danger" as const },
  };
  const status = statusConfig[spending?.approved_status ?? "pending"];
  const categoryLabel =
    CATEGORY_LABELS[spending?.spending_type ?? ""] ??
    spending?.spending_type ??
    "—";

  const handleDeleteFile = (file: SpendingAttachedFile) => {
    showConfirmAlert(
      "Eliminar comprobante",
      `¿Deseas eliminar "${file.original_name}"? Esta acción no se puede deshacer.`,
      "Eliminar",
      async () => {
        setDeletingId(file.file_id);
        try {
          await filesService.delete(file.file_id);
          const updated = files.filter((f) => f.file_id !== file.file_id);
          setLocalFiles(updated);
          onFilesChanged?.();
          showSuccessAlert("Eliminado", "El comprobante fue eliminado");
        } catch (err: any) {
          log.error("Delete file error:", err);
          showErrorAlert("Error", err?.message ?? "No se pudo eliminar el archivo");
        } finally {
          setDeletingId(null);
        }
      },
    );
  };

  const handleOpenFile = async (file: SpendingAttachedFile) => {
    try {
      const url = await filesService.getUrl(file.file_id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      log.error("Error fetching file URL:", err);
      // Fallback to download endpoint
      window.open(getFileUrl(file), "_blank", "noopener,noreferrer");
    }
  };

  const handleClose = () => {
    setLocalFiles(null);
    onDismiss();
  };

  if (!spending) return null;

  return (
    <Dialog open={open} onOpenChange={(_, d) => { if (!d.open) handleClose(); }}>
      <DialogSurface className={s.surface}>
        <DialogBody className={s.dialogBody}>
          {/* ── Header ── */}
          <div className={s.header}>
            <div className={s.headerLeft}>
              <Text className={s.headerTitle}>Detalle del Gasto</Text>
              <div className={s.headerMeta}>
                <Badge appearance="filled" color={status.color} size="medium">
                  {status.label}
                </Badge>
                <Badge appearance="outline" color="informative" size="medium">
                  #{spending.spending_id}
                </Badge>
              </div>
            </div>
            <Button
              className={s.closeBtn}
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={handleClose}
              aria-label="Cerrar"
            />
          </div>

          {/* ── Scrollable content ── */}
          <div className={s.content}>
            {/* Amount */}
            <div className={s.amountCard}>
              <MoneyRegular fontSize={28} color="#96781a" />
              <div>
                <Text
                  size={200}
                  style={{ color: tokens.colorNeutralForeground3, display: "block" }}
                >
                  Monto del Gasto
                </Text>
                <Text className={s.amountValue}>
                  {formatAmount(Number(spending.spending_amount))}
                </Text>
              </div>
            </div>

            {/* Info grid */}
            <div className={s.infoGrid}>
              <div className={s.infoItem}>
                <span className={s.infoLabel}>
                  <TagRegular fontSize={13} /> Categoría
                </span>
                <span className={s.infoValue}>{categoryLabel}</span>
              </div>
              <div className={s.infoItem}>
                <span className={s.infoLabel}>
                  <CalendarRegular fontSize={13} /> Fecha
                </span>
                <span className={s.infoValue}>
                  {formatDate(spending.submitted_at)}
                </span>
              </div>
            </div>

            {/* Description */}
            {spending.comments && (
              <div className={s.descriptionBox}>
                <span className={s.infoLabel}>
                  <CommentRegular fontSize={13} /> Descripción
                </span>
                <Text style={{ lineHeight: "1.5", color: tokens.colorNeutralForeground1 }}>
                  {spending.comments}
                </Text>
              </div>
            )}

            {/* Files section */}
            <div>
              <Text className={s.sectionTitle}>
                Comprobantes ({files.length})
              </Text>

              {files.length === 0 ? (
                <div className={s.emptyFiles}>
                  <ImageRegular fontSize={36} />
                  <Text size={300}>No hay comprobantes adjuntos</Text>
                </div>
              ) : (
                <div
                  className={s.filesGrid}
                  style={isMobile ? { gridTemplateColumns: "repeat(2, 1fr)" } : undefined}
                >
                  {files.map((file) => (
                    <FileThumb
                      key={file.file_id}
                      file={file}
                      isDeleting={deletingId === file.file_id}
                      isMobile={isMobile}
                      onDelete={handleDeleteFile}
                      onOpen={handleOpenFile}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className={s.footer}>
            <Button appearance="secondary" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

/* ── FileThumb sub-component ── */
interface FileThumbProps {
  file: SpendingAttachedFile;
  isDeleting: boolean;
  isMobile: boolean;
  onDelete: (f: SpendingAttachedFile) => void;
  onOpen: (f: SpendingAttachedFile) => void;
}

function FileThumb({ file, isDeleting, isMobile, onDelete, onOpen }: FileThumbProps) {
  const s = useStyles();
  const [showOverlay, setShowOverlay] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const img = isImage(file.mime_type);
  const overlayVisible = isMobile || showOverlay || isDeleting;

  useEffect(() => {
    filesService.getUrl(file.file_id)
      .then(setResolvedUrl)
      .catch(() => setResolvedUrl(null));
  }, [file.file_id]);

  return (
    <div
      className={s.fileThumb}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
      role="group"
      aria-label={file.original_name}
    >
      {img ? (
        resolvedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedUrl}
            alt={file.original_name}
            className={s.fileImg}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className={s.pdfPlaceholder}>
            <Spinner size="tiny" />
          </div>
        )
      ) : (
        <div className={s.pdfPlaceholder}>
          <DocumentPdfRegular fontSize={36} color="#c43b1c" />
          <Text
            size={100}
            style={{
              wordBreak: "break-all",
              color: tokens.colorNeutralForeground2,
              textAlign: "center",
            }}
          >
            {file.original_name}
          </Text>
        </div>
      )}

      {/* Overlay with action buttons */}
      {overlayVisible && (
        <div className={`${s.fileOverlay} overlay`} style={{ opacity: 1 }}>
          {isDeleting ? (
            <Spinner size="tiny" />
          ) : (
            <>
              <Button
                className={s.overlayBtn}
                appearance="subtle"
                icon={<OpenRegular />}
                onClick={() => onOpen(file)}
                size="small"
                title="Ver"
              />
              <Button
                className={s.deleteOverlayBtn}
                appearance="subtle"
                icon={<DeleteRegular />}
                onClick={() => onDelete(file)}
                size="small"
                title="Eliminar"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
