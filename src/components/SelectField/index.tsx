"use client";

import React, { Fragment, useEffect, useRef, useState } from "react";

type OptionType = {
  id?: number | string;
  name: string;
  inputValue?: string;
};

type Props = {
  label?: string;
  labelIcon?: string;
  loading?: boolean;
  placeholder?: string;
  size?: "sm" | "lg";
  disabled?: boolean;
  onSearch?: (value: string) => void;
  addNew?: (value: string) => void;
  addNewPopup?: React.ReactNode;
  multiple?: boolean;
  selected: any;
  onSelect: (value: any) => void;
  register?: any;
  error?: string;
  options: OptionType[];
};

const debounce = (fn: Function, delay = 500) => {
  let timer: any;
  return (...args: any) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export default function SelectField({
  label,
  labelIcon,
  loading,
  placeholder,
  size,
  disabled,
  onSearch,
  addNew,
  addNewPopup,
  multiple,
  selected,
  onSelect,
  register,
  error,
  options,
}: Props) {
  const [inputValue, setInputValue] = useState(selected?.name || "");
  const [filteredOptions, setFilteredOptions] = useState<OptionType[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // 🔹 Debounced search
  const handleSearch = debounce((value: string) => {
    onSearch && onSearch(value);
  }, 400);

  // 🔹 Filter options
  useEffect(() => {
    let filtered = options.filter((opt) =>
      opt.name.toLowerCase().includes(inputValue.toLowerCase())
    );

    const isExisting = options.some(
      (opt) => opt.name.toLowerCase() === inputValue.toLowerCase()
    );

    if (inputValue && !isExisting && addNew) {
      filtered.push({
        inputValue,
        name: `Add "${inputValue}"`,
      });
    }

    setFilteredOptions(filtered);
  }, [inputValue, options]);

  // 🔹 Outside click close
  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (!wrapperRef.current?.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔹 Handle select
  const handleSelect = (option: OptionType) => {
    if (option.inputValue && addNew) {
      addNew(option.inputValue);
    } else {
      onSelect(option);
    }
    setInputValue(option.name);
    setShowDropdown(false);
  };

  return (
    <Fragment>
      {label && (
        <label className="form-label d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            {labelIcon && (
              <img src={labelIcon} width={13} height={13} alt="" />
            )}
            {label}
          </div>
          {addNewPopup && addNewPopup}
        </label>
      )}

      <div className="mb-2 position-relative" ref={wrapperRef}>
        <input
          type="text"
          className={`form-control ${size ? `form-control-${size}` : ""} ${
            error ? "is-invalid" : ""
          }`}
          placeholder={label ?? placeholder}
          disabled={disabled}
          value={inputValue}
          {...register}
          onFocus={() => setShowDropdown(true)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
            handleSearch(e.target.value);
          }}
          style={{ minWidth: "100px", paddingRight: "2.5rem" }}
        />

 <span
    className="position-absolute top-50 end-0 translate-middle-y pe-3 text-secondary"
    style={{ cursor: "pointer", zIndex: 5 }}
    onClick={() => setShowDropdown((prev) => !prev)}
  >
    <i className="bi bi-chevron-down"></i>
  </span>


        {/* Dropdown */}
        {showDropdown && (
          <ul className="list-group position-absolute w-100 shadow mt-1 z-3">
            {loading && (
              <li className="list-group-item text-muted">Loading...</li>
            )}

            {!loading && filteredOptions.length === 0 && (
              <li className="list-group-item text-muted">No results</li>
            )}

            {filteredOptions.map((option, index) => (
              <li
                key={index}
                className="list-group-item list-group-item-action"
                style={{ cursor: "pointer" }}
                onClick={() => handleSelect(option)}
              >
                {option.name}
              </li>
            ))}
          </ul>
        )}

        {error && <div className="invalid-feedback d-block">{error}</div>}
      </div>
    </Fragment>
  );
}