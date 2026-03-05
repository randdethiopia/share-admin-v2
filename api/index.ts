import AdminAuth from "./admin";
import AdminProfileApi from "./admin-profile";
import Access from "./access";

const api = {
    AdminAuth,
    AdminProfile: AdminProfileApi,
    Access
}

export default api;