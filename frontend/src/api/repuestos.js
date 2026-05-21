import { client } from './client';

export const repuestosService = {
  /**
   * Obtiene listado paginado de repuestos con filtros opcionales.
   * @param {object} params - { page, limit, referencia, nombre }
   */
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page)       query.append('page', params.page);
    if (params.limit)      query.append('limit', params.limit);
    if (params.referencia) query.append('referencia', params.referencia);
    if (params.nombre)     query.append('nombre', params.nombre);

    const qs = query.toString();
    return client.get(`/repuestos${qs ? `?${qs}` : ''}`);
  },

  getById: (id) => client.get(`/repuestos/${id}`),

  create: (body) => client.post('/repuestos', body),

  update: (id, body) => client.put(`/repuestos/${id}`, body),

  remove: (id) => client.delete(`/repuestos/${id}`),
};
