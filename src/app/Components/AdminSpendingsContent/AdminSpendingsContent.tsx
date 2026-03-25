"use client";

import { useState, useMemo } from "react";
import {
  Button,
  Badge,
  SearchBox,
  Dropdown,
  Option,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Field,
  Textarea,
  Spinner,
  Link as FluentLink,
} from "@fluentui/react-components";
import {
  ArrowClockwiseRegular,
  MoneyRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  ClockRegular,
  PersonRegular,
  MailRegular,
  CalendarRegular,
  WalletRegular,
  CheckmarkRegular,
  DismissRegular,
  AddRegular,
  EyeRegular,
  AttachRegular,
  DocumentRegular,
  OpenRegular,
} from "@fluentui/react-icons";
import LoadingComponent from "../LoadingComponent/LoadingComponent";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import { useAsyncData } from "@/app/hooks/useAsyncData";
import { useDriverId } from "@/app/hooks/useDriverId";
import { useRouter } from "next/navigation";
import { spendingsService, type Spending, type SpendingWithFiles } from "@/services/api/spendings.service";
import { usersService, filesService } from "@/services/api";
import { getRoleName } from "@/app/hooks/useUserRole";
import { formatDateStandard } from "@/app/Utils/FormatUtil";
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmAlert,
} from "@/app/Utils/AlertUtil";
import type { User } from "@/app/backend_models/user.model";
import styles from "./AdminSpendingsContent.module.css";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("AdminSpendingsContent");

const STATUS_MAP: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  denied: "Rechazado",
};

const PAYMENT_MAP: Record<string, string> = {
  pending: "Sin pagar",
  paid: "Pagado",
};

const STATUS_COLORS: Record<string, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  denied: "danger",
};

const CATEGORY_LABELS: Record<string, string> = {
  gas: "Gasolina",
  casetas: "Casetas",
  hotel: "Hotel",
  estacionamiento: "Estacionamiento",
  mantenimiento: "Mantenimiento",
  TAG: "TAG",
  otro: "Otro",
};

