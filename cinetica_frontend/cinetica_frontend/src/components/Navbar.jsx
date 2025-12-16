import { Link, useNavigate } from "react-router-dom";
import { isLoggedIn, logout } from "../auth/auth";

export default function Navbar() {
  const nav = useNavigate();
  const logged = isLoggedIn();

  const onLogout = () => {
    logout();
    nav("/login");
  };

  return (
    <header className="topbar">
      <div className="brand" onClick={() => nav("/")}>🎬 CINETICA</div>

      <div className="top-actions">
        {!logged ? (
          <>
            <Link className="btn" to="/login">Login</Link>
            <Link className="btn primary" to="/register">Register</Link>
          </>
        ) : (
          <button className="btn" onClick={onLogout}>Cerrar sesión</button>
        )}
      </div>
    </header>
  );
}
