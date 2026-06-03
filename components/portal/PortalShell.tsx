import Link from "next/link";
import type { SessionUser } from "@/lib/auth/types";
import { ROLES } from "@/lib/auth/roles";
import { LogoutButton } from "./LogoutButton";

type Props = {
  user: SessionUser;
  children: React.ReactNode;
};

export function PortalShell({ user, children }: Props) {
  const roleMeta = ROLES[user.role];

  return (
    <div className="page-wrap" style={{ paddingTop: "1rem" }}>
      <header
        className="glass"
        style={{
          padding: "1rem 1.25rem",
          marginBottom: "1.25rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--neon-lime)", letterSpacing: "0.14em" }}>
            PORTAL · {roleMeta.label.toUpperCase()}
          </p>
          <h1 style={{ margin: "0.25rem 0 0", fontSize: "1.35rem" }}>{user.name}</h1>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>{user.email}</p>
        </div>
        <nav style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/" className="btn btn-secondary" style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}>
            Site
          </Link>
          {user.role === "admin" && (
            <Link href="/admin" className="btn btn-secondary" style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}>
              Admin
            </Link>
          )}
          <Link href="/painel" className="btn btn-secondary" style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}>
            Mesas
          </Link>
          <Link href="/mesa/demo" className="btn btn-secondary" style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}>
            VTT demo
          </Link>
          <LogoutButton />
        </nav>
      </header>
      {children}
    </div>
  );
}
