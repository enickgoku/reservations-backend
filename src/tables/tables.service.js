const knex = require("../db/connection")

function list() {
  return knex("tables")
    .select("*")
    .orderBy("table_name")
}

function listFreeTables() {
  return knex("tables")
    .select("*")
    .whereNull("reservation_id")
    .orderBy("table_name")
}

function listSeatedTables() {
  return knex("tables")
    .select("*")
    .whereNotNull("reservation_id")
    .orderBy("table_name")
}

function createTable(data) {
  return knex("tables")
    .insert(data, "*")
    .then((tables) => tables[0])
}

function getTableById(table_id){
  return knex("tables")
    .where({table_id: table_id})
    .first()
}

function updateTable(table, table_id){
  return knex("tables")
    .where({ table_id: table_id })
    .update(table, "*")
    .then((tables) => tables[0])
}

function deleteTable(table_id){
  return knex("tables")
    .where({ table_id: table_id })
    .del()
}

function getSizeOfReservation(reservation_id){
  return knex("reservations")
    .where({ reservation_id: reservation_id })
    .select("people")
    .first()
}

function assignReservation(reservation_id, table_id) {
  return knex.transaction(async (trx) => {
    await trx("reservations")
      .where({ reservation_id: reservation_id })
      .update({ status: "seated" })
    await trx("tables")
      .where({ table_id: table_id })
      .update({ reservation_id: reservation_id })
    return trx("tables")
      .where({ table_id: table_id })
      .first()
  })
}

function dismissTable(table_id, reservation_id) {
  return knex.transaction(async (trx) => {
    await trx("reservations")
      .where({ reservation_id: reservation_id })
      .update({ status: "finished" })
    await trx("tables")
      .where({ table_id: table_id })
      .update({ reservation_id: null })
    return trx("tables")
      .where({ table_id: table_id })
      .first()
  })
}

module.exports = {
  list,
  listFreeTables,
  listSeatedTables,
  createTable,
  getTableById,
  updateTable,
  deleteTable,
  getSizeOfReservation,
  assignReservation,
  dismissTable
}
