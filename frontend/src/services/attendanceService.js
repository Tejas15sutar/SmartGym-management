import api from "./api";

const attendanceService = {
    getAttendance: async() => {
        const response = await api.get("/attendance/records/");
        return response.data;
    },

    createAttendance: async(attendanceData) => {
        const response = await api.post(
            "/attendance/records/",
            attendanceData
        );
        return response.data;
    },

    checkOut: async(attendanceId) => {
        const response = await api.post(
            `/attendance/records/${attendanceId}/check-out/`
        );
        return response.data;
    },
};

export default attendanceService;