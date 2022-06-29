const users = require('./../modules/users-two/users.model');
const db = require('./../_helpers/db');
const mongoose = require('mongoose');


(async () => {

    let colorList = [{userId: 1, owes: []}, { userId: 2, owes: []}, { userId: 3, owes: []}, { userId: 4, owes: []}];

    setTimeout(async () => {

        const data = await users.find();

        let returnVal;
        if(!data.length)
            returnVal = await db.connection.db.collection('users-twos').insertMany(colorList);

        await mongoose.connection.close();

        console.log(returnVal);
    }, 3000);


})();
