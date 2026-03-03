"use client";

import { useState, useMemo } from "react";
import {
  Button,
  Badge,
  Field,
  Input,
  Spinner,
  Dropdown,
  Option,
} from "@fluentui/react-components";
import {
  EditRegular,
  SaveRegular,
  DismissRegular,
  PersonRegular,
  CallRegular,
  ShieldKeyholeRegular,
  HeartPulseRegular,
  ArrowLeftRegular,
} from "@fluentui/react-icons";
import LoadingComponent from "@/app/Components/LoadingComponent/LoadingComponent";
import { useAsyncData } from "@/app/hooks/useAsyncData";
import { useDriverId } from "@/app/hooks/useDriverId";
import { useUserRole, getRoleName } from "@/app/hooks/useUserRole";
import { usersService, type Role } from "@/services/api";
import { showSuccessAlert, showErrorAlert } from "@/app/Utils/AlertUtil";
import type { User } from "@/app/backend_models/user.model";
import { useRouter } from "next/navigation";
import styles from "./ProfileContent.module.css";

const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

interface ProfileContentProps {
  /** When provided, loads this user instead of the logged-in user (admin view) */
  userId?: number;
}

export default function ProfileContent({ userId }: ProfileContentProps) {
  const { driverId, loading: idLoading } = useDriverId();
  const roleInfo = useUserRole();

  const targetUserId = userId ?? driverId;
  const isAdminView = !!userId;

  const {
    data: user,
    loading,
    error,
    refresh,
  } = useAsyncData<User | null>(
    () => (targetUserId ? usersService.getById(targetUserId) : Promise.resolve(null)),
    null,
    [targetUserId],
  );

  const {
    data: roles,
  } = useAsyncData<Role[]>(
    () => (roleInfo.hasFullAccess ? usersService.getRoles() : Promise.resolve([])),
    [],
    [roleInfo.hasFullAccess],
  );

  const [editSection, setEditSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const initials = useMemo(() => {
    if (!user) return "?";
    const first = user.name?.charAt(0) || "";
    const last = user.first_lastname?.charAt(0) || "";
    return (first + last).toUpperCase();
  }, [user]);

  const fullName = useMemo(() => {
    if (!user) return "";
    return [user.name, user.first_lastname, user.second_lastname]
      .filter(Boolean)
      .join(" ");
  }, [user]);

  // All users can edit their own personal & contact info; admins can edit everything
  const isOwnProfile = !isAdminView;
  const canEditPersonal = isOwnProfile || roleInfo.hasFullAccess;
  const canEditContact = isOwnProfile || roleInfo.hasFullAccess;
  const canEditRole = roleInfo.hasFullAccess;
  const canEditMedical = roleInfo.hasFullAccess;
  const canEditIds = roleInfo.hasFullAccess;

  const startEdit = (section: string, fields: Record<string, string>) => {
    setEditSection(section);
    setEditData(fields);
  };

  const cancelEdit = () => {
    setEditSection(null);
    setEditData({});
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await usersService.update(user.user_id, editData);
      showSuccessAlert("Perfil actualizado", "Los cambios se guardaron correctamente");
      cancelEdit();
      refresh();
    } catch (err: any) {
      showErrorAlert("Error", err?.message || "No se pudo actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setEditData((prev) => ({ ...prev, [key]: value }));
  };

  const router = useRouter();

  if (idLoading || loading || roleInfo.isLoading) {
    return <LoadingComponent message="Cargando perfil..." />;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p style={{ color: "red" }}>Error: {error}</p>
        <Button onClick={refresh}>Reintentar</Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <p>No se encontró la información del usuario.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          {isAdminView && (
            <Button
              appearance="subtle"
              icon={<ArrowLeftRegular />}
              onClick={() => router.push("/users")}
              style={{ marginBottom: "0.5rem", alignSelf: "flex-start" }}
            >
              Volver a Usuarios
            </Button>
          )}
          <h1 className={styles.title}>
            {isAdminView ? "Perfil de Usuario" : "Mi Perfil"}
          </h1>
          <p className={styles.subtitle}>
            {isAdminView
              ? "Gestión de información del usuario"
              : "Información de tu cuenta"}
          </p>
        </div>
      </div>

      {/* Profile card */}
      <div className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>{initials}</div>
          <Badge
            appearance="filled"
            color="informative"
            size="medium"
          >
            {getRoleName(user.role_id)}
          </Badge>
        </div>
        <div className={styles.profileMainInfo}>
          <h2 className={styles.profileName}>{fullName}</h2>
          <p className={styles.profileEmail}>{user.email}</p>
          <Badge
            appearance="tint"
            color={user.status === "active" ? "success" : "danger"}
            size="small"
          >
            {user.status === "active" ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </div>

      {/* Personal Info */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <PersonRegular /> Información Personal
          </h3>
          {canEditPersonal && editSection !== "personal" && (
            <Button
              appearance="subtle"
              icon={<EditRegular />}
              onClick={() =>
                startEdit("personal", {
                  name: user.name || "",
                  first_lastname: user.first_lastname || "",
                  second_lastname: user.second_lastname || "",
                  email: user.email || "",
                })
              }
            >
              Editar
            </Button>
          )}
        </div>

        {editSection === "personal" ? (
          <>
            <div className={styles.formGrid}>
              <Field label="Nombre">
                <Input
                  value={editData.name || ""}
                  onChange={(_, d) => updateField("name", d.value)}
                />
              </Field>
              <Field label="Apellido Paterno">
                <Input
                  value={editData.first_lastname || ""}
                  onChange={(_, d) => updateField("first_lastname", d.value)}
                />
              </Field>
              <Field label="Apellido Materno">
                <Input
                  value={editData.second_lastname || ""}
                  onChange={(_, d) => updateField("second_lastname", d.value)}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={editData.email || ""}
                  onChange={(_, d) => updateField("email", d.value)}
                />
              </Field>
            </div>
            <div className={styles.formActions}>
              <Button
                appearance="secondary"
                icon={<DismissRegular />}
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                appearance="primary"
                icon={saving ? <Spinner size="tiny" /> : <SaveRegular />}
                onClick={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: "var(--Main-96781A, #96781a)",
                  borderColor: "var(--Main-96781A, #96781a)",
                }}
              >
                Guardar
              </Button>
            </div>
          </>
        ) : (
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Nombre</span>
              <span className={styles.infoValue}>{user.name || "—"}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Apellido Paterno</span>
              <span className={styles.infoValue}>{user.first_lastname || "—"}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Apellido Materno</span>
              <span className={styles.infoValue}>{user.second_lastname || "—"}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>{user.email || "—"}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Empresa</span>
              <span className={styles.infoValue}>{user.company || "—"}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Estatus</span>
              <span className={styles.infoValue}>
                {user.status === "active" ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <CallRegular /> Contacto
          </h3>
          {canEditContact && editSection !== "contact" && (
            <Button
              appearance="subtle"
              icon={<EditRegular />}
              onClick={() =>
                startEdit("contact", {
                  country_code: user.country_code || "+52",
                  phone: user.phone || "",
                })
              }
            >
              Editar
            </Button>
          )}
        </div>

        {editSection === "contact" ? (
          <>
            <div className={styles.formGrid}>
              <Field label="Código de País">
                <Input
                  value={editData.country_code || ""}
                  onChange={(_, d) => updateField("country_code", d.value)}
                />
              </Field>
              <Field label="Teléfono">
                <Input
                  value={editData.phone || ""}
                  onChange={(_, d) => updateField("phone", d.value)}
                />
              </Field>
            </div>
            <div className={styles.formActions}>
              <Button
                appearance="secondary"
                icon={<DismissRegular />}
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                appearance="primary"
                icon={saving ? <Spinner size="tiny" /> : <SaveRegular />}
                onClick={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: "var(--Main-96781A, #96781a)",
                  borderColor: "var(--Main-96781A, #96781a)",
                }}
              >
                Guardar
              </Button>
            </div>
          </>
        ) : (
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Teléfono</span>
              <span className={styles.infoValue}>
                {user.phone
                  ? `${user.country_code || "+52"} ${user.phone}`
                  : "—"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Role & Access */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <ShieldKeyholeRegular /> Rol y Acceso
          </h3>
          {canEditRole && editSection !== "role" && (
            <Button
              appearance="subtle"
              icon={<EditRegular />}
              onClick={() =>
                startEdit("role", {
                  role_id: String(user.role_id),
                  status: user.status || "active",
                })
              }
            >
              Editar
            </Button>
          )}
        </div>

        {editSection === "role" ? (
          <>
            <div className={styles.formGrid}>
              <Field label="Rol">
                <Dropdown
                  value={
                    roles.find((r) => r.role_id === Number(editData.role_id))
                      ?.name || ""
                  }
                  placeholder="Seleccionar rol"
                  onOptionSelect={(_, d) =>
                    updateField("role_id", String(d.optionValue))
                  }
                >
                  {roles.map((r) => (
                    <Option key={r.role_id} value={String(r.role_id)}>
                      {r.name}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Estado">
                <Dropdown
                  value={editData.status === "active" ? "Activo" : "Inactivo"}
                  onOptionSelect={(_, d) =>
                    updateField("status", String(d.optionValue))
                  }
                >
                  <Option value="active">Activo</Option>
                  <Option value="inactive">Inactivo</Option>
                </Dropdown>
              </Field>
            </div>
            <div className={styles.formActions}>
              <Button
                appearance="secondary"
                icon={<DismissRegular />}
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                appearance="primary"
                icon={saving ? <Spinner size="tiny" /> : <SaveRegular />}
                onClick={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: "var(--Main-96781A, #96781a)",
                  borderColor: "var(--Main-96781A, #96781a)",
                }}
              >
                Guardar
              </Button>
            </div>
          </>
        ) : (
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Rol</span>
              <span className={styles.infoValue}>
                {getRoleName(user.role_id)}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Coordinador</span>
              <span className={styles.infoValue}>
                {user.is_coordinator ? "Sí" : "No"}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Último acceso</span>
              <span className={styles.infoValue}>
                {user.last_login
                  ? new Date(user.last_login).toLocaleString("es-MX")
                  : "—"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Medical Info — shown for drivers or in admin view */}
      {(roleInfo.isDriverOnly || isAdminView) && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <HeartPulseRegular /> Información Médica
            </h3>
            {canEditMedical && editSection !== "medical" && (
              <Button
                appearance="subtle"
                icon={<EditRegular />}
                onClick={() =>
                  startEdit("medical", {
                    blood_type: user.blood_type || "",
                    allergies: user.allergies || "",
                    diseases: user.diseases || "",
                    vision: user.vision || "",
                    treatment: user.treatment || "",
                  })
                }
              >
                Editar
              </Button>
            )}
          </div>

          {editSection === "medical" ? (
            <>
              <div className={styles.formGrid}>
                <Field label="Tipo de Sangre">
                  <Dropdown
                    value={editData.blood_type || ""}
                    placeholder="Seleccionar"
                    onOptionSelect={(_, d) =>
                      updateField("blood_type", String(d.optionValue))
                    }
                  >
                    {BLOOD_TYPES.map((bt) => (
                      <Option key={bt} value={bt}>
                        {bt}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
                <Field label="Alergias">
                  <Input
                    value={editData.allergies || ""}
                    onChange={(_, d) => updateField("allergies", d.value)}
                  />
                </Field>
                <Field label="Enfermedades">
                  <Input
                    value={editData.diseases || ""}
                    onChange={(_, d) => updateField("diseases", d.value)}
                  />
                </Field>
                <Field label="Visión">
                  <Input
                    value={editData.vision || ""}
                    onChange={(_, d) => updateField("vision", d.value)}
                  />
                </Field>
                <div className={styles.formFieldFull}>
                  <Field label="Tratamiento">
                    <Input
                      value={editData.treatment || ""}
                      onChange={(_, d) => updateField("treatment", d.value)}
                    />
                  </Field>
                </div>
              </div>
              <div className={styles.formActions}>
                <Button
                  appearance="secondary"
                  icon={<DismissRegular />}
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  appearance="primary"
                  icon={saving ? <Spinner size="tiny" /> : <SaveRegular />}
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    backgroundColor: "var(--Main-96781A, #96781a)",
                    borderColor: "var(--Main-96781A, #96781a)",
                  }}
                >
                  Guardar
                </Button>
              </div>
            </>
          ) : (
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Tipo de Sangre</span>
                <span className={styles.infoValue}>
                  {user.blood_type || "—"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Alergias</span>
                <span className={styles.infoValue}>
                  {user.allergies || "—"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Enfermedades</span>
                <span className={styles.infoValue}>
                  {user.diseases || "—"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Visión</span>
                <span className={styles.infoValue}>
                  {user.vision || "—"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Tratamiento</span>
                <span className={styles.infoValue}>
                  {user.treatment || "—"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Government IDs (CURP/RFC) */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <PersonRegular /> Identificación
          </h3>
          {canEditIds && editSection !== "ids" && (
            <Button
              appearance="subtle"
              icon={<EditRegular />}
              onClick={() =>
                startEdit("ids", {
                  rfc: user.rfc || "",
                  curp: user.curp || "",
                })
              }
            >
              Editar
            </Button>
          )}
        </div>

        {editSection === "ids" ? (
          <>
            <div className={styles.formGrid}>
              <Field label="RFC">
                <Input
                  value={editData.rfc || ""}
                  onChange={(_, d) => updateField("rfc", d.value)}
                />
              </Field>
              <Field label="CURP">
                <Input
                  value={editData.curp || ""}
                  onChange={(_, d) => updateField("curp", d.value)}
                />
              </Field>
            </div>
            <div className={styles.formActions}>
              <Button
                appearance="secondary"
                icon={<DismissRegular />}
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                appearance="primary"
                icon={saving ? <Spinner size="tiny" /> : <SaveRegular />}
                onClick={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: "var(--Main-96781A, #96781a)",
                  borderColor: "var(--Main-96781A, #96781a)",
                }}
              >
                Guardar
              </Button>
            </div>
          </>
        ) : (
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>RFC</span>
              <span className={styles.infoValue}>{user.rfc || "—"}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>CURP</span>
              <span className={styles.infoValue}>{user.curp || "—"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}