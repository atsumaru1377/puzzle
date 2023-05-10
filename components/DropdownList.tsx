import React, {useState} from "react";

type DropdownListProps = {
    labels: string[];
    selectedItem: string;
    onSelect: (item: string) => void;
};


const DropdownList = ({ labels, selectedItem, onSelect }: DropdownListProps) => {
    const [isOpen, setIsOpen] = useState(false);
  
    const handleSelect = (item: string) => {
        onSelect(item);
        setIsOpen(false);
    };

    return (
        <div className="relative z-10">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded inline-flex items-center"
            >
                <span>{selectedItem}</span>
                <svg
                    className="w-4 h-4 ml-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fillRule="evenodd"
                        d="M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 011.414-1.414L10 9.586l2.293-2.293a1 1 0 011.414 1.414l-3 3A1 1 0 0110 12z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute mt-2 w-48 rounded-md shadow-lg bg-white">
                    <ul className="rounded-md py-1">
                        {labels.map((item, index) => (
                            <li key={index}>
                                <button
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => handleSelect(item)}
                                >
                                    {item}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default DropdownList