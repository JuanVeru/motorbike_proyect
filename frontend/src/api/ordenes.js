import { client } from './client';

export const ordenesService = {
  /**
   * Obtiene listado paginado de órdenes de trabajo con filtros opcionales.
   * @param {object} params - { page, limit, id_moto, id_mecanico, estado }
   */
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page)        query.append('page', params.page);
    if (params.limit)       query.append('limit', params.limit);
    if (params.id_moto)     query.append('id_moto', params.id_moto);
    if (params.id_mecanico) query.append('id_mecanico', params.id_mecanico);
    if (params.estado)      query.append('estado', params.estado);

    const qs = query.toString();
    return client.get(`/ordenes${qs ? `?${qs}` : ''}`);
  },

  getById: (id) => client.get(`/ordenes/${id}`),

  create: (body) => client.post('/ordenes', body),

  update: (id, body) => client.put(`/ordenes/${id}`, body),

  remove: (id) => client.delete(`/ordenes/${id}`),
};
