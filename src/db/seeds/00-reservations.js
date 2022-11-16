const { DateTime } = require("luxon")
const reservations = require("../seeds/00-reservations.json")

const dateToday = 
  DateTime.local().toFormat("EEEE") === "Tuesday"
    ? DateTime.local().plus({ days: 1 }).toISODate()
    : DateTime.local().toISODate()

exports.seed = function (knex) {
  return knex
    .raw("TRUNCATE TABLE reservations RESTART IDENTITY CASCADE")
    .then(function () {
      return knex("reservations")
        .insert(reservations)
    })
}
