const Usuario = require('../models/Usuarios');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
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
    },
    obtenerProductos: async () => {
      try {
        const productos = await Producto.find({})
        return productos
      } catch (error) {
        throw new Error('Error al traer los productos', error)
      }
    },
    obtenerProducto: async (_, { id }) => {
      const producto = await Producto.findById(id)

      if (!producto) {
        throw new Error('El producto no fue encontrado', error)
      }

      return producto
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
        const usuario = new Usuario(input)
        const usuarioNuevo = await usuario.save() // guardado

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
    },
    nuevoProducto: async (_, { input }) => {
      try {
        // guardar el usuario en la base de datos
        const producto = new Producto(input);
        const productoNuevo = await producto.save(); // guardado

        return productoNuevo
      } catch (error) {
        throw new Error('Error al agregar un nuevo prodcuto', error) 
      }
    },
    actualizarProducto: async (_, { id, input }) => {
      let producto = await Producto.findById(id)

      if (!producto) {
        throw new Error('El producto no fue encontrado', error)
      }

      producto = await Producto.findOneAndUpdate({ _id: id }, input, { new: true })
      return producto
    },
    eliminarProducto: async (_, { id }) => {
      let producto = await Producto.findById(id)

      if (!producto) {
        throw new Error('El producto no fue encontrado', error)
      }

      producto = await Producto.findOneAndDelete({ _id: id })

      return "Producto eliminado correctamente"
    },
    nuevoCliente: async (_, { input }, ctx) => {
      const { email } = input
      const cliente = await Cliente.findOne({ email })

      if (cliente) {
        throw new Error('El cliente ya existe')
      }

      const nuevoCliente = new Cliente(input);
      nuevoCliente.vendedor = ctx.usuario.id

      try {
        const resultado = await nuevoCliente.save()
        return resultado
      } catch (error) {
        throw new Error('Error al crear un usuario nuevo')
      }
    }
  }
}

module.exports = resolvers;
