import React from 'react';

type ButtonProps = {
  label: string;
  onClick: () => void;
};

const Button = ({ label, onClick }: ButtonProps) => {
    let buttonDesign;
    if (label == "stop") {
        buttonDesign = "bg-red-500 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-full"
    } else {
        buttonDesign = "bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-full"
    }
    return (
        <button
        onClick={onClick}
        className={buttonDesign}
        >
        {label}
        </button>
    );
};

export default Button;
