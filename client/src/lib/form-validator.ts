import { useState, useCallback } from 'react';
import { z } from 'zod';

type ValidationRule = {
  type: 'required' | 'email' | 'phone' | 'number' | 'min' | 'max' | 'pattern' | 'custom';
  message: string;
  value?: any;
  validator?: (value: any) => boolean;
};

type FieldRules = {
  [key: string]: ValidationRule[];
};

type ValidationErrors = {
  [key: string]: string[];
};

type FormState = {
  [key: string]: any;
};

type MaskType = 'phone' | 'currency' | 'date' | 'time' | 'custom';

interface MaskConfig {
  type: MaskType;
  pattern?: string;
  placeholder?: string;
  format?: (value: string) => string;
  parse?: (value: string) => string;
}

export class FormValidator {
  private static phoneRegex = /^(?:\+964|0)?7[3-9]\d{8}$/;
  private static emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  static validateField(value: any, rules: ValidationRule[]): string[] {
    const errors: string[] = [];

    for (const rule of rules) {
      switch (rule.type) {
        case 'required':
          if (!value || (typeof value === 'string' && !value.trim())) {
            errors.push(rule.message);
          }
          break;

        case 'email':
          if (value && !this.emailRegex.test(value)) {
            errors.push(rule.message);
          }
          break;

        case 'phone':
          if (value && !this.phoneRegex.test(value)) {
            errors.push(rule.message);
          }
          break;

        case 'number':
          if (value && isNaN(Number(value))) {
            errors.push(rule.message);
          }
          break;

        case 'min':
          if (typeof value === 'number' && value < rule.value) {
            errors.push(rule.message);
          } else if (typeof value === 'string' && value.length < rule.value) {
            errors.push(rule.message);
          }
          break;

        case 'max':
          if (typeof value === 'number' && value > rule.value) {
            errors.push(rule.message);
          } else if (typeof value === 'string' && value.length > rule.value) {
            errors.push(rule.message);
          }
          break;

        case 'pattern':
          if (value && !new RegExp(rule.value).test(value)) {
            errors.push(rule.message);
          }
          break;

        case 'custom':
          if (rule.validator && !rule.validator(value)) {
            errors.push(rule.message);
          }
          break;
      }
    }

    return errors;
  }

  static validateForm(formState: FormState, rules: FieldRules): ValidationErrors {
    const errors: ValidationErrors = {};

    Object.entries(rules).forEach(([field, fieldRules]) => {
      const fieldErrors = this.validateField(formState[field], fieldRules);
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    });

    return errors;
  }

  static createZodSchema(rules: FieldRules): z.ZodObject<any> {
    const schema: { [key: string]: z.ZodTypeAny } = {};

    Object.entries(rules).forEach(([field, fieldRules]) => {
      let fieldSchema: z.ZodTypeAny = z.any();

      fieldRules.forEach((rule) => {
        switch (rule.type) {
          case 'required':
            fieldSchema = z.string().min(1, rule.message);
            break;
          case 'email':
            fieldSchema = z.string().email(rule.message);
            break;
          case 'number':
            fieldSchema = z.number().or(z.string().regex(/^\d+$/).transform(Number));
            break;
          case 'min':
            if (typeof rule.value === 'number') {
              fieldSchema = fieldSchema.min(rule.value, rule.message);
            }
            break;
          case 'max':
            if (typeof rule.value === 'number') {
              fieldSchema = fieldSchema.max(rule.value, rule.message);
            }
            break;
          case 'pattern':
            fieldSchema = z.string().regex(new RegExp(rule.value), rule.message);
            break;
        }
      });

      schema[field] = fieldSchema;
    });

    return z.object(schema);
  }

  static applyMask(value: string, config: MaskConfig): string {
    switch (config.type) {
      case 'phone':
        return this.maskPhone(value);
      case 'currency':
        return this.maskCurrency(value);
      case 'date':
        return this.maskDate(value);
      case 'time':
        return this.maskTime(value);
      case 'custom':
        return config.format ? config.format(value) : value;
      default:
        return value;
    }
  }

  private static maskPhone(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  }

  private static maskCurrency(value: string): string {
    const numberValue = value.replace(/[^\d.]/g, '');
    const parts = numberValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  private static maskDate(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }

  private static maskTime(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  }
}

// هوك مخصص للتحقق من صحة النماذج
export function useFormValidation(initialState: FormState, rules: FieldRules) {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState<{ [key: string]: boolean }>({});

  const validateField = useCallback((field: string, value: any) => {
    const fieldRules = rules[field];
    if (!fieldRules) return;

    const fieldErrors = FormValidator.validateField(value, fieldRules);
    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors
    }));
  }, [rules]);

  const handleChange = useCallback((field: string, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setIsDirty(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  }, [validateField]);

  const validateForm = useCallback(() => {
    const formErrors = FormValidator.validateForm(formState, rules);
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  }, [formState, rules]);

  const resetForm = useCallback(() => {
    setFormState(initialState);
    setErrors({});
    setIsDirty({});
  }, [initialState]);

  return {
    formState,
    errors,
    isDirty,
    handleChange,
    validateForm,
    resetForm,
    setFormState
  };
}

// هوك مخصص لتنسيق المدخلات
export function useInputMask(config: MaskConfig) {
  const [value, setValue] = useState('');
  const [maskedValue, setMaskedValue] = useState('');

  const handleChange = useCallback((input: string) => {
    setValue(input);
    const masked = FormValidator.applyMask(input, config);
    setMaskedValue(masked);
  }, [config]);

  return {
    value,
    maskedValue,
    handleChange
  };
}