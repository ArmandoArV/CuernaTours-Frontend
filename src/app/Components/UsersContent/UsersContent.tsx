"use client";

import { useState, useMemo } from "react";
import {
  Button,
  Badge,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  Field,
  Input,
  Dropdown,
  Option,
  Spinner,
  SearchBox,
} from "@fluentui/react-components";
import {
  PersonAddRegular,
  ArrowClockwiseRegular,
  PeopleRegular,
  PersonAvailableRegular,
  PersonProhibitedRegular,
  ShieldPersonRegular,
  MailRegular,
  PhoneRegular,
  PersonEditRegular,
  DeleteRegular,
  ChevronRightRegular,
} from "@fluentui/react-icons";
import LoadingComponent from "../LoadingComponent/LoadingComponent";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import { useAsyncData } from "@/app/hooks/useAsyncData";
import { useRouter } from "next/navigation";
import { usersService, type Role } from "@/services/api";
import { getRoleName } from "@/app/hooks/useUserRole";
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmAlert,
} from "@/app/Utils/AlertUtil";
import type { User } from "@/app/backend_models/user.model";
import styles from "./UsersContent.module.css";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("UsersContent");

const ROLE_COLORS: Record<number, "brand" | "danger" | "important" | "informative" | "severe" | "subtle" | "success" | "warning"> = {
  1: "danger",
  2: "severe",
  3: "informative",
  4: "warning",
};

const ROLE_ICONS: Record<number, string> = {
  1: "👑",
  2: "🛡️",
  3: "🚐",
  4: "📋",
};

