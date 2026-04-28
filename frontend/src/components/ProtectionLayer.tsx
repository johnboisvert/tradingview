import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import WatermarkOverlay from './WatermarkOverlay';
import useAntiCopy from '../hooks/useAntiCopy';
import useDevToolsDetection from '../hooks/useDevToolsDetection';

/**
 * ProtectionLayer
 * ---------------
 * Single mount point that wires together:
 *  - Dynamic email watermark (for non-admin logged-in users)
 *  - Right-click + shortcut blocking
 *  - DevTools detection + blur overlay
 *
 * Admins (user.role === 'admin') are fully exempt: no watermark,
 * no input blocking, no DevTools overlay.
 */
const ProtectionLayer: React.FC = () => {
  const { user, isAdmin } = useAuth();

  // Anti-copy protections apply to everyone except admins
  // (even anonymous visitors, so public pages are also protected).
  const protectionsEnabled = !isAdmin;

  useAntiCopy({ enabled: protectionsEnabled });
  const devtoolsOpen = useDevToolsDetection({ enabled: protectionsEnabled });

  // Watermark only shows for connected non-admin users with an email.
  const showWatermark = !isAdmin && !!user?.email;

  return (
    <>
      {showWatermark && <WatermarkOverlay text={user!.email} />}

      {protectionsEnabled && devtoolsOpen && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            backgroundColor: 'rgba(10, 14, 23, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: 520,
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.12)',
              background:
                'linear-gradient(180deg, rgba(139,92,246,0.18), rgba(15,20,32,0.9))',
              padding: '28px 28px 26px',
              color: '#fff',
              boxShadow: '0 20px 60px -10px rgba(139,92,246,0.35)',
            }}
          >
            <div style={{ fontSize: 44, lineHeight: 1 }}>🔒</div>
            <div
              style={{
                marginTop: 12,
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: '-0.01em',
              }}
            >
              Contenu protégé
            </div>
            <p
              style={{
                marginTop: 10,
                fontSize: 14,
                lineHeight: 1.55,
                color: 'rgba(255,255,255,0.78)',
              }}
            >
              Pour des raisons de sécurité et afin de protéger la propriété
              intellectuelle de cryptoia.ca, l&apos;accès au site est suspendu
              tant que les outils de développement (DevTools) sont ouverts.
              <br />
              <br />
              Veuillez <strong>fermer la console / DevTools</strong> pour
              continuer votre navigation.
            </p>
            <div
              style={{
                marginTop: 16,
                fontSize: 11,
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              cryptoia.ca • Protection anti-copie
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProtectionLayer;