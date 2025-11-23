import React from 'react';

export default function FormField({ 
    label, 
    name, 
    type = 'text', 
    value, 
    onChange, 
    required = false, 
    placeholder = '',
    error = '',
    options = [], // For select type
    rows = 3 // For textarea
}) {
    const inputClasses = `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
        error ? 'border-red-500' : 'border-gray-300'
    }`;

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" data-testid={`label-${name}`}>
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {type === 'textarea' ? (
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder}
                    rows={rows}
                    className={inputClasses}
                    data-testid={`input-${name}`}
                />
            ) : type === 'select' ? (
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className={inputClasses}
                    data-testid={`select-${name}`}
                >
                    <option value="">Pilih {label}</option>
                    {options.map((opt, idx) => (
                        <option key={idx} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder}
                    className={inputClasses}
                    data-testid={`input-${name}`}
                />
            )}
            
            {error && (
                <p className="mt-1 text-sm text-red-600" data-testid={`error-${name}`}>
                    {error}
                </p>
            )}
        </div>
    );
}