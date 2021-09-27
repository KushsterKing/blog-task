const users = require('./../_helpers/db');
const mongoose = require('mongoose');


(async () => {

    let colorList = [{role: 'ADMIN', first_name: 'admin', last_name: 'one', password: '$2a$10$q3G9jaFBL4DPkiDcCUJvpeoDHpE0ZwggUorHK009i8f5K1wum44Mu'/*admin_one@123*/}, {role: 'ADMIN', first_name: 'admin', last_name: 'two', password: '$2a$10$B3VWx0xVKMuwEfHV5nahMu.lheIRRICENEDpLqZ7x9XJTDdLbH0yG' /*admin_two@123*/}];

    setTimeout(async () => {

        const data = await users.find().toArray();

        let returnVal;
        if(!data.length)
            returnVal = await users.insertMany(colorList);

        await mongoose.connection.close();

        console.log(returnVal);
    }, 3000);


})();