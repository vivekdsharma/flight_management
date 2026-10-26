const mysql = require('mysql2/promise');
require('dotenv').config();

const connectionUri = process.env.DATABASE_URL || 'mysql://3eErUSztA2HBHTR.root:W7wiuEH3PCuwRYkQ@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/flight_management?ssl={"rejectUnauthorized":true}';

const db = mysql.createPool(connectionUri);

module.exports = db;