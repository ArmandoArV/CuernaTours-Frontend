"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Card,
  Text,
  Button,
  Badge,
  Spinner,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Field,
  Input,
  Textarea,
  Dropdown,
  Option,
  Tooltip,
  makeStyles,
  tokens,
  shorthands,
} from "@fluentui/react-components";
import {
  ArrowClockwiseRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  Dismiss24Regular,
  GasPumpRegular,
  PersonRegular,
  MoneyRegular,
  FilterRegular,
  SearchRegular,
  AddFilled,
} from "@fluentui/react-icons";
import { valesService, ValeWithDetails, ValeStatus, ValePaymentType } from "@/services/api/vales.service";
import { referenceService, DriverReference } from "@/services/api/reference.service";
import { showSuccessAlert, showErrorAlert } from "@/app/Utils/AlertUtil";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import LoadingComponent from "@/app/Components/LoadingComponent/LoadingComponent";
import ErrorBlock from "@/app/Components/ErrorBlock/ErrorBlock";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("ValesContent");

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalM,
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  statCard: {
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    ...shorthands.borderRadius("12px"),
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  statValue: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
  },
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },

  filtersRow: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
    alignItems: "flex-end",
  },
  searchBox: {
    minWidth: "250px",
    flex: "1 1 250px",
    maxWidth: "400px",
  },
  filterDropdown: {
    minWidth: "160px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: tokens.spacingHorizontalL,
  },

  valeCard: {
    ...shorthands.padding(tokens.spacingVerticalL),
    ...shorthands.borderRadius("12px"),
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: tokens.shadow16,
    },
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  driverInfo: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  driverAvatar: {
    width: "40px",
    height: "40px",
    ...shorthands.borderRadius("50%"),
    backgroundColor: "#1a2e47",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    flexShrink: 0,
  },
  driverName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
  },
  driverDate: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  amountRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amount: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    color: "#1a2e47",
  },
  notesBox: {
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    fontStyle: "italic",
  },
  cardActions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    marginTop: "auto",
  },
  approveBtn: {
    flex: 1,
  },
  denyBtn: {
    flex: 1,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },

  dialogSurface: {
    maxWidth: "460px",
    width: "100%",
    ...shorthands.borderRadius("16px"),
  },
  dialogForm: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
    marginTop: tokens.spacingVerticalL,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
  },
  dialogSummary: {
    ...shorthands.padding(tokens.spacingVerticalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  dialogSummaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingVerticalL,
    ...shorthands.padding("48px"),
    textAlign: "center",
  },
  emptyIcon: {
    width: "64px",
    height: "64px",
    ...shorthands.borderRadius("50%"),
    backgroundColor: tokens.colorNeutralBackground2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

type StatusBadgeColor = "important" | "success" | "warning" | "danger";

const STATUS_CONFIG: Record<ValeStatus, { label: string; color: StatusBadgeColor }> = {
  pending: { label: "Pendiente", color: "warning" },
  paid: { label: "Pagado", color: "success" },
  denied: { label: "Rechazado", color: "danger" },
};

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

export default function ValesContent() {
  const styles = useStyles();
  const isMobile = useIsMobile();

  const [vales, setVales] = useState<ValeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    vale: ValeWithDetails | null;
    action: "paid" | "denied" | null;
  }>({ open: false, vale: null, action: null });
  const [paymentType, setPaymentType] = useState<ValePaymentType>("Efectivo");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Assign vale dialog state
  const [assignDialog, setAssignDialog] = useState(false);
  const [drivers, setDrivers] = useState<DriverReference[]>([]);
  const [assignForm, setAssignForm] = useState({
    driver_id: 0,
    amount: "",
    payment_type: "Efectivo" as ValePaymentType,
    decision_notes: "",
  });
  const [assignSaving, setAssignSaving] = useState(false);

  const fetchVales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await valesService.getAll();
      setVales(data);
    } catch (err: any) {
      log.error("Error fetching vales:", err);
      setError(err?.message || "Error al cargar los vales");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVales();
  }, [fetchVales]);

  // Stats
  const stats = useMemo(() => {
    const pending = vales.filter((v) => v.status === "pending");
    const paid = vales.filter((v) => v.status === "paid");
    const denied = vales.filter((v) => v.status === "denied");
    const totalPendingAmount = pending.reduce((sum, v) => sum + Number(v.amount), 0);
    return { pending: pending.length, paid: paid.length, denied: denied.length, totalPendingAmount };
  }, [vales]);

  // Filtered
  const filteredVales = useMemo(() => {
    return vales.filter((v) => {
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = v.driver_name?.toLowerCase().includes(q);
        const matchNotes = v.request_notes?.toLowerCase().includes(q);
        const matchAmount = formatCurrency(Number(v.amount)).includes(q);
        if (!matchName && !matchNotes && !matchAmount) return false;
      }
      return true;
    });
  }, [vales, statusFilter, searchQuery]);

  // Sort: pending first, then by date desc
  const sortedVales = useMemo(() => {
    return [...filteredVales].sort((a, b) => {
      const statusOrder: Record<ValeStatus, number> = { pending: 0, paid: 1, denied: 2 };
      const sa = statusOrder[a.status] ?? 3;
      const sb = statusOrder[b.status] ?? 3;
      if (sa !== sb) return sa - sb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredVales]);

  const openActionDialog = (vale: ValeWithDetails, action: "paid" | "denied") => {
    setActionDialog({ open: true, vale, action });
    setPaymentType("Efectivo");
    setDecisionNotes("");
  };

  const handleDecide = async () => {
    if (!actionDialog.vale || !actionDialog.action) return;
    setSaving(true);
    try {
      await valesService.decideVale(actionDialog.vale.vale_id, {
        action: actionDialog.action,
        payment_type: actionDialog.action === "paid" ? paymentType : undefined,
        decision_notes: decisionNotes.trim() || undefined,
      });

      const actionLabel = actionDialog.action === "paid" ? "aprobado" : "rechazado";
      showSuccessAlert("Vale " + actionLabel, `El vale fue ${actionLabel} correctamente`, () => {
        setActionDialog({ open: false, vale: null, action: null });
        fetchVales();
      });
    } catch (err: any) {
      log.error("Error deciding vale:", err);
      showErrorAlert("Error", err?.message || "No se pudo procesar el vale");
    } finally {
      setSaving(false);
    }
  };

  const openAssignDialog = async () => {
    setAssignForm({ driver_id: 0, amount: "", payment_type: "Efectivo", decision_notes: "" });
    setAssignDialog(true);
    try {
      const driverList = await referenceService.getDrivers();
      setDrivers(driverList);
    } catch (err: any) {
      log.error("Error fetching drivers:", err);
    }
  };

  const handleAssignVale = async () => {
    const amount = parseFloat(assignForm.amount);
    if (!assignForm.driver_id || isNaN(amount) || amount <= 0) {
      showErrorAlert("Campos requeridos", "Selecciona un chofer e ingresa un monto válido");
      return;
    }
    setAssignSaving(true);
    try {
      await valesService.assignVale({
        driver_id: assignForm.driver_id,
        amount,
        payment_type: assignForm.payment_type,
        decision_notes: assignForm.decision_notes.trim() || undefined,
      });
      showSuccessAlert("Vale asignado", "El vale fue asignado correctamente al chofer", () => {
        setAssignDialog(false);
        fetchVales();
      });
    } catch (err: any) {
      log.error("Error assigning vale:", err);
      showErrorAlert("Error", err?.message || "No se pudo asignar el vale");
    } finally {
      setAssignSaving(false);
    }
  };

  if (loading) {
    return <LoadingComponent message="Cargando vales..." />;
  }

  if (error) {
    return <ErrorBlock message={error} onRetry={fetchVales} />;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Text className={styles.title}>Gestión de Vales</Text>
          <Text className={styles.subtitle}>
            {vales.length} {vales.length === 1 ? "vale registrado" : "vales registrados"}
          </Text>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Button
            appearance="subtle"
            icon={<ArrowClockwiseRegular />}
            onClick={fetchVales}
          >
            Actualizar
          </Button>
          <Button
            appearance="primary"
            icon={<AddFilled />}
            onClick={openAssignDialog}
            style={{ backgroundColor: "#1a2e47", borderColor: "#1a2e47" }}
          >
            Registrar Vale
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard} appearance="filled-alternative">
          <Text className={styles.statValue} style={{ color: "#d97706" }}>
            {stats.pending}
          </Text>
          <Text className={styles.statLabel}>Pendientes</Text>
        </Card>
        <Card className={styles.statCard} appearance="filled-alternative">
          <Text className={styles.statValue} style={{ color: "#d97706" }}>
            {formatCurrency(stats.totalPendingAmount)}
          </Text>
          <Text className={styles.statLabel}>Monto pendiente</Text>
        </Card>
        <Card className={styles.statCard} appearance="filled-alternative">
          <Text className={styles.statValue} style={{ color: "#059669" }}>
            {stats.paid}
          </Text>
          <Text className={styles.statLabel}>Pagados</Text>
        </Card>
        <Card className={styles.statCard} appearance="filled-alternative">
          <Text className={styles.statValue} style={{ color: "#dc2626" }}>
            {stats.denied}
          </Text>
          <Text className={styles.statLabel}>Rechazados</Text>
        </Card>
      </div>

      {/* Filters */}
      <div className={styles.filtersRow}>
        <div className={styles.searchBox}>
          <Input
            contentBefore={<SearchRegular />}
            placeholder="Buscar por chofer, concepto o monto..."
            value={searchQuery}
            onChange={(_, d) => setSearchQuery(d.value)}
            appearance="outline"
          />
        </div>
        <div className={styles.filterDropdown}>
          <Dropdown
            value={
              statusFilter === "all"
                ? "Todos"
                : STATUS_CONFIG[statusFilter as ValeStatus]?.label || "Todos"
            }
            placeholder="Filtrar estatus"
            onOptionSelect={(_, d) => setStatusFilter(d.optionValue || "all")}
          >
            <Option value="all">Todos</Option>
            <Option value="pending">Pendientes</Option>
            <Option value="paid">Pagados</Option>
            <Option value="denied">Rechazados</Option>
          </Dropdown>
        </div>
      </div>

      {/* Content */}
      {sortedVales.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <GasPumpRegular fontSize={28} style={{ color: tokens.colorNeutralForeground3 }} />
          </div>
          <Text size={400} weight="semibold">
            No se encontraron vales
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {statusFilter !== "all"
              ? "Intenta cambiar los filtros de búsqueda"
              : "Aún no hay solicitudes de vales registradas"}
          </Text>
        </div>
      ) : (
        <div className={styles.grid}>
          {sortedVales.map((vale) => {
            const isPending = vale.status === "pending";
            const config = STATUS_CONFIG[vale.status];

            return (
              <Card key={vale.vale_id} className={styles.valeCard}>
                {/* Header: driver + badge */}
                <div className={styles.cardHeader}>
                  <div className={styles.driverInfo}>
                    <div className={styles.driverAvatar}>
                      {getInitials(vale.driver_name)}
                    </div>
                    <div>
                      <Text className={styles.driverName}>
                        {vale.driver_name || `Chofer #${vale.driver_id}`}
                      </Text>
                      <Text className={styles.driverDate}>
                        {formatDate(vale.created_at)}
                      </Text>
                    </div>
                  </div>
                  <Badge appearance="filled" color={config.color}>
                    {config.label}
                  </Badge>
                </div>

                {/* Amount */}
                <div className={styles.amountRow}>
                  <Text className={styles.amount}>
                    {formatCurrency(Number(vale.amount))}
                  </Text>
                  {vale.payment_type && (
                    <Badge appearance="outline" color="informative">
                      {vale.payment_type}
                    </Badge>
                  )}
                </div>

                {/* Notes */}
                {vale.request_notes && (
                  <div className={styles.notesBox}>
                    &quot;{vale.request_notes}&quot;
                  </div>
                )}

                {/* Meta */}
                <div className={styles.metaRow}>
                  <Text>Vale #{vale.vale_id}</Text>
                  {vale.decided_by_name && (
                    <Text>
                      {vale.status === "paid" ? "Aprobado" : "Decidido"} por {vale.decided_by_name}
                    </Text>
                  )}
                </div>

                {/* Decision notes */}
                {vale.decision_notes && (
                  <div className={styles.notesBox} style={{ borderLeft: `3px solid ${vale.status === "paid" ? "#059669" : "#dc2626"}` }}>
                    {vale.decision_notes}
                  </div>
                )}

                {/* Actions */}
                {isPending && (
                  <div className={styles.cardActions}>
                    <Button
                      className={styles.approveBtn}
                      appearance="primary"
                      icon={<CheckmarkCircleRegular />}
                      onClick={() => openActionDialog(vale, "paid")}
                      style={{ backgroundColor: "#059669", borderColor: "#059669" }}
                    >
                      Aprobar
                    </Button>
                    <Button
                      className={styles.denyBtn}
                      appearance="secondary"
                      icon={<DismissCircleRegular />}
                      onClick={() => openActionDialog(vale, "denied")}
                      style={{ color: "#dc2626", borderColor: "#dc2626" }}
                    >
                      Rechazar
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve / Deny Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(_, data) => {
          if (!data.open) setActionDialog({ open: false, vale: null, action: null });
        }}
      >
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle
              action={
                <Button
                  appearance="subtle"
                  aria-label="cerrar"
                  icon={<Dismiss24Regular />}
                  onClick={() => setActionDialog({ open: false, vale: null, action: null })}
                />
              }
            >
              {actionDialog.action === "paid" ? "Aprobar Vale" : "Rechazar Vale"}
            </DialogTitle>

            <DialogContent>
              <div className={styles.dialogForm}>
                {/* Summary */}
                <div className={styles.dialogSummary}>
                  <div className={styles.dialogSummaryRow}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      Chofer
                    </Text>
                    <Text weight="semibold">
                      {actionDialog.vale?.driver_name || "-"}
                    </Text>
                  </div>
                  <div className={styles.dialogSummaryRow}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      Monto
                    </Text>
                    <Text weight="bold" size={400}>
                      {actionDialog.vale ? formatCurrency(Number(actionDialog.vale.amount)) : "-"}
                    </Text>
                  </div>
                  {actionDialog.vale?.request_notes && (
                    <div className={styles.dialogSummaryRow}>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        Concepto
                      </Text>
                      <Text>{actionDialog.vale.request_notes}</Text>
                    </div>
                  )}
                </div>

                {/* Payment type (only for approve) */}
                {actionDialog.action === "paid" && (
                  <Field label="Tipo de pago" required>
                    <Dropdown
                      value={paymentType}
                      onOptionSelect={(_, d) =>
                        setPaymentType((d.optionValue as ValePaymentType) || "Efectivo")
                      }
                    >
                      <Option value="Efectivo">Efectivo</Option>
                      <Option value="Transferencia">Transferencia</Option>
                    </Dropdown>
                  </Field>
                )}

                {/* Notes */}
                <Field label={actionDialog.action === "denied" ? "Motivo del rechazo" : "Notas (opcional)"}>
                  <Textarea
                    value={decisionNotes}
                    onChange={(_, d) => setDecisionNotes(d.value)}
                    placeholder={
                      actionDialog.action === "denied"
                        ? "Indica el motivo del rechazo..."
                        : "Notas adicionales..."
                    }
                    resize="vertical"
                    rows={3}
                  />
                </Field>
              </div>
            </DialogContent>

            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setActionDialog({ open: false, vale: null, action: null })}
                disabled={saving}
              >
                Cancelar
              </Button>
              {actionDialog.action === "paid" ? (
                <Button
                  appearance="primary"
                  onClick={handleDecide}
                  disabled={saving}
                  icon={saving ? <Spinner size="tiny" /> : <CheckmarkCircleRegular />}
                  style={{ backgroundColor: "#059669", borderColor: "#059669" }}
                >
                  {saving ? "Procesando..." : "Confirmar Aprobación"}
                </Button>
              ) : (
                <Button
                  appearance="primary"
                  onClick={handleDecide}
                  disabled={saving}
                  icon={saving ? <Spinner size="tiny" /> : <DismissCircleRegular />}
                  style={{ backgroundColor: "#dc2626", borderColor: "#dc2626" }}
                >
                  {saving ? "Procesando..." : "Confirmar Rechazo"}
                </Button>
              )}
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Assign Vale Dialog */}
      <Dialog
        open={assignDialog}
        onOpenChange={(_, data) => {
          if (!data.open) setAssignDialog(false);
        }}
      >
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle
              action={
                <Button
                  appearance="subtle"
                  aria-label="cerrar"
                  icon={<Dismiss24Regular />}
                  onClick={() => setAssignDialog(false)}
                />
              }
            >
              Registrar Vale a Chofer
            </DialogTitle>

            <DialogContent>
              <div className={styles.dialogForm}>
                <Field label="Chofer" required>
                  <Dropdown
                    placeholder="Selecciona un chofer"
                    selectedOptions={assignForm.driver_id > 0 ? [String(assignForm.driver_id)] : []}
                    value={
                      drivers.find((d) => d.id === assignForm.driver_id)
                        ? (drivers.find((d) => d.id === assignForm.driver_id)?.display_name ||
                           `${drivers.find((d) => d.id === assignForm.driver_id)?.name} ${drivers.find((d) => d.id === assignForm.driver_id)?.first_lastname}`)
                        : ""
                    }
                    onOptionSelect={(_, d) =>
                      setAssignForm((prev) => ({ ...prev, driver_id: Number(d.optionValue) || 0 }))
                    }
                  >
                    {drivers.map((d) => (
                      <Option key={d.id} value={String(d.id)}>
                        {d.display_name || `${d.name} ${d.first_lastname}`}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>

                <Field label="Monto" required>
                  <Input
                    type="number"
                    contentBefore={<Text>$</Text>}
                    value={assignForm.amount}
                    onChange={(_, d) =>
                      setAssignForm((prev) => ({ ...prev, amount: d.value }))
                    }
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                  />
                </Field>

                <Field label="Tipo de pago" required>
                  <Dropdown
                    value={assignForm.payment_type}
                    onOptionSelect={(_, d) =>
                      setAssignForm((prev) => ({
                        ...prev,
                        payment_type: (d.optionValue as ValePaymentType) || "Efectivo",
                      }))
                    }
                  >
                    <Option value="Efectivo">Efectivo</Option>
                    <Option value="Transferencia">Transferencia</Option>
                  </Dropdown>
                </Field>

                <Field label="Notas (opcional)">
                  <Textarea
                    value={assignForm.decision_notes}
                    onChange={(_, d) =>
                      setAssignForm((prev) => ({ ...prev, decision_notes: d.value }))
                    }
                    placeholder="Notas adicionales..."
                    resize="vertical"
                    rows={3}
                  />
                </Field>
              </div>
            </DialogContent>

            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setAssignDialog(false)}
                disabled={assignSaving}
              >
                Cancelar
              </Button>
              <Button
                appearance="primary"
                onClick={handleAssignVale}
                disabled={assignSaving || !assignForm.driver_id || !assignForm.amount}
                icon={assignSaving ? <Spinner size="tiny" /> : <CheckmarkCircleRegular />}
                style={{ backgroundColor: "#1a2e47", borderColor: "#1a2e47" }}
              >
                {assignSaving ? "Registrando..." : "Registrar Vale"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
