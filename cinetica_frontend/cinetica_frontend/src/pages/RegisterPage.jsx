import { useState } from "react";
import api from "../api/client";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await api.post("/register/", { username, email, password });
      nav("/login");
    } catch {
      setErr("No se pudo registrar. Prueba otro usuario.");
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Crear cuenta</h1>
        <input placeholder="Usuario" value={username} onChange={(e)=>setUsername(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input placeholder="Contraseña" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        {err && <p className="error">{err}</p>}
        <button className="btn primary">Registrarme</button>
        <p className="muted">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </form>
    </div>
  );
}
