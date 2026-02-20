import React, { useState, useEffect } from 'react';
import type { User } from '../../types';

interface AvatarProps {
    user?: User | any; // Allow 'any' to access user_metadata flexible poperties
    url?: string;
    alt?: string;
    size?: string;
    className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ user, url, alt, size = "w-8 h-8", className = "" }) => {
    const [imgError, setImgError] = useState(false);
    const [imgSrc, setImgSrc] = useState<string | null>(null);

    // Determine priority source
    useEffect(() => {
        let source = null;
        if (url) source = url;
        else if (user?.avatarUrl) source = user.avatarUrl;
        else if (user?.user_metadata?.avatar_url) source = user.user_metadata.avatar_url;
        else if (user?.user_metadata?.picture) source = user.user_metadata.picture;

        setImgSrc(source);
        setImgError(false); // Reset error when source changes
    }, [url, user]);

    // Fallback: Initials
    const name = user?.name || alt || "?";
    const initial = name.charAt(0).toUpperCase();

    const bgColor = user?.avatarColor || "bg-gray-600";

    if (imgSrc && !imgError) {
        return (
            <img
                src={imgSrc}
                alt={name}
                className={`${size} rounded-full object-cover shadow-md ${className}`}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
            />
        );
    }

    return (
        <div className={`${size} rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-xs shadow-md border border-white/10 ${className}`}>
            {initial}
        </div>
    );
};
