const service = require("./tables.service")
const reservationService = require("../reservations/reservations.service")
const asyncErrorBoundary = require("../errors/asyncErrorBoundary")

async function list(req, res) {
  const { status } = req.query
  if (status === "occupied") {
    return res.json({ data: await service.listSeatedTables() })
  }
  if (status === "free") {
    return res.json({ data: await service.listFreeTables() })
  }
  res.json({ data: await service.list() })
}

async function read(req, res) {
  const { table } = res.locals
  res.json({ data: table })
}

async function create(req, res) {
  const data = req.body.data
  const newTable = await service.createTable(data)
  res.status(201).json({ data: newTable })
}

async function update(req, res){
  const { table_id } = req.params
  const updatedTable = await service.updateTable(req.body.data, table_id)
  res.json({ data: updatedTable })
}

async function destroy(req, res){
  const deletedTable = await service.deleteTable(req.params.table_id)
  res.sendStatus(204)
}

async function seatTable(req, res){
  const { table_id } = req.params
  const { reservation_id } = req.body.data
  await service.assignReservation(reservation_id, table_id)
  const data = await service.getTableById(table_id)
  res.status(200).json({ data })
}

async function dismissTable(req, res){
  const { table_id } = req.params
  const { reservation_id } = res.locals.table
  const dismissedTable = await service.dismissTable(table_id, reservation_id)
  res.json({ data: dismissedTable })
}

//middleware

async function hasTableId(req, res, next){
  const table_id = req.params.table_id
  if (table_id) {
    res.locals.table_id = table_id
    return next()
  }
  next({ status: 400, message: "table_id is required." })
}

async function tableExists(req, res, next){
  const table_id = res.locals.table_id
  const table = await service.getTableById(table_id)
  if (table) {
    res.locals.table = table
    return next()
  }
  next({ status: 404, message: `Table ${req.params.table_id} does not exist.` })
}

async function hasReservationId(req, res, next){
  const { data } = req.body
  if(!data){
    next({
      status: 400, message: "a data key is required."
    })
  }

  const { reservation_id } = req.body.data

  if(!reservation_id){
    return next({ status: 400, message: "reservation_id is required." })
  }

  if (reservation_id) {
    res.locals.reservation_id = reservation_id
    return next()
  }
  next({ status: 404, message: "reservation_id is required." })
}

async function reservationExists(req, res, next) {
  const { reservation_id } = res.locals
  const reservation = await service.getSizeOfReservation(reservation_id)
  if (!reservation) {
    return next({
      status: 404,
      message: `Reservation '${reservation_id}' does not exist.`
    })
  }
  res.locals.reservation = reservation
  next()
}

async function tablePropertiesExist(req, res, next){
  const { data } = req.body
  if(!data){
    next({
      status: 400, message: "a data key is required."
    })
  } 

  const { data: { table_name, capacity } } = req.body

  if(typeof capacity !== "number"){
    next({
      status: 400, message: "capacity must be a number."
    })
  }

  if (table_name && capacity) {
    return next()
  }
  next({ status: 400, message: "table_name and capacity are required." })
}

async function tableIsFree(req, res, next){
  const { table } = res.locals
  if (table.reservation_id === null) {
    return next()
  } else {
    next({ status: 400, message: "Table is occupied." })
  }
}

async function tableNameLengthIsMoreThanOne(req, res, next){
  const { table_name } = req.body.data

  if(table_name.length === 1) {
    next({
      status: 400, message: "table_name must be longer than one character."
    })
  }
  if (table_name.length >= 1) {
    return next()
  }
  next({ status: 400, message: "Table name must be at least 2 characters." })
}

async function tableHasSufficientCapacity(req, res, next){
  const { table } = res.locals
  const { people } = res.locals.reservation
  if (table.capacity >= people) {
    return next()
  }
  next({ status: 400, message: "Table does not have sufficient capacity." })
}

async function tableIsOccupied(req, res, next) {
  const { table } = res.locals
  if (!table.reservation_id) {
    return next({
      status: 400,
      message: "The selected table is not occupied."
    })
  }
  next()
}

async function reservationIsNotSeated(req, res, next) {
  const { reservation_id } = req.body.data
  const reservation = await reservationService.getReservationById(reservation_id)
  if(reservation.status === "seated"){
    return next({
      status: 400,
      message: "The selected reservation is already seated."
    })
  }
  next()
}

async function tableIsNotSeated(req, res, next) {
  const { table } = res.locals
  if(table.reservation_id){
    return next({
      status: 400,
      message: "The selected table is already occupied."
    })
  }
  next()
}

module.exports = {
  list: asyncErrorBoundary(list),
  read: [
    asyncErrorBoundary(hasTableId), 
    asyncErrorBoundary(tableExists), 
    asyncErrorBoundary(read)
  ],
  create: [
    asyncErrorBoundary(tablePropertiesExist), 
    asyncErrorBoundary(tableNameLengthIsMoreThanOne), 
    asyncErrorBoundary(create)
  ],
  update: [
    asyncErrorBoundary(hasTableId),
    asyncErrorBoundary(tableExists), 
    asyncErrorBoundary(tablePropertiesExist), 
    asyncErrorBoundary(tableNameLengthIsMoreThanOne), 
    asyncErrorBoundary(update)
  ],
  assign: [
    asyncErrorBoundary(hasReservationId), 
    asyncErrorBoundary(reservationExists), 
    asyncErrorBoundary(hasTableId), 
    asyncErrorBoundary(tableExists), 
    asyncErrorBoundary(tableIsNotSeated), 
    asyncErrorBoundary(tableHasSufficientCapacity), 
    asyncErrorBoundary(reservationIsNotSeated), 
    asyncErrorBoundary(seatTable)],
  dismiss: [
    asyncErrorBoundary(hasTableId), 
    asyncErrorBoundary(tableExists), 
    asyncErrorBoundary(tableIsOccupied), 
    asyncErrorBoundary(dismissTable)
  ],
  destroy: [
    asyncErrorBoundary(hasTableId), 
    asyncErrorBoundary(tableExists), 
    asyncErrorBoundary(tableIsFree), 
    asyncErrorBoundary(destroy)
  ],
}
