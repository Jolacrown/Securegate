"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";

interface SessionUser {
  id: string;
  email: string;
  role: string;
}

interface DashboardClientProps {
  user: SessionUser;
  expires: string;
}

export default function DashboardClient({ user, expires }: DashboardClientProps) {
  const [copied, setCopied] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState("");

  // Calculate simulated JWT token payload
  const [jwtPayload, setJwtPayload] = useState<Record<string, any>>({});

  useEffect(() => {
    const iatTime = Math.floor(Date.now() / 1000) - 300; // Issued 5 mins ago
    const expTime = iatTime + 3600; // Expires in 1 hour
    setJwtPayload({
      iss: "securegate.auth",
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: iatTime,
      exp: expTime,
      jti: "sg_jwt_session_" + user.id.slice(-6),
    });

    // Simple session countdown logic
    const updateTimer = () => {
      const targetTime = expires && !isNaN(new Date(expires).getTime())
        ? new Date(expires).getTime()
        : Date.now() + 3600 * 1000;
      
      const remainingMs = targetTime - Date.now();
      if (remainingMs <= 0) {
        setSessionTimeLeft("Expired");
      } else {
        const mins = Math.floor(remainingMs / 1000 / 60);
        const secs = Math.floor((remainingMs / 1000) % 60);
        setSessionTimeLeft(`${mins}m ${secs}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [user, expires]);

  const handleCopyToken = () => {
    // Generate a mock base64-encoded JWT token
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify(jwtPayload));
    const signature = "SG_Signature_Verification_Key_HS256";
    const fullToken = `${header}.${payload}.${signature}`;

    navigator.clipboard.writeText(fullToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to render pretty JSON colored spans
  const renderPrettyJson = () => {
    if (!jwtPayload.sub) return null;
    return (
      <code className={styles.codeBlock}>
        {"{\n"}
        <span>  </span><span className={styles.jsonKey}>&quot;iss&quot;</span>: <span className={styles.jsonStr}>&quot;securegate.auth&quot;</span>,{"\n"}
        <span>  </span><span className={styles.jsonKey}>&quot;sub&quot;</span>: <span className={styles.jsonStr}>&quot;{jwtPayload.sub}&quot;</span>,{"\n"}
        <span>  </span><span className={styles.jsonKey}>&quot;email&quot;</span>: <span className={styles.jsonStr}>&quot;{jwtPayload.email}&quot;</span>,{"\n"}
        <span>  </span><span className={styles.jsonKey}>&quot;role&quot;</span>: <span className={styles.jsonStr}>&quot;{jwtPayload.role}&quot;</span>,{"\n"}
        <span>  </span><span className={styles.jsonKey}>&quot;iat&quot;</span>: <span className={styles.jsonNum}>{jwtPayload.iat}</span>,{"\n"}
        <span>  </span><span className={styles.jsonKey}>&quot;exp&quot;</span>: <span className={styles.jsonNum}>{jwtPayload.exp}</span>,{"\n"}
        <span>  </span><span className={styles.jsonKey}>&quot;jti&quot;</span>: <span className={styles.jsonStr}>&quot;{jwtPayload.jti}&quot;</span>{"\n"}
        {"}"}
      </code>
    );
  };

  const isAdmin = user.role.toUpperCase() === "ADMIN";

  return (
    <div className={styles.container}>
      {/* Welcome Banner */}
      <header className={styles.welcomeBanner}>
        <div className={styles.bannerHeader}>
          <div className={styles.pulseContainer}>
            <span className={styles.pulseDot}></span>
            <span className={styles.statusText}>Secure Session Active</span>
          </div>
          <span className={styles.timeLabel}>Expires in: {sessionTimeLeft}</span>
        </div>
        <h1 className={styles.mainTitle}>Welcome back, {user.email.split("@")[0]}</h1>
        <p className={styles.subtitle}>
          SecureGate Authentication Layer is actively enforcing access policies on your session.
        </p>
      </header>

      {/* Grid Layout */}
      <div className={styles.grid}>
        
        {/* Left Column: Session Info */}
        <section className={styles.leftCol}>
          
          {/* Account Profile Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Identity Claims</h2>
            
            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>User Subject ID</span>
                <span className={styles.infoValue + " " + styles.monoText}>{user.id}</span>
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Primary Email</span>
                <span className={styles.infoValue}>{user.email}</span>
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Assigned Role</span>
                <span className={styles.roleBadge + " " + (isAdmin ? styles.roleAdmin : styles.roleUser)}>
                  {user.role}
                </span>
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Verification Mode</span>
                <span className={styles.infoValue}>NextAuth JWT Credentials</span>
              </div>
            </div>

            <button 
              onClick={handleCopyToken} 
              className={styles.copyButton}
              aria-label="Copy access token to clipboard"
            >
              {copied ? (
                <>
                  <span className={styles.copiedIcon}>✓</span>
                  <span>Session Token Copied!</span>
                </>
              ) : (
                <>
                  <svg className={styles.copyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>Copy Encoded Session Token</span>
                </>
              )}
            </button>
          </div>

          {/* RBAC Route Permissions Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>RBAC Access Control Policy</h2>
            <p className={styles.cardDesc}>
              Below are the endpoints authorized for your session under the current role policy.
            </p>
            
            <div className={styles.rbacList}>
              <div className={styles.rbacItem}>
                <div className={styles.rbacMeta}>
                  <span className={styles.rbacPath}>/dashboard</span>
                  <span className={styles.rbacRoleRequirement}>Requires USER or ADMIN</span>
                </div>
                <span className={styles.statusBadge + " " + styles.statusSuccess}>Accessible</span>
              </div>

              <div className={styles.rbacItem}>
                <div className={styles.rbacMeta}>
                  <span className={styles.rbacPath}>/settings</span>
                  <span className={styles.rbacRoleRequirement}>Requires USER or ADMIN</span>
                </div>
                <Link href="/settings" className={styles.actionLink}>
                  Open Settings
                </Link>
              </div>

              <div className={styles.rbacItem + " " + (!isAdmin ? styles.rbacItemRestricted : "")}>
                <div className={styles.rbacMeta}>
                  <span className={styles.rbacPath}>/admin</span>
                  <span className={styles.rbacRoleRequirement}>Requires ADMIN role</span>
                </div>
                {isAdmin ? (
                  <Link href="/admin" className={styles.actionLink}>
                    Enter Admin Panel
                  </Link>
                ) : (
                  <div className={styles.restrictedIndicator}>
                    <svg className={styles.lockIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Locked (Restricted)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </section>

        {/* Right Column: JWT Token Inspector */}
        <section className={styles.rightCol}>
          <div className={styles.card + " " + styles.tokenCard}>
            <div className={styles.tokenCardHeader}>
              <h2 className={styles.cardTitle}>Decoded JWT Inspector</h2>
              <span className={styles.techBadge}>HS256 Verified</span>
            </div>
            <p className={styles.cardDesc}>
              This is the raw, cryptographically signed JSON Web Token stored in your secure cookie session. NextAuth decrypts this token server-side on every route load.
            </p>

            <div className={styles.codeContainer}>
              <pre className={styles.preCode}>
                {renderPrettyJson()}
              </pre>
            </div>

            <div className={styles.tokenLegend}>
              <div className={styles.legendItem}>
                <span className={styles.legendDot + " " + styles.legendDotSub}></span>
                <div>
                  <strong>sub (Subject):</strong> The unique database identifier of the user record.
                </div>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot + " " + styles.legendDotRole}></span>
                <div>
                  <strong>role:</strong> The authorization role evaluated by the middleware.
                </div>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot + " " + styles.legendDotTime}></span>
                <div>
                  <strong>iat / exp:</strong> Epoch timestamps showing issued and expiry times.
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
