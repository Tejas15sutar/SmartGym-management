import api from "./api";

export const getMyPayments = async() => {
    const response = await api.get("/payments/records/");
    return response.data;
};

export const getPayments = async() => {
    const response = await api.get("/payments/records/");
    return response.data;
};

export const createPayment = async(paymentData) => {
    const response = await api.post("/payments/records/", paymentData);
    return response.data;
};

export const confirmPayment = async(paymentId) => {
    const response = await api.post(
        `/payments/records/${paymentId}/confirm/`
    );
    return response.data;
};

const paymentService = {
    getMyPayments,
    getPayments,
    createPayment,
    confirmPayment,
};

export default paymentService;