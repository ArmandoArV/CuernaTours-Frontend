"use client";

export default function ProfileContent() {
  const handleEditProfile = () => {
    alert("Editar perfil - esta funcionalidad se implementará próximamente");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Mi Perfil</h1>
      <div style={{ 
        backgroundColor: "white", 
        padding: "20px", 
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <h2>Información Personal</h2>
        <p><strong>Nombre:</strong> Usuario Demo</p>
        <p><strong>Email:</strong> usuario@example.com</p>
        <p><strong>Rol:</strong> Usuario Estándar</p>
        <p><strong>Fecha de Registro:</strong> 01/10/2024</p>
        
        <div style={{ marginTop: "20px" }}>
          <button 
            onClick={handleEditProfile}
            style={{
              padding: "10px 20px",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Editar Perfil
          </button>
        </div>
      </div>
    </div>
  );
}