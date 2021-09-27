// const auth = require("./_helpers/auth");
const errorHandler = require("./_helpers/errorHandler");
const jwt = require("./_helpers/jwt");
const controller = require("./modules/notification/notification.controller");
const notificationController = new controller();
const bodyParser = require('body-parser');

module.exports = function (app) {

    // app.use("/", auth);
    app.use("/notification_url", bodyParser.raw({ type: "application/json" }));
    app.post("/notification_url", notificationController.notificationPost);

    app.use("/", [jwt()]);
    app.use("/categories", require("./modules/categories"));
    app.use("/products", require("./modules/products"));
    app.use("/orders", require("./modules/orders"));
    app.use("/customers", require("./modules/customers"));
    app.use("/cart", require("./modules/cart"));
    app.use("/reviews", require("./modules/reviews"));
    app.use("/checkout", require("./modules/checkout"));

    app.use("/public", require("./modules/public"));
    app.use("/users", require("./modules/users"));
    app.use("/users_setting", require("./modules/users_setting"));
    app.use("/baby", require("./modules/baby"));
    app.use("/baby_activity", require("./modules/baby_activity"));
    app.use("/caregiver", require("./modules/caregiver"));

    app.use("/logs", require("./modules/logs"));

    app.use(errorHandler); // this line will be in last
};
