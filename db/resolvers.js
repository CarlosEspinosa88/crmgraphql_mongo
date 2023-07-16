const Usuario = require('../models/Usuarios');
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config({ path: '.variables.env' })


const crearToken = (usuario, secreta, expiresIn) => {
  const { id, email, nombre, apellido, creado } = usuario

  return jwt.sign( { id, email, nombre, apellido, creado }, secreta, { expiresIn })
}

const resolvers = {
  Query: {
    obtenerUsuario: async (_, { token }) => {
      const usuarioId = jwt.verify(token, process.env.SECRETA)

      return usuarioId
    }
  },
  Mutation: {
    nuevoUsuario: async (_, { input } ) => {
      const { email, password } = input;
      const usuarioExiste = await Usuario.findOne({ email })

      // Revisar si el usuario ya existe 
      if (usuarioExiste) {
        throw new Error('El usuario ya esta registrado')
      }

      //hash del password
      const salt = await bcryptjs.genSaltSync(10);
      input.password = await bcryptjs.hash(password, salt);

      try {
        // guardar el usuario en la base de datos
        const usuarioNuevo = new Usuario(input)
        usuarioNuevo.save() // guardado

        return usuarioNuevo

      } catch (error) {
        console.log('Error de usuario', error)
      }
    },
    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;
      const usuarioExiste = await Usuario.findOne({ email })

      // Revisar si el usuario existe 
      if (!usuarioExiste) {
        throw new Error('El usuario no existe')
      }

      // Revisar si el password es correcto
      const passwordCorrecto = bcryptjs.compareSync(password, usuarioExiste.password)
      if (!passwordCorrecto) {
        throw new Error('El password es incorrecto')
      }

      // Crear el token
      return {
        token: crearToken(usuarioExiste, process.env.SECRETA, '24h')
      }
    }
  }
}

module.exports = resolvers;
