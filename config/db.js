const mongoose = require('mongoose')
require('dotenv').config({ path: '.variables.env' })

const conectarBD = async () => {
  try {
    await mongoose.connect(process.env.DB_MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log('DB conectada con exito')   
  } catch (error) {
    console.log('Hubo un error de conexión', error)
    process.exit(1)
  }
}

module.exports = conectarBD;
