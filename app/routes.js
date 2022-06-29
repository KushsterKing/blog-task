// const auth = require("./_helpers/auth");
const errorHandler = require("./_helpers/errorHandler");
const jwt = require("./_helpers/jwt");


module.exports = function (app) {

    // app.use("/", auth);

    app.use("/", [jwt()]);

    app.use("/users", require("./modules/users"));
    app.use("/blogs", require("./modules/blogs") );
    app.use("/users-two", require("./modules/users-two"));



    app.use(errorHandler); // this line will be in last
};
