require('dotenv').config();

var mysql = require('mysql')

var util = require('util')

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME,DB_CONN_LIMIT } = process.env;

var pool = mysql.createPool({
    connectionLimit: DB_CONN_LIMIT,
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
})
pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
    }
    if (connection) connection.release()
    return
})

pool.query = util.promisify(pool.query)

module.exports = pool