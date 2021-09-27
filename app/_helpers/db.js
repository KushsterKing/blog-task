let mongoose = require('mongoose'),
    f = require('util').format,
    fs = require('fs');

const path = require("path");

//Specify the Amazon DocumentDB cert
// var ca;
let configuration = require('../../configuration');
// if(configuration.environment == 'local'){
//   ca = [fs.readFileSync("rds-combined-ca-bundle.pem")];
// }else{
//   ca = [fs.readFileSync("/var/www/worldadmin-crm/rds-combined-ca-bundle.pem")];
// }

// var ca = [fs.readFileSync(path.resolve(__dirname,"../../rds-combined-ca-bundle.pem"))];
mongoose.connect(configuration.mongoDBUrl, {useNewUrlParser: true/*,sslValidate: true,
    sslCA:ca*/})
    .then((res) => {
        console.log('Successfully connected mongoDB!');
        //console.log(res);
    }).catch((err) => {
    console.log(err)
});

mongoose.set('debug', true);
module.exports = mongoose;
