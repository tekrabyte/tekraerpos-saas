import React from 'react';

export default function PageHeader({ title, subtitle, children }) {
    return (
        <div className="mb-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">{title}</h1>
                    {subtitle && (
                        <p className="mt-1 text-sm text-gray-600" data-testid="page-subtitle">{subtitle}</p>
                    )}
                </div>
                {children && (
                    <div data-testid="page-actions">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}