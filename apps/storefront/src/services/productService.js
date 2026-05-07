import apiClient from "./apiClient";

/**
 * @typedef {object} ProductLike
 * @property {string} _id
 * @property {string | { he?: string, ar?: string, en?: string }} name
 * @property {string | { he?: string, ar?: string, en?: string }} [description]
 * @property {number} price
 * @property {number} [salePrice]
 * @property {string} unit
 * @property {string} stockStatus
 * @property {string} imageUrl
 * @property {{ _id?: string, name?: string | { he?: string, ar?: string, en?: string }, slug?: string }} [category]
 */

/**
 * @param {{ search?: string, category?: string }} [params]
 * @returns {Promise<ProductLike[]>}
 */
export async function getProducts(params = {}) {
  const { data } = await apiClient.get("/products", { params });
  return data?.data?.products ?? [];
}

/**
 * @param {string} id
 * @returns {Promise<ProductLike>}
 */
export async function getProductById(id) {
  const { data } = await apiClient.get(`/products/${id}`);
  return data?.data?.product;
}
