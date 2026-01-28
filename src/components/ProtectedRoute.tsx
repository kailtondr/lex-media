import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950 text-purple-500">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
