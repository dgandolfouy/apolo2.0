import React, { useEffect, useState } from 'react';
import { Icons } from './Icons';

interface NotificationModalProps {
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ type, title, message, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const config = {
        success: {
            icon: <Icons.Check size={24} className="text-emerald-500" />,
            color: 'emerald',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20 shadow-emerald-900/20'
        },
        error: {
            icon: <Icons.Close size={24} className="text-pink-500" />,
            color: 'pink',
            bg: 'bg-pink-500/10',
            border: 'border-pink-500/20 shadow-pink-900/20'
        },
        info: {
            icon: <Icons.Info size={24} className="text-indigo-500" />,
            color: 'indigo',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20 shadow-indigo-900/20'
        }
    };

    const current = config[type];

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-[#000]/60 backdrop-blur-sm" onClick={handleClose} />

            <div className={`relative w-full max-w-sm transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-8 pb-6 text-center">
                        <div className={`w-16 h-16 ${current.bg} ${current.border} border rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                            {current.icon}
                        </div>

                        <h3 className="text-xl font-display font-bold text-white mb-2 tracking-wide uppercase">
                            {title}
                        </h3>

                        <p className="text-gray-400 font-light text-sm leading-relaxed px-2">
                            {message}
                        </p>
                    </div>

                    <div className="p-6 pt-0">
                        <button
                            onClick={handleClose}
                            className={`w-full py-4 rounded-2xl font-bold text-sm tracking-widest transition-all uppercase active:scale-[0.98] ${type === 'error'
                                    ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-900/40'
                                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                }`}
                        >
                            {type === 'error' ? 'Cerrar' : 'Aceptar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
