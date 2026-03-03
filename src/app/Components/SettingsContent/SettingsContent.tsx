"use client";
import { useState } from "react";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("SettingsContent");

export default function SettingsContent() {
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [companyName, setCompanyName] = useState("Cuerna Tours");
  const [contactEmail, setContactEmail] = useState("info@cuernatours.com");

  const handleSaveSettings = () => {
    // Here you would save the settings to your backend
    log.info("Saving settings:", {
      allowRegistration,
      emailNotifications,
      maintenanceMode,
      companyName,
      contactEmail
    });
    alert("Configuración guardada exitosamente");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Configuración del Sistema</h1>
      <div style={{ 
        backgroundColor: "white", 
        padding: "20px", 
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>
        <h2>Configuraciones Generales</h2>
        <div style={{ marginBottom: "15px" }}>
          <label>
            <input 
              type="checkbox" 
              checked={allowRegistration}
              onChange={(e) => setAllowRegistration(e.target.checked)}
              style={{ marginRight: "10px" }} 
            />
            Permitir registro de nuevos usuarios
          </label>
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label>
            <input 
              type="checkbox" 
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              style={{ marginRight: "10px" }} 
            />
            Enviar notificaciones por email
          </label>
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label>
            <input 
              type="checkbox" 
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              style={{ marginRight: "10px" }} 
            />
            Modo de mantenimiento
          </label>
        </div>
      </div>

      <div style={{ 
        backgroundColor: "white", 
        padding: "20px", 
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <h2>Configuración de la Empresa</h2>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Nombre de la Empresa:
          </label>
          <input 
            type="text" 
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Email de Contacto:
          </label>
          <input 
            type="email" 
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          />
        </div>
        
        <button 
          onClick={handleSaveSettings}
          style={{
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginTop: "20px"
          }}
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}