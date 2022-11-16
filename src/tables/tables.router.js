const router = require("express").Router()
const controller = require("./tables.controller")
const methodNotAllowed = require("../errors/methodNotAllowed")

router.route("/:table_id")
  .get(controller.read)
  .delete(controller.destroy)
  .all(methodNotAllowed)

router.route("/:table_id/edit")
  .put(controller.update)
  .all(methodNotAllowed)

router.route("/:table_id/seat")
  .put(controller.assign)
  .delete(controller.dismiss)
  .all(methodNotAllowed)

router.route("/")
  .get(controller.list)
  .post(controller.create)
  .all(methodNotAllowed)

module.exports = router
