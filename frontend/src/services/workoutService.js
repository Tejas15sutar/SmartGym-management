import api from "./api";

const workoutService = {
    getPlans: async() => {
        const response = await api.get("/workouts/plans/");
        return response.data;
    },

    getExercises: async() => {
        const response = await api.get("/workouts/exercises/");
        return response.data;
    },

    getAssignments: async() => {
        const response = await api.get("/workouts/assignments/");
        return response.data;
    },

    getLogs: async() => {
        const response = await api.get("/workouts/logs/");
        return response.data;
    },

    createLog: async(logData) => {
        const response = await api.post("/workouts/logs/", logData);
        return response.data;
    },
};

export default workoutService;