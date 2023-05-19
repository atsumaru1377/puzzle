import React from 'react';

type InputProps = {
    value: number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onIncrement: () => void;
    onDecrement: () => void;
};

const Input = ({ value, onChange, onIncrement, onDecrement }: InputProps) => {
    return (
        <div className="flex">
            <input
                onChange={onChange}
                value={value}
                min={-1}
                step={1}
                type="number"
                style={{appearance: "textfield"}}
                className="bg-blue-500 text-white font-medium py-2 px-4 rounded-full mx-2 w-32"
            />
        </div>
    );
};

export default Input;
