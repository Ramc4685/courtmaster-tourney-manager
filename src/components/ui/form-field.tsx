import React from 'react';
import { Input } from './input';
import { Label } from './label';
import { FormMessage } from './form';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormField({ label, error, ...props }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id || props.name}>{label}</Label>
      <Input {...props} />
      {error && <FormMessage>{error}</FormMessage>}
    </div>
  );
} 