// src/components/ui/Button.tsx
"use client";

import React from "react";
import styles from "./styles.module.scss";

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
}

const Button = ({ onClick, children, disabled, fullWidth }: ButtonProps) => {
  return (
    <button
      className={`${styles.button} ${fullWidth ? styles.fullWidth : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
