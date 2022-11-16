const e = require("express")
const knex = require("../db/connection")

const listAllReservationsByDate = (date) => {
  return knex("reservations")
      .select("*")
      .where({ reservation_date: date })
      .whereIn("status", ["booked", "seated"])
      .orderBy('reservation_time')
}


const getReservationById = (reservation_id) => {
  return knex("reservations")
      .select("*")
      .where({ reservation_id })
      .first()
}

const listReservationsByPhase = (date, phase) => {
  return knex("reservations")
      .select("*")
      .where({ reservation_date: date, status: phase })
      .orderBy('reservation_time')
}

const create = (reservation) => {
  return knex("reservations")
      .insert(reservation)
      .returning("*")
      .then((createdRecords) => createdRecords[0])
}

const read = (reservation_id) => {
  return knex("reservations")
      .where({ reservation_id: reservation_id })
      .first()
}

const update = (updatedReservation) => {
  return knex("reservations")
    .select("*")
    .where({ reservation_id: updatedReservation.reservation_id })
    .update(updatedReservation, "*")
    .then(updatedReservation => updatedReservation[0])
}

const destroy = (reservation_id) => {
  return knex("reservations")
      .where({ reservation_id })
      .del()
}

function finish(reservation_id, status) { 
  if(status === "finished") {
  return knex.transaction(async (trx) => {
    await trx("reservations")
        .where({ reservation_id })
        .update({ status: status })
    await trx("tables")
        .where({ reservation_id })
        .update({ reservation_id: null })
  })
  } else {
    return knex("reservations")
        .where({ reservation_id })
        .update({ status: status })
  }
}

const search = (mobile_number) => {
  return knex("reservations")
    .select("*")
    .where("mobile_number", "like", `%${mobile_number}%`)
    .orderBy("reservation_time", "desc")
}

module.exports = {
  listAllReservationsByDate,
  listReservationsByPhase,
  getReservationById,
  create,
  read,
  update,
  destroy,
  finish,
  search,
}
