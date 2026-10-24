import api from "./api";

export const getMyProfile = async() => {
    const response = await api.get("/members/profile/");
    return response.data;
};

export const updateMyProfile = async(profileData) => {
    const response = await api.patch("/members/profile/", profileData);
    return response.data;
};

const memberService = {
    getMyProfile,
    updateMyProfile,
};

export default memberService;