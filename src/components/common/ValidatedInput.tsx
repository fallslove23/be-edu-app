import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { ValidationResult, validateScore, validateStudentName, validateEmail, validatePhone } from '../../utils/validation';

interface ValidatedInputProps {
  type: 'text' | 'number' | 'email' | 'tel' | 'score' | 'studentName';
  value: string | number;
  onChange: (value: string | number, validation: ValidationResult) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  label?: string;
  min?: number;
  max?: number;
  decimals?: number;
  showValidation?: boolean;
  validateOnChange?: boolean;
  customRules?: any;
}

const ValidatedInput: React.FC<ValidatedInputProps> = ({
  type,
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
  disabled = false,
  label,
  min = 0,
  max = 100,
  decimals = 1,
  showValidation = true,
  validateOnChange = true,
  customRules
}) => {
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });
  const [touched, setTouched] = useState(false);

  const validateInput = (inputValue: string | number) => {
    let result: ValidationResult;

    switch (type) {
      case 'score':
        result = validateScore(inputValue, {
          min,
          max,
          required,
          decimals,
          ...customRules
        });
        break;
      case 'studentName':
        result = validateStudentName(String(inputValue), customRules);
        break;
      case 'email':
        result = validateEmail(String(inputValue), required);
        break;
      case 'tel':
        result = validatePhone(String(inputValue), required);
        break;
      case 'number':
        result = validateScore(inputValue, {
          min: min || 0,
          max: max || 999999,
          required,
          decimals,
          ...customRules
        });
        break;
      default:
        result = {
          isValid: required ? String(inputValue).trim() !== '' : true,
          errors: required && String(inputValue).trim() === '' ? ['필수 입력 항목입니다.'] : [],
          warnings: []
        };
    }

    return result;
  };

  useEffect(() => {
    if (validateOnChange || touched) {
      const result = validateInput(value);
      setValidation(result);
    }
  }, [value, validateOnChange, touched, type, min, max, required]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === 'number' || type === 'score'
      ? (e.target.value === '' ? '' : Number(e.target.value))
      : e.target.value;

    const result = validateInput(newValue);

    if (validateOnChange) {
      setValidation(result);
    }

    onChange(newValue, result);
  };

  const handleBlur = () => {
    setTouched(true);
    const result = validateInput(value);
    setValidation(result);
  };

  const getInputType = () => {
    switch (type) {
      case 'score':
      case 'number':
        return 'number';
      case 'email':
        return 'email';
      case 'tel':
        return 'tel';
      default:
        return 'text';
    }
  };

  const getValidationClass = () => {
    if (!showValidation || !touched) return '';

    if (!validation.isValid) {
      return 'border-destructive/50 focus:border-destructive/50 focus:ring-red-200';
    } else if (validation.warnings.length > 0) {
      return 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-200';
    } else {
      return 'border-green-500 focus:border-green-500 focus:ring-green-200';
    }
  };

  const getValidationIcon = () => {
    if (!showValidation || !touched) return null;

    if (!validation.isValid) {
      return <XCircleIcon className="h-5 w-5 text-destructive" />;
    } else if (validation.warnings.length > 0) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-foreground" />;
    } else {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    }
  };

  const getNumberProps = () => {
    if (type === 'score' || type === 'number') {
      return {
        min,
        max,
        step: decimals ? Math.pow(10, -decimals) : 1
      };
    }
    return {};
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type={getInputType()}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          {...getNumberProps()}
          className={`
            w-full px-3 py-2 border border-input rounded-full
            focus:ring-2 focus:ring-ring/20 focus:border-ring
            disabled:bg-muted disabled:cursor-not-allowed
            bg-background text-foreground
            ${getValidationClass()}
            ${className}
          `}
        />

        {showValidation && touched && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {getValidationIcon()}
          </div>
        )}
      </div>

      {showValidation && touched && (
        <div className="mt-2 space-y-1">
          {validation.errors.map((error, index) => (
            <div key={`error-${index}`} className="flex items-center space-x-1 text-sm text-destructive">
              <XCircleIcon className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ))}

          {validation.warnings.map((warning, index) => (
            <div key={`warning-${index}`} className="flex items-center space-x-1 text-sm text-foreground">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ValidatedInput;