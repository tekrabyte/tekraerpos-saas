import api from "./client";

export default {
    list: () => api.get("/tenant/products"),
    create: (data) => api.post("/tenant/products", data),
    update: (id, data) => api.put(`/tenant/products/${id}`, data),
    delete: (id) => api.delete(`/tenant/products/${id}`)
};