
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
    title: string;
    showBack?: boolean;
    rightContent?: React.ReactNode;
}

export default function PageHeader({ title, showBack = true, rightContent }: Props) {
    const navigate = useNavigate();

    return (
        <div className="sticky top-0 z-30 bg-[var(--ios-bg)]/90 backdrop-blur-xl border-b border-[var(--ios-separator)] px-4 h-[56px] grid grid-cols-[40px_1fr_40px] items-center shrink-0">
            {/* Левая часть */}
            <div className="flex justify-start">
                {showBack && (
                    <button 
                        onClick={() => navigate(-1)} 
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--ios-card)] border border-[var(--ios-separator)] text-[var(--ios-text)] active:scale-90 transition-transform"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Центр */}
            <div className="flex justify-center items-center">
                <h1 className="text-[17px] font-bold text-[var(--ios-text)] truncate text-center leading-none">{title}</h1>
            </div>

            {/* Правая часть */}
            <div className="flex justify-end items-center">
                {rightContent}
            </div>
        </div>
    );
}