export default function UsersContent() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    name: "",
    first_lastname: "",
    second_lastname: "",
    email: "",
    password: "",
    role_id: 0,
    country_code: "+52",
    phone: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const {
    data: users,
    loading,
    error,
    refresh,
  } = useAsyncData<User[]>(() => usersService.getAll(), [], []);

  const {
    data: roles,
  } = useAsyncData<Role[]>(() => usersService.getRoles(), [], []);

  // Dashboard stats
  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === "active").length;
    const inactive = users.length - active;
    const byRole: Record<number, number> = {};
    users.forEach((u) => {
      byRole[u.role_id] = (byRole[u.role_id] || 0) + 1;
    });
    return { total: users.length, active, inactive, byRole };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    let result = users;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.first_lastname?.toLowerCase().includes(q) ||
          u.second_lastname?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.includes(q)
      );
    }

    if (roleFilter !== "all") {
      result = result.filter((u) => u.role_id === Number(roleFilter));
    }

    if (statusFilter !== "all") {
      result = result.filter((u) => u.status === statusFilter);
    }

    return result;
  }, [users, searchQuery, roleFilter, statusFilter]);

  const updateForm = (key: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Requerido";
    if (!formData.first_lastname.trim()) errs.first_lastname = "Requerido";
    if (!formData.email.trim()) errs.email = "Requerido";
    if (!formData.password.trim()) errs.password = "Requerido";
    if (!formData.role_id) errs.role_id = "Selecciona un rol";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openCreateDialog = () => {
    setFormData({
      name: "",
      first_lastname: "",
      second_lastname: "",
      email: "",
      password: "",
      role_id: 0,
      country_code: "+52",
      phone: "",
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await usersService.create(formData);
      showSuccessAlert("Usuario creado", "El nuevo usuario fue creado correctamente");
      setDialogOpen(false);
      refresh();
    } catch (err: any) {
      showErrorAlert("Error", err?.message || "No se pudo crear el usuario");
    } finally {
      setSaving(false);
    }
  };

  const handleUserClick = (user: User) => {
    router.push(`/users/${user.user_id}`);
  };

  const handleToggleStatus = async (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    const newStatus = user.status === "active" ? "inactive" : "active";
    const label = newStatus === "active" ? "activar" : "desactivar";
    showConfirmAlert(
      `¿${label.charAt(0).toUpperCase() + label.slice(1)} usuario?`,
      `¿Estás seguro de ${label} a ${user.name} ${user.first_lastname}?`,
      newStatus === "active" ? "Activar" : "Desactivar",
      async () => {
        try {
          await usersService.update(user.user_id, { status: newStatus } as any);
          showSuccessAlert("Actualizado", `Usuario ${newStatus === "active" ? "activado" : "desactivado"} correctamente`);
          refresh();
        } catch (err: any) {
          showErrorAlert("Error", err?.message || "No se pudo actualizar el estado");
        }
      }
    );
  };

  const getFullName = (u: User) =>
    [u.name, u.first_lastname, u.second_lastname].filter(Boolean).join(" ");

  const getInitials = (u: User) => {
    const first = u.name?.charAt(0) || "";
    const last = u.first_lastname?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
  };

  if (loading) {
    return <LoadingComponent message="Cargando usuarios..." />;
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
          <h1 className={styles.title}>Panel de Usuarios</h1>
          <p className={styles.subtitle}>
            Administra y gestiona todos los usuarios del sistema
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
            icon={<PersonAddRegular />}
            className={styles.createButton}
            onClick={openCreateDialog}
          >
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} data-color="brand">
            <PeopleRegular />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Total Usuarios</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} data-color="success">
            <PersonAvailableRegular />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.active}</span>
            <span className={styles.statLabel}>Activos</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} data-color="danger">
            <PersonProhibitedRegular />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.inactive}</span>
            <span className={styles.statLabel}>Inactivos</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} data-color="warning">
            <ShieldPersonRegular />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              {Object.keys(stats.byRole).length}
            </span>
            <span className={styles.statLabel}>Roles</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={styles.filtersBar}>
        <div className={styles.searchContainer}>
          <SearchBox
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchQuery}
            onChange={(_, d) => setSearchQuery(d.value)}
            className={styles.searchBox}
          />
        </div>
        <div className={styles.filterGroup}>
          <Dropdown
            placeholder="Todos los roles"
            value={roleFilter === "all" ? "Todos los roles" : getRoleName(Number(roleFilter))}
            onOptionSelect={(_, d) => setRoleFilter(d.optionValue as string)}
            className={styles.filterDropdown}
          >
            <Option value="all">Todos los roles</Option>
            {roles.map((r) => (
              <Option key={r.role_id} value={String(r.role_id)}>
                {r.name}
              </Option>
            ))}
          </Dropdown>
          <Dropdown
            placeholder="Todos los estados"
            value={
              statusFilter === "all"
                ? "Todos los estados"
                : statusFilter === "active"
                ? "Activo"
                : "Inactivo"
            }
            onOptionSelect={(_, d) => setStatusFilter(d.optionValue as string)}
            className={styles.filterDropdown}
          >
            <Option value="all">Todos los estados</Option>
            <Option value="active">Activo</Option>
            <Option value="inactive">Inactivo</Option>
          </Dropdown>
        </div>
      </div>

      {/* Results count */}
      <div className={styles.resultsInfo}>
        <span>
          Mostrando {filteredUsers.length} de {users.length} usuarios
        </span>
        {(searchQuery || roleFilter !== "all" || statusFilter !== "all") && (
          <Button
            appearance="subtle"
            size="small"
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("all");
              setStatusFilter("all");
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* User Cards Grid */}
      {filteredUsers.length === 0 ? (
        <div className={styles.emptyState}>
          <PeopleRegular className={styles.emptyIcon} />
          <h3>No se encontraron usuarios</h3>
          <p>Intenta ajustar los filtros o crea un nuevo usuario</p>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {filteredUsers.map((user) => (
            <div
              key={user.user_id}
              className={styles.userCard}
              onClick={() => handleUserClick(user)}
            >
              <div className={styles.cardHeader}>
                <div
                  className={styles.cardAvatar}
                  data-status={user.status}
                >
                  {user.picture_url ? (
                    <img src={user.picture_url} alt={user.name} />
                  ) : (
                    getInitials(user)
                  )}
                </div>
                <Badge
                  appearance="tint"
                  color={user.status === "active" ? "success" : "danger"}
                  size="small"
                  className={styles.statusBadge}
                >
                  {user.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.cardName}>{getFullName(user)}</h3>
                <div className={styles.cardRole}>
                  <span className={styles.roleEmoji}>
                    {ROLE_ICONS[user.role_id] || "👤"}
                  </span>
                  <Badge
                    appearance="tint"
                    color={ROLE_COLORS[user.role_id] || "informative"}
                    size="small"
                  >
                    {getRoleName(user.role_id)}
                  </Badge>
                </div>

                <div className={styles.cardDetails}>
                  {user.email && (
                    <div className={styles.cardDetail}>
                      <MailRegular className={styles.detailIcon} />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className={styles.cardDetail}>
                      <PhoneRegular className={styles.detailIcon} />
                      <span>
                        {user.country_code || "+52"} {user.phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.cardActions}>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<PersonEditRegular />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserClick(user);
                  }}
                >
                  Editar
                </Button>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={
                    user.status === "active" ? (
                      <PersonProhibitedRegular />
                    ) : (
                      <PersonAvailableRegular />
                    )
                  }
                  onClick={(e) => handleToggleStatus(e, user)}
                >
                  {user.status === "active" ? "Desactivar" : "Activar"}
                </Button>
                <ChevronRightRegular className={styles.cardArrow} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(_, d) => setDialogOpen(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogContent>
              <div className={styles.dialogForm}>
                <div className={styles.dialogRow}>
                  <Field
                    label="Nombre"
                    required
                    validationMessage={formErrors.name}
                  >
                    <Input
                      value={formData.name}
                      onChange={(_, d) => updateForm("name", d.value)}
                    />
                  </Field>
                  <Field
                    label="Apellido Paterno"
                    required
                    validationMessage={formErrors.first_lastname}
                  >
                    <Input
                      value={formData.first_lastname}
                      onChange={(_, d) => updateForm("first_lastname", d.value)}
                    />
                  </Field>
                </div>

                <div className={styles.dialogRow}>
                  <Field label="Apellido Materno">
                    <Input
                      value={formData.second_lastname}
                      onChange={(_, d) => updateForm("second_lastname", d.value)}
                    />
                  </Field>
                  <Field
                    label="Email"
                    required
                    validationMessage={formErrors.email}
                  >
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(_, d) => updateForm("email", d.value)}
                    />
                  </Field>
                </div>

                <Field
                  label="Contraseña"
                  required
                  validationMessage={formErrors.password}
                >
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(_, d) => updateForm("password", d.value)}
                  />
                </Field>

                <div className={styles.dialogRow}>
                  <Field
                    label="Rol"
                    required
                    validationMessage={formErrors.role_id}
                  >
                    <Dropdown
                      value={
                        roles.find((r) => r.role_id === formData.role_id)?.name || ""
                      }
                      placeholder="Seleccionar rol"
                      onOptionSelect={(_, d) =>
                        updateForm("role_id", Number(d.optionValue))
                      }
                    >
                      {roles.map((r) => (
                        <Option key={r.role_id} value={String(r.role_id)}>
                          {r.name}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                  <Field label="Teléfono">
                    <Input
                      value={formData.phone}
                      onChange={(_, d) => updateForm("phone", d.value)}
                    />
                  </Field>
                </div>

                <div className={styles.dialogActions}>
                  <Button
                    appearance="secondary"
                    onClick={() => setDialogOpen(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    appearance="primary"
                    onClick={handleSave}
                    disabled={saving}
                    icon={saving ? <Spinner size="tiny" /> : undefined}
                    className={styles.createButton}
                  >
                    Crear Usuario
                  </Button>
                </div>
              </div>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}