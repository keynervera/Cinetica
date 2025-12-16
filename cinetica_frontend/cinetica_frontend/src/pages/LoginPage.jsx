import { useState } from "react";
import api from "../api/client";
import { setTokens } from "../auth/auth";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const res = await api.post("/token/", { username, password });
      setTokens(res.data);
      nav("/");
    } catch {
      setErr("Credenciales inválidas.");
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Iniciar sesión</h1>
        <input placeholder="Usuario" value={username} onChange={(e)=>setUsername(e.target.value)} />
        <input placeholder="Contraseña" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        {err && <p className="error">{err}</p>}
        <button className="btn primary">Entrar</button>
        <p className="muted">¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
      </form>
    </div>
  );
}
