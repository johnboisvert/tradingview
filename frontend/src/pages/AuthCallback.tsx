import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from "@/components/Footer";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Process auth callback - in production this would handle OAuth tokens
    // For now, redirect to home after a brief delay
    const timer = setTimeout(() => {
      navigate('/');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Traitement de l'authentification...</p>
      </div>
    </div>
  );
}