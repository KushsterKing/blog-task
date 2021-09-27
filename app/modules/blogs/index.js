const babyActivityController = require("./baby_activity.conroller");
const controller = new babyActivityController();
const express = require('express');

const router = express.Router();
router.post('/', controller.addActivity);
router.get('/:baby_id', controller.getActivity);
router.put('/:baby_activity_id', controller.updateActivity);
router.delete('/:baby_activity_id', controller.deleteActivity);



module.exports = router;