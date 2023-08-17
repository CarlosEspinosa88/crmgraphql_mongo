const Usuario = require('../models/Usuarios');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedido');

const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken');
const Usuarios = require('../models/Usuarios');
require('dotenv').config({ path: '.variables.env' })


const crearToken = (usuario, secreta, expiresIn) => {
  const { id, email, nombre, apellido, creado } = usuario

  return jwt.sign( { id, email, nombre, apellido, creado }, secreta, { expiresIn })
}

const resolvers = {
  Query: {
    obtenerUsuario: async (_, {}, ctx) => {
      return ctx.usuario
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
    },
    obtenerClientes: async () => {
      try {
        const clientes = await Cliente.find({})
        return clientes
      } catch (error) {
        throw new Error('Error al cargar los clientes', error)
      }
    },
    obtenerClientesVendedor: async (_, {}, ctx) => {
      try {
        const clientes = await Cliente.find({ vendedor: ctx.usuario.id.toString()})
        return clientes
      } catch (error) {
        throw new Error('Error al cargar los clientes por vendedor', error)
      }
    },
    obtenerCliente: async (_, { id }, ctx) => {
      const cliente = await Cliente.findById(id)

      if (!cliente) {
        throw new Error('Cliente no encontrado')
      }

      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error('No tienes las credenciales')
      }

      return cliente
    },
    obtenerPedidos: async () => {
      try {
        const pedidos = await Pedido.find({})
  
        return pedidos
      } catch (error) {
        throw new Error('Error al obtener los pedidos', error)
      }
    },
    obtenerPedidosVendedor: async (_, {}, ctx) => {
      try {
        const pedidos = await Pedido.find({ vendedor: ctx.usuario.id })
  
        return pedidos
      } catch (error) {
        throw new Error('Error al obtener los pedidos por vendedor', error)
      }
    },
    obtenerPedido: async (_, { id }, ctx) => {
      const pedido = await Pedido.findById(id)

      if (!pedido) {
        throw new Error('Pedido no encontrado')
      }

      if (pedido.vendedor.toString() !== ctx.usuario.id) {
        throw new Error('No tienes las credenciales')
      }

      return pedido
    },
    obtenerPedidoEstado: async (_, { estado }, ctx) => {
      const pedido = await Pedido.find({ vendedor: ctx.usuario.id, estado })

      return pedido
    },
    mejoresClientes: async () => {
      const clientes = await Pedido.aggregate([
        {
          $match: {
            estado: "COMPLETADO" 
          }
        },
        {
          $group: {
            _id: "$cliente",
            total: { 
              $sum: "$total"
            }
          }
        },
        {
          $lookup: { 
            from: "clientes",
            localField: "_id",
            foreignField: "_id",
            as: "cliente"
          }
        },
        {
          $limit: 10,
        },
        {
          $sort: { 
            total: -1
          }
        }
      ])

      return clientes
    },
    mejoresVendedores: async () => {
      const vendedores = await Pedido.aggregate([
        {
          $match: {
            estado: "COMPLETADO" 
          }
        },
        {
          $group: {
            _id: "$vendedor",
            total: { 
              $sum: "$total"
            }
          }
        },
        {
          $lookup: { 
            from: "usuarios",
            localField: "_id",
            foreignField: "_id",
            as: "vendedor"
          }
        },
        {
          $limit: 3,
        },
        {
          $sort: { 
            total: -1
          }
        }
      ])


      return vendedores
    },
    buscarProducto: async (_, { texto }) => {
      const productos = await Producto.find({ $text: { $search: texto } }).limit(10)

      return productos
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
    },
    actualizarCliente: async (_, { id, input }, ctx) => {
      let cliente = await Cliente.findById(id)

      if (!cliente) { 
        throw new Error('El cliente no existe')
      }

      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error('No tienes las credenciales')
      }

      cliente = await Cliente.findOneAndUpdate({ _id: id }, input , { new: true })

      return cliente
    },
    eliminarCliente: async (_, { id }, ctx) => {
      let cliente = await Cliente.findById(id)

      if (!cliente) { 
        throw new Error('El cliente no existe')
      }

      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error('No tienes las credenciales')
      }

      cliente = await Cliente.findOneAndDelete({ _id: id })

      return "Cliente eliminado correctamente"

    },
    nuevoPedido: async (_, { input }, ctx) => {
      const { cliente } = input
      // verificar cliente existe
      const clienteExiste = await Cliente.findById(cliente)

      // verificar si el cliente es del vendedor
      if (!clienteExiste) {
        throw new Error('El cliente no existe')
      }

      if (clienteExiste.vendedor.toString() !== ctx.usuario.id) {
        throw new Error('No tienes las credenciales')
      }

      // revisar el stock si este disponoble 
      for await (const articulo of input.pedido) {
        const { id } = articulo
        const producto = await Producto.findById(id)

        if (articulo.cantidad > producto.existencia) {
          throw new Error(`El articulo ${producto.nombre} excede la cantidad disponible`)
        } else {
          // restar en la cantidad de articulos comprados
          producto.existencia = producto.existencia - articulo.cantidad
          await producto.save()
        }
      }

      // crear un nunevo pedido
      const nuevoPedido = new Pedido(input)

      // asignarle un vendedor 
      nuevoPedido.vendedor = ctx.usuario.id

      // guardarlo en la base de datos 
      const resultado = await nuevoPedido.save()
      return resultado
    },
    actualizarPedido: async (_, { id, input }, ctx) => {
      const { cliente } = input
      const pedidoExiste = await Pedido.findById(id)

      // verificar pedido existe
      if (!pedidoExiste) {
        throw new Error('El Pedido no existe')
      }

      const clienteExiste = await Cliente.findById(cliente)
      // verificar si el cliente existe 
      if (!clienteExiste) {
        throw new Error('El Cliente no existe')
      }

      if (clienteExiste.vendedor.toString() !== ctx.usuario.id ) {
        throw new Error('No tienes las credenciales')
      }

      // Verificar si le pasamos un pedido
      if (input.pedido) {
        for await (const articulo of input.pedido) {
          const { id } = articulo
          const producto = await Producto.findById(id)
  
          if (articulo.cantidad > producto.existencia) {
            throw new Error(`El articulo ${producto.nombre} excede la cantidad disponible`)
          } else {
            // restar en la cantidad de articulos comprados
            producto.existencia = producto.existencia - articulo.cantidad
            await producto.save()
          }
        }
      }

      // guardar pedido
      const resultado = await Pedido.findOneAndUpdate({ _id: id }, input, { new: true})

      return resultado
    },
    eliminarPedido: async (_, { id }, ctx) => {
      const pedido = await Pedido.findById(id)
      if (!pedido) {
        throw new Error('El Pedido no existe')
      }

      if (pedido.vendedor.toString() !== ctx.usuario.id ) {
        throw new Error('No tienes las credenciales')
      }

      await Pedido.findOneAndDelete({ _id: id })
      return "Pedido eliminado con exito"
    }
  }
}

module.exports = resolvers;
