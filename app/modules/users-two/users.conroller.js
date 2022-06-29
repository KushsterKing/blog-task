const users = require('./users.model');
const configuration = require('./../../../configuration');


class userController /*extends Base */{
    constructor() {
        // super();

        this.expenseSharing = async (req, res) => {

            try {
                let amount;
                if (typeof req.query.Amount === 'object') {
                    amount = req.query.Amount.map(elm => Number(elm));
                } else {
                    amount = Number(req.query.Amount) / req.query.paidForUsers.length;
                }

                let result = await users.find({userId: {$in: req.query.paidForUsers.map(elm => Number(elm))}});

                for (let i = 0; i < result.length; i++) {
                    let found = false;
                    let amountToAdd = Array.isArray(amount) ? amount[i] : amount;
                    // let oneResult = result[i];
                    result[i].owes = result[i].owes.map((elm) => {
                        if (elm.userId === req.query.paidBy) {
                            found = true;
                            return {...elm, amount: elm.amount + amountToAdd}
                        } else {
                            return elm;
                        }
                    });
                    if (!found) {
                        result[i].owes.push({
                            userId: req.query.paidBy,
                            amount: typeof Array.isArray(amount) ? amount[i] : amount
                        })
                    }
                    await users.update({userId: result[i].userId}, {owes: result[i].owes})
                }

                return res.status(200).json({
                    success: true,
                    message: "Success"
                })
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    debug: e.stack,
                    message: "Error"
                })
            }

        };
    }
}


module.exports = userController;
