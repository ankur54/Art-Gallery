module.exports = {
    mongo_user_reg: (mongoose) => {
            const db = require('../config/keys').MongoURI
            mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(() => console.log('Mongoose Connected...'))
            .catch(err => console.log(err))
    },
    mysql_admin: mysql => {
        let connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'mysql'
        });
        connection.connect(error => {
            if (error) throw error
            else console.log('MySQL Connected...')
        })
        return connection;
    },
}