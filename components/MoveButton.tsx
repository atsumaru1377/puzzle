import { useRouter } from 'next/router';

const MoveButton = () => {
    const router = useRouter();

    const label = (router.pathname === '/') ? "design" : "solver";

    const handleClick = () => {
        if (router.pathname === '/') {
            router.push('/design');
        } else {
            router.push('/');
        }
    };

    return (
        <button
            style={{
                position: 'absolute',
                top: '30px',
                right: '30px',
                zIndex: 100,
            }}
            className='bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-full w-24 h-24'
            onClick={handleClick}
        >
            {label}
        </button>
    );
};

export default MoveButton;
