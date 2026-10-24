import api from "./api";

export const getMyMemberships = async() => {
    const response = await api.get("/memberships/records/");
    return response.data;
};

export const getMembershipPlans = async() => {
    const response = await api.get("/memberships/plans/");
    return response.data;
};

export const getMemberships = async() => {
    const response = await api.get("/memberships/records/");
    return response.data;
};

const membershipService = {
    getMyMemberships,
    getMembershipPlans,
    getMemberships,
};

export default membershipService;