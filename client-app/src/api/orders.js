import api from "./client";
export default {
    create: (payload) => api.post("/tenant/orders/create", payload),
    history: () => api.get("/tenant/orders")
};