import React from "react";
import styles from "./index.less";

type CustomButtonProps = {
  type?: "primary" | "default" | "dashed" | "link" | "text";
  size?: "small" | "middle" | "large";
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

const CustomButton: React.FC<CustomButtonProps> = ({
  type = "default",
  size = "middle",
  onClick,
  children,
  className,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`${styles.customButton} ${styles[type]} ${styles[size]} ${className || ""} ${disabled ? styles.disabled : ""}`.trim()}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default CustomButton;
