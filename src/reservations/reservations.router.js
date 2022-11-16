const methodNotAllowed = require("../errors/methodNotAllowed")

const router = require("express").Router()
const controller = require("./reservations.controller")

router.route("/:reservation_id")
  .get(controller.read)
  .put(controller.update)
  .delete(controller.destroy)
  .all(methodNotAllowed)

router.route("/:reservation_id/edit")
  .put(controller.update)
  .delete(controller.destroy)
  .all(methodNotAllowed)

router.route("/:reservation_id/status")
  .put(controller.finish)
  .all(methodNotAllowed)

router.route("/")
  .get(controller.list)
  .post(controller.create)
  .all(methodNotAllowed)

module.exports = router
