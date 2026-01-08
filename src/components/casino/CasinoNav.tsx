import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const CasinoNav = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="casino-header">
      <button 
        onClick={() => navigate("/")}
        className="casino-logo"
      >
        Game<span className="casino-logo-accent">Hub</span>
      </button>

      <div className="flex items-center gap-4">
        {user ? (
          <button
            onClick={() => navigate("/profile")}
            className="btn-minimal text-sm"
          >
            Profile
          </button>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="btn-minimal text-sm"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default CasinoNav;
