import api from "./api";

const receptionistService = {
    getMembers: async() => {
        const response = await api.get("/auth/users/");
        return response.data;
    },

    createAttendance: async(attendanceData) => {
        const response = await api.post(
            "/attendance/records/",
            attendanceData
        );
        return response.data;
    },

    // Enquiry management
    getEnquiries: async(params = {}) => {
        const response = await api.get("/enquiries/", { params });
        return response.data;
    },

    createEnquiry: async(enquiryData) => {
        const response = await api.post(
            "/enquiries/",
            enquiryData
        );
        return response.data;
    },

    updateEnquiry: async(id, enquiryData) => {
        const response = await api.patch(
            `/enquiries/${id}/`,
            enquiryData
        );
        return response.data;
    },

    deleteEnquiry: async(id) => {
        const response = await api.delete(
            `/enquiries/${id}/`
        );
        return response.data;
    },
};

export default receptionistService;