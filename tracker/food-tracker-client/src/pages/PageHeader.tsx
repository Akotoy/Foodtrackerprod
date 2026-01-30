
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
        <div className="sticky top-0 z-30 bg-tg-bg/80 backdrop-blur-md border-b border-tg-border px-4 h-[60px] grid grid-cols-[40px_1fr_40px] items-center">
            {/* Левая часть: Кнопка Назад */}
            <div>
                {showBack && (
                    <button 
                        onClick={() => navigate(-1)} // Возврат на шаг назад в истории
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-tg-card border border-tg-border active:scale-90 transition-transform text-tg-text"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Центр: Заголовок */}
            <div className="flex justify-center items-center">
                <h1 className="text-lg font-bold text-tg-text truncate text-center">{title}</h1>
            </div>

            {/* Правая часть: Слот для иконок (или пустота) */}
            <div className="flex justify-end">
                {rightContent}
            </div>
        </div>
    );
}
