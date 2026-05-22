const { Moto } = require('../models');

const userAttributes = ['id', 'nombre', 'correo'];

class MotoRepository {
  async findAll(filters = {}) {
    const where = {};
    if (filters.placa !== undefined && filters.placa !== null && filters.placa !== '') {
      where.placa = { [require('sequelize').Op.iLike]: `%${filters.placa}%` };
    }
    if (filters.id_propietario !== undefined && filters.id_propietario !== null && filters.id_propietario !== '') {
      where.id_propietario = filters.id_propietario;
    }

    const options = {
      where,
      include: [
        { model: require('../models').User, as: 'propietario', attributes: userAttributes },
        { model: require('../models').User, as: 'responsable', attributes: userAttributes }
      ],
      order: [['id', 'ASC']]
    };

    if (filters.limit !== undefined && filters.limit !== null) {
      options.limit = filters.limit;
    }
    if (filters.offset !== undefined && filters.offset !== null) {
      options.offset = filters.offset;
    }

    const { rows, count } = await Moto.findAndCountAll(options);
    return {
      rows: rows.map(m => m.toJSON()),
      count
    };
  }

  async findById(id) {
    const moto = await Moto.findByPk(id, {
      include: [
        { model: require('../models').User, as: 'propietario', attributes: userAttributes },
        { model: require('../models').User, as: 'responsable', attributes: userAttributes }
      ]
    });
    return moto ? moto.toJSON() : null;
  }

  async findByPlaca(placa) {
    const moto = await Moto.findOne({
      where: { placa },
      include: [
        { model: require('../models').User, as: 'propietario', attributes: userAttributes },
        { model: require('../models').User, as: 'responsable', attributes: userAttributes }
      ]
    });
    return moto ? moto.toJSON() : null;
  }

  async create({ placa, marca, modelo, color, cilindraje, id_propietario, responsible_user, anio }) {
    const moto = await Moto.create({
      placa,
      marca,
      modelo,
      color,
      cilindraje,
      id_propietario,
      responsible_user,
      anio,
      create_date: new Date()
    });
    return moto.toJSON();
  }

  async update(id, { placa, marca, modelo, color, cilindraje, id_propietario, responsible_user, anio }) {
    const updateData = {};
    if (placa !== undefined) updateData.placa = placa;
    if (marca !== undefined) updateData.marca = marca;
    if (modelo !== undefined) updateData.modelo = modelo;
    if (color !== undefined) updateData.color = color;
    if (cilindraje !== undefined) updateData.cilindraje = cilindraje;
    if (id_propietario !== undefined) updateData.id_propietario = id_propietario;
    if (responsible_user !== undefined) updateData.responsible_user = responsible_user;
    if (anio !== undefined) updateData.anio = anio;

    const [affectedCount] = await Moto.update(updateData, {
      where: { id }
    });

    if (affectedCount === 0) return null;

    const updatedMoto = await Moto.findByPk(id, {
      include: [
        { model: require('../models').User, as: 'propietario', attributes: userAttributes },
        { model: require('../models').User, as: 'responsable', attributes: userAttributes }
      ]
    });
    return updatedMoto ? updatedMoto.toJSON() : null;
  }

  async delete(id) {
    const moto = await Moto.findByPk(id);
    if (!moto) return null;
    await moto.destroy();
    return moto.toJSON();
  }
}

module.exports = new MotoRepository();
