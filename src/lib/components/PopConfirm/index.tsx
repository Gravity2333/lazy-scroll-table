import React, { useState } from "react";
import styles from "./index.less";
interface PopconfirmProps {
    title: string;
    onConfirm: () => void;
    children: React.ReactNode;
  }
  
  const Popconfirm: React.FC<PopconfirmProps> = ({ title, onConfirm, children }) => {
    const [visible, setVisible] = useState(false);
  
    const handleConfirm = () => {
      setVisible(false);
      onConfirm();
    };
  
    return (
      <div className={styles.popconfirmContainer}>
        <div onClick={() => setVisible(true)} className={styles.trigger}>
          {children}
        </div>
        {visible && (
          <div className={styles.popconfirm}>
            <p className={styles.title}>{title}</p>
            <div className={styles.actions}>
              <button onClick={handleConfirm} className={styles.confirmButton}>
                确认
              </button>
              <button onClick={() => setVisible(false)} className={styles.cancelButton}>
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  export default Popconfirm;