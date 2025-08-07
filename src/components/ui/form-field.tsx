
import React from "react";
import { Input } from "@/components/ui/input";

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>((
  {
    label,
    error,
    className,
    ...props
  },
  ref
) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input
        ref={ref}
        className={`w-full ${className || ""}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});

FormField.displayName = "FormField";
