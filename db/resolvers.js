const Usuario = require('../models/Usuarios');
const bcryptjs = require('bcryptjs')

const resolvers = {
  Query: {
    obtenerCursos: () => 'Obtener Cursos'
  },
  Mutation: {
    nuevoUsuario: async (_, { input } ) => {
      const { email, password } = input;
      const usuarioExiste = await Usuario.findOne({ email })

      // Revisar si el usuario ya existe 
      if (usuarioExiste) {
        throw new Error(' usuario ya esta registrado')
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
      return 
    }
  }
}

module.exports = resolvers;