export default function AdminSpendingsContent() {
  const router = useRouter();
  const { driverId: currentUserId } = useDriverId();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Approve/Deny dialog
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: "approve" | "deny";
    spending: Spending | null;
  }>({ open: false, type: "approve", spending: null });
  const [actionComments, setActionComments] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Details dialog
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    spending: SpendingWithFiles | null;
    loading: boolean;
  }>({ open: false, spending: null, loading: false });

  // File URLs cache for images
  const [fileUrls, setFileUrls] = useState<Record<number, string>>({});

  const {
    data: spendings,
    loading,
    error,
    refresh,
  } = useAsyncData<Spending[]>(() => spendingsService.getAll(), [], []);

  const {
    data: users,
  } = useAsyncData<User[]>(() => usersService.getAll(), [], []);

  // Build user lookup
  const userMap = useMemo(() => {
    const map: Record<number, User> = {};
    users.forEach((u) => (map[u.user_id] = u));
    return map;
  }, [users]);

  const getUserName = (driverId: number) => {
    const u = userMap[driverId];
    if (!u) return `Usuario #${driverId}`;
    return [u.name, u.first_lastname].filter(Boolean).join(" ");
  };

  const getInitials = (driverId: number) => {
    const u = userMap[driverId];
    if (!u) return "?";
    return ((u.name?.charAt(0) || "") + (u.first_lastname?.charAt(0) || "")).toUpperCase() || "?";
  };

  // Stats
  const stats = useMemo(() => {
    const total = spendings.length;
    const pending = spendings.filter((s) => s.approved_status === "pending").length;
    const approved = spendings.filter((s) => s.approved_status === "approved").length;
    const denied = spendings.filter((s) => s.approved_status === "denied").length;
    const totalAmount = spendings.reduce((sum, s) => sum + Number(s.spending_amount || 0), 0);
    const pendingAmount = spendings
      .filter((s) => s.approved_status === "pending")
      .reduce((sum, s) => sum + Number(s.spending_amount || 0), 0);
    return { total, pending, approved, denied, totalAmount, pendingAmount };
  }, [spendings]);

  // Filtered spendings
  const filteredSpendings = useMemo(() => {
    let result = spendings;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const name = getUserName(s.driver_id).toLowerCase();
        const category = (CATEGORY_LABELS[s.spending_type || ""] || s.spending_type || "").toLowerCase();
        const comments = (s.comments || "").toLowerCase();
        return name.includes(q) || category.includes(q) || comments.includes(q);
      });
    }

    if (statusFilter !== "all") {
      result = result.filter((s) => s.approved_status === statusFilter);
    }

    if (paymentFilter !== "all") {
      result = result.filter((s) => s.payment_status === paymentFilter);
    }

    // Sort by date descending (newest first)
    return [...result].sort(
      (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );
  }, [spendings, searchQuery, statusFilter, paymentFilter, userMap]);

  const openActionDialog = (type: "approve" | "deny", spending: Spending) => {
    setActionDialog({ open: true, type, spending });
    setActionComments("");
  };

  const handleAction = async () => {
    if (!actionDialog.spending || !currentUserId) return;
    setActionLoading(true);
    try {
      if (actionDialog.type === "approve") {
        await spendingsService.approve(actionDialog.spending.spending_id, currentUserId, actionComments || undefined);
        showSuccessAlert("Aprobado", "El gasto fue aprobado correctamente");
      } else {
        await spendingsService.deny(actionDialog.spending.spending_id, currentUserId, actionComments || undefined);
        showSuccessAlert("Rechazado", "El gasto fue rechazado");
      }
      setActionDialog({ open: false, type: "approve", spending: null });
      refresh();
    } catch (err: any) {
      showErrorAlert("Error", err?.message || "No se pudo procesar la acción");
    } finally {
      setActionLoading(false);
    }
  };

  const openDetailsDialog = async (spending: Spending) => {
    setDetailsDialog({ open: true, spending: null, loading: true });
    setFileUrls({}); // Clear previous URLs
    
    try {
      const spendingWithFiles = await spendingsService.getWithFiles(spending.spending_id);
      setDetailsDialog({ open: true, spending: spendingWithFiles, loading: false });
      
      // Fetch URLs for image files
      if (spendingWithFiles.files && spendingWithFiles.files.length > 0) {
        const imageFiles = spendingWithFiles.files.filter(f => 
          f.mime_type.startsWith('image/')
        );
        
        // Fetch all image URLs in parallel
        const urlPromises = imageFiles.map(async (file) => {
          try {
            const url = await filesService.getUrl(file.file_id);
            return { fileId: file.file_id, url };
          } catch (err) {
            log.error(`Error fetching URL for file ${file.file_id}:`, err);
            return null;
          }
        });
        
        const results = await Promise.all(urlPromises);
        const urlsMap: Record<number, string> = {};
        results.forEach(result => {
          if (result) {
            urlsMap[result.fileId] = result.url;
          }
        });
        setFileUrls(urlsMap);
      }
    } catch (err: any) {
      log.error("Error fetching spending details:", err);
      showErrorAlert("Error", "No se pudieron cargar los detalles del gasto");
      setDetailsDialog({ open: false, spending: null, loading: false });
    }
  };

  const isImageFile = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  const handleOpenFile = async (fileId: number, fileName: string) => {
    try {
      const url = await filesService.getUrl(fileId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      log.error("Error getting file URL:", err);
      showErrorAlert("Error", `No se pudo abrir el archivo: ${fileName}`);
    }
  };

  if (loading) {
    return <LoadingComponent message="Cargando gastos..." />;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p style={{ color: "red" }}>Error: {error}</p>
        <ButtonComponent text="Reintentar" onClick={refresh} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Gastos de Choferes</h1>
          <p className={styles.subtitle}>
            Revisa, aprueba o rechaza los gastos reportados
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button
            appearance="subtle"
            icon={<ArrowClockwiseRegular />}
            onClick={refresh}
            title="Actualizar"
          />
          <Button
            appearance="primary"
            icon={<AddRegular />}
            onClick={() => router.push("/gastos/crear")}
            style={{ backgroundColor: "#1a2e47", borderColor: "#1a2e47" }}
          >
            Registrar Gasto
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} data-color="brand">
            <MoneyRegular />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              ${stats.totalAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </span>
            <span className={styles.statLabel}>Monto Total</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} data-color="warning">
            <ClockRegular />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.pending}</span>
            <span className={styles.statLabel}>Pendientes</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} data-color="success">
            <CheckmarkCircleRegular />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.approved}</span>
            <span className={styles.statLabel}>Aprobados</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} data-color="danger">
            <DismissCircleRegular />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.denied}</span>
            <span className={styles.statLabel}>Rechazados</span>
          </div>
        </div>
      </div>

      {/* Pending Amount Banner */}
      {stats.pending > 0 && (
        <div className={styles.pendingBanner}>
          <WalletRegular />
          <span>
            <strong>${stats.pendingAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</strong>{" "}
            en gastos pendientes de aprobación
          </span>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filtersBar}>
        <div className={styles.searchContainer}>
          <SearchBox
            placeholder="Buscar por chofer, categoría o comentarios..."
            value={searchQuery}
            onChange={(_, d) => setSearchQuery(d.value)}
            className={styles.searchBox}
          />
        </div>
        <div className={styles.filterGroup}>
          <Dropdown
            placeholder="Estado"
            value={
              statusFilter === "all"
                ? "Todos los estados"
                : STATUS_MAP[statusFilter] || statusFilter
            }
            onOptionSelect={(_, d) => setStatusFilter(d.optionValue as string)}
            className={styles.filterDropdown}
          >
            <Option value="all">Todos los estados</Option>
            <Option value="pending">Pendiente</Option>
            <Option value="approved">Aprobado</Option>
            <Option value="denied">Rechazado</Option>
          </Dropdown>
          <Dropdown
            placeholder="Pago"
            value={
              paymentFilter === "all"
                ? "Todos los pagos"
                : PAYMENT_MAP[paymentFilter] || paymentFilter
            }
            onOptionSelect={(_, d) => setPaymentFilter(d.optionValue as string)}
            className={styles.filterDropdown}
          >
            <Option value="all">Todos los pagos</Option>
            <Option value="pending">Sin pagar</Option>
            <Option value="paid">Pagado</Option>
          </Dropdown>
        </div>
      </div>

      {/* Results count */}
      <div className={styles.resultsInfo}>
        <span>
          Mostrando {filteredSpendings.length} de {spendings.length} gastos
        </span>
        {(searchQuery || statusFilter !== "all" || paymentFilter !== "all") && (
          <Button
            appearance="subtle"
            size="small"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setPaymentFilter("all");
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Spending Cards */}
      {filteredSpendings.length === 0 ? (
        <div className={styles.emptyState}>
          <MoneyRegular className={styles.emptyIcon} />
          <h3>No se encontraron gastos</h3>
          <p>Ajusta los filtros o espera a que los choferes registren gastos</p>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {filteredSpendings.map((spending) => (
            <div key={spending.spending_id} className={styles.spendingCard}>
              {/* Card top: driver info + status */}
              <div className={styles.cardTop}>
                <div className={styles.driverInfo}>
                  <div className={styles.driverAvatar}>
                    {getInitials(spending.driver_id)}
                  </div>
                  <div className={styles.driverDetails}>
                    <span className={styles.driverName}>
                      {getUserName(spending.driver_id)}
                    </span>
                    <span className={styles.spendingDate}>
                      <CalendarRegular className={styles.miniIcon} />
                      {formatDateStandard(spending.submitted_at)}
                    </span>
                  </div>
                </div>
                <Badge
                  appearance="tint"
                  color={STATUS_COLORS[spending.approved_status] || "warning"}
                  size="medium"
                >
                  {STATUS_MAP[spending.approved_status] || "Pendiente"}
                </Badge>
              </div>

              {/* Card body: amount + category */}
              <div className={styles.cardBody}>
                <div className={styles.amountRow}>
                  <span className={styles.amount}>
                    ${Number(spending.spending_amount || 0).toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <Badge appearance="outline" size="small">
                    {CATEGORY_LABELS[spending.spending_type || ""] || spending.spending_type || "Sin categoría"}
                  </Badge>
                </div>
                {spending.comments && (
                  <p className={styles.comments}>{spending.comments}</p>
                )}
                <div className={styles.metaRow}>
                  <Badge
                    appearance="tint"
                    color={spending.payment_status === "paid" ? "success" : "subtle"}
                    size="small"
                  >
                    {PAYMENT_MAP[spending.payment_status] || "Sin pagar"}
                  </Badge>
                  {spending.contract_id && (
                    <span className={styles.metaItem}>
                      Servicio #{spending.contract_id}
                    </span>
                  )}
                </div>
              </div>

              {/* Card actions */}
              <div className={styles.cardActions}>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<EyeRegular />}
                  onClick={() => openDetailsDialog(spending)}
                >
                  Ver Detalles
                </Button>
                {spending.approved_status === "pending" && (
                  <>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<CheckmarkRegular />}
                      className={styles.approveBtn}
                      onClick={() => openActionDialog("approve", spending)}
                    >
                      Aprobar
                    </Button>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<DismissRegular />}
                      className={styles.denyBtn}
                      onClick={() => openActionDialog("deny", spending)}
                    >
                      Rechazar
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve/Deny Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(_, d) =>
          setActionDialog((prev) => ({ ...prev, open: d.open }))
        }
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              {actionDialog.type === "approve"
                ? "Aprobar Gasto"
                : "Rechazar Gasto"}
            </DialogTitle>
            <DialogContent>
              {actionDialog.spending && (
                <div className={styles.dialogInfo}>
                  <p>
                    <strong>Chofer:</strong>{" "}
                    {getUserName(actionDialog.spending.driver_id)}
                  </p>
                  <p>
                    <strong>Monto:</strong> $
                    {Number(actionDialog.spending.spending_amount || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Categoría:</strong>{" "}
                    {CATEGORY_LABELS[actionDialog.spending.spending_type || ""] ||
                      actionDialog.spending.spending_type || "—"}
                  </p>
                </div>
              )}
              <Field label="Comentarios (opcional)">
                <Textarea
                  value={actionComments}
                  onChange={(_, d) => setActionComments(d.value)}
                  placeholder={
                    actionDialog.type === "approve"
                      ? "Comentarios de aprobación..."
                      : "Razón del rechazo..."
                  }
                  rows={3}
                />
              </Field>
              <div className={styles.dialogActions}>
                <Button
                  appearance="secondary"
                  onClick={() =>
                    setActionDialog({ open: false, type: "approve", spending: null })
                  }
                  disabled={actionLoading}
                  style={{ color: "#96781a", borderColor: "#96781a" }}
                >
                  Cancelar
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleAction}
                  disabled={actionLoading}
                  icon={actionLoading ? <Spinner size="tiny" /> : undefined}
                  style={
                    actionDialog.type === "approve"
                      ? { backgroundColor: "#059669", borderColor: "#059669", color: "white" }
                      : { backgroundColor: "#dc2626", borderColor: "#dc2626", color: "white" }
                  }
                >
                  {actionDialog.type === "approve" ? "Aprobar" : "Rechazar"}
                </Button>
              </div>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialog.open}
        onOpenChange={(_, d) =>
          setDetailsDialog((prev) => ({ ...prev, open: d.open }))
        }
      >
        <DialogSurface style={{ maxWidth: "600px" }}>
          <DialogBody>
            <DialogTitle>Detalles del Gasto</DialogTitle>
            <DialogContent>
              {detailsDialog.loading ? (
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  <Spinner label="Cargando detalles..." />
                </div>
              ) : detailsDialog.spending ? (
                <div className={styles.detailsContent}>
                  {/* Driver Info */}
                  <div className={styles.detailSection}>
                    <h3 className={styles.detailSectionTitle}>
                      <PersonRegular /> Información del Chofer
                    </h3>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Nombre:</span>
                        <span className={styles.detailValue}>
                          {getUserName(detailsDialog.spending.driver_id)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Spending Info */}
                  <div className={styles.detailSection}>
                    <h3 className={styles.detailSectionTitle}>
                      <MoneyRegular /> Información del Gasto
                    </h3>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Monto:</span>
                        <span className={styles.detailValue} style={{ fontWeight: 600, color: "#1a2e47" }}>
                          ${Number(detailsDialog.spending.spending_amount || 0).toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Categoría:</span>
                        <span className={styles.detailValue}>
                          {CATEGORY_LABELS[detailsDialog.spending.spending_type || ""] ||
                            detailsDialog.spending.spending_type ||
                            "Sin categoría"}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Fecha de envío:</span>
                        <span className={styles.detailValue}>
                          {formatDateStandard(detailsDialog.spending.submitted_at)}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Estado:</span>
                        <Badge
                          appearance="tint"
                          color={STATUS_COLORS[detailsDialog.spending.approved_status] || "warning"}
                        >
                          {STATUS_MAP[detailsDialog.spending.approved_status] || "Pendiente"}
                        </Badge>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Pago:</span>
                        <Badge
                          appearance="tint"
                          color={detailsDialog.spending.payment_status === "paid" ? "success" : "subtle"}
                        >
                          {PAYMENT_MAP[detailsDialog.spending.payment_status] || "Sin pagar"}
                        </Badge>
                      </div>
                      {detailsDialog.spending.contract_id && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Servicio:</span>
                          <span className={styles.detailValue}>#{detailsDialog.spending.contract_id}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comments */}
                  {detailsDialog.spending.comments && (
                    <div className={styles.detailSection}>
                      <h3 className={styles.detailSectionTitle}>Comentarios</h3>
                      <p className={styles.commentsText}>{detailsDialog.spending.comments}</p>
                    </div>
                  )}

                  {/* Attachments */}
                  <div className={styles.detailSection}>
                    <h3 className={styles.detailSectionTitle}>
                      <AttachRegular /> Archivos Adjuntos ({detailsDialog.spending.files?.length || 0})
                    </h3>
                    {detailsDialog.spending.files && detailsDialog.spending.files.length > 0 ? (
                      <div className={styles.attachmentsList}>
                        {detailsDialog.spending.files.map((file) => {
                          const isImage = isImageFile(file.mime_type);
                          const imageUrl = fileUrls[file.file_id];
                          
                          return (
                            <div key={file.file_id} className={styles.attachmentItem}>
                              {isImage && imageUrl ? (
                                <div className={styles.imagePreviewContainer}>
                                  <img
                                    src={imageUrl}
                                    alt={file.original_name}
                                    className={styles.imagePreview}
                                    onClick={() => handleOpenFile(file.file_id, file.original_name)}
                                  />
                                  <div className={styles.attachmentDetails}>
                                    <DocumentRegular className={styles.attachmentIcon} />
                                    <div className={styles.attachmentInfo}>
                                      <span className={styles.attachmentName}>{file.original_name}</span>
                                      <span className={styles.attachmentMeta}>
                                        {(file.file_size / 1024).toFixed(1)} KB • {file.mime_type}
                                      </span>
                                    </div>
                                    <Button
                                      appearance="subtle"
                                      size="small"
                                      icon={<OpenRegular />}
                                      onClick={() => handleOpenFile(file.file_id, file.original_name)}
                                    >
                                      Abrir
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <DocumentRegular className={styles.attachmentIcon} />
                                  <div className={styles.attachmentInfo}>
                                    <span className={styles.attachmentName}>{file.original_name}</span>
                                    <span className={styles.attachmentMeta}>
                                      {(file.file_size / 1024).toFixed(1)} KB • {file.mime_type}
                                    </span>
                                  </div>
                                  <Button
                                    appearance="subtle"
                                    size="small"
                                    icon={<OpenRegular />}
                                    onClick={() => handleOpenFile(file.file_id, file.original_name)}
                                  >
                                    Abrir
                                  </Button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className={styles.noAttachments}>No hay archivos adjuntos</p>
                    )}
                  </div>
                </div>
              ) : null}
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setDetailsDialog({ open: false, spending: null, loading: false })}
                style={{ backgroundColor: "#1a2e47", color: "white" }}
              >
                Cerrar
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
