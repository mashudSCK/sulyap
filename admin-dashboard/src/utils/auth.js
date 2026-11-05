let adminToken = null

export const getAdminToken = () => adminToken
export const setAdminToken = (token) => { adminToken = token }
export const clearAdminToken = () => { adminToken = null }
