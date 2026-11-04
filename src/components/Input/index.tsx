"use client";

import { FC, Fragment, CSSProperties, ReactNode } from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";

interface InputFieldProps {
  name: string;
  rules?: object;
  inputRef?: any;
  dir?: string;
  label?: string;
  labelIcon?: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  rows?: number;
  multiline?: boolean;
  type?: string;
  disabled?: boolean;
  onInput?: React.FormEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  helperText?: string;
  style?: CSSProperties;
  id?: string;
  inputStyle?: CSSProperties;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  labelStyle?: CSSProperties;
  iconClass?: string;
  iconOnClick?: React.MouseEventHandler<HTMLSpanElement>;
}

const InputField: FC<InputFieldProps> = (props) => {
  const {
    name,
    rules,
    inputRef,
    dir,
    label,
    labelIcon,
    placeholder,
    defaultValue,
    value,
    register,
    errors,
    rows,
    multiline,
    type = "text",
    disabled,
    onInput,
    helperText,
    style,
    id,
    inputStyle,
    startAdornment,
    endAdornment,
    labelStyle,
    iconClass,
    iconOnClick,
  } = props;

  const hasError = !!errors?.[name];

  return (
    <Fragment>
      {label && (
        <label
          className="form-label"
          style={{ fontWeight: 500, ...labelStyle }}
        >
          {labelIcon && (
            <img
              src={labelIcon}
              alt=""
              width="13"
              height="13"
              style={{ marginRight: 6 }}
            />
          )}
          {label}
        </label>
      )}

      <div className="mb-3" style={style}>
        <div className="input-group">
          {/* Start Adornment */}
          {startAdornment && (
            <span className="input-group-text border-end-0">
              {startAdornment}
            </span>
          )}

          {/* Input / Textarea */}
          {multiline ? (
            <textarea
              id={id}
              dir={dir}
              rows={rows}
              defaultValue={defaultValue}
              value={value}
              placeholder={placeholder || label}
              disabled={disabled}
              onInput={onInput}
              className={`form-control ${
                iconClass || endAdornment ? "border-end-0" : ""
              } ${hasError ? "is-invalid" : ""}`}
              style={inputStyle}
              {...register(name, rules)}
            />
          ) : (
            <input
              id={id}
              dir={dir}
              type={type}
              defaultValue={defaultValue}
              value={value}
              placeholder={placeholder || label}
              disabled={disabled}
              onInput={onInput}
              className={`form-control ${
                iconClass || endAdornment ? "border-end-0" : ""
              } ${hasError ? "is-invalid" : ""}`}
              style={inputStyle}
              {...register(name, rules)}
            />
          )}

          {/* End Icon (Bootstrap Format) */}
          {iconClass && (
            <span onClick={iconOnClick} className="input-group-text border-start-0" style={{ cursor: iconOnClick ? "pointer" : "default" }}>
              <i className={iconClass} />
            </span>
          )}

          {/* Custom End Adornment */}
          {endAdornment && (
            <span
              className="input-group-text border-start-0"
              style={{ cursor: "pointer" }}
            >
              {endAdornment}
            </span>
          )}
        </div>

        {hasError && (
          <div className="invalid-feedback d-block">
            {errors[name]?.message as string}
          </div>
        )}

        {!hasError && helperText && (
          <small className="text-muted">{helperText}</small>
        )}
      </div>
    </Fragment>
  );
};

export default InputField;