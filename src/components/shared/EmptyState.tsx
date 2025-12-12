import React from 'react';

interface EmptyStateProps {
    icon?: string;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon = '📁',
    title,
    description,
    actionLabel,
    onAction,
}) => {
    return (
        <div className="nes-container is-dark shadow-hard text-center py-12">
            <div className="text-6xl mb-4">{icon}</div>
            <h3 className="text-xl mb-2">{title}</h3>
            <p className="text-sm text-nes-gray mb-6">{description}</p>
            {actionLabel && onAction && (
                <button className="nes-btn is-primary btn-pixel" onClick={onAction}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
