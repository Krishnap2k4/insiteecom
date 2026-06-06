import { Bounce, toast } from "react-toastify"

export const showToast = (type, message) => {
    let options = {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
        style: {
            background: '#0a0805',
            border: '1px solid rgba(201, 162, 75, 0.3)',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
        },
    }

    switch (type) {
        case 'info':
            toast.info(message, options)
            break;
        case 'success':
            toast.success(message, options)
            break;
        case 'warning':
            toast.warning(message, options)
            break;
        case 'error':
            toast.error(message, options)
            break;
        default:
            toast(message, options)
            break;
    }
}