const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

class AuthController {
  async login(req, res) {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ error: 'correo y password son obligatorios' });
    }

    const user = await userRepository.findByEmailWithPassword(correo);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isValidPassword = await userRepository.comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Usuario desactivado. Contacte al administrador.' });
    }

    const token = jwt.sign(
      { id: user.id, correo: user.correo, rol: user.rol },
      process.env.JWT_KEY,
      { expiresIn: '24h' }
    );

    res.json({ 
      message: 'Login exitoso',
      token,
      user: { id: user.id, nombre: user.nombre, correo: user.correo, rol: user.rol, cedula: user.cedula, telefono: user.telefono }
    });
  }
}

module.exports = new AuthController();
