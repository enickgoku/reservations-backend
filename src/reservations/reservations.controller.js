const asyncErrorBoundary = require("../errors/asyncErrorBoundary")
const service = require("./reservations.service")

const { DateTime, Settings } = require("luxon")

Settings.defaultZoneName = "America/Michigan"

// crud functions

async function list(req, res, next) {
  if (req.query.mobile_number) {
    const { mobile_number } = req.query
    const data = await service.search(mobile_number)
    return res.json({ data })
  } 
  if (req.query.date) {
    const { date } = req.query
    const data = await service.listAllReservationsByDate(date)
    return res.json({ data })
  }
  if (req.query.date && req.query.phase) {
    const { date, phase } = req.query
    const data = await service.listReservationsByPhase(date, phase)
    return res.json({ data })
  }
}

async function read(req, res) {
  const reservation = await service.read(req.params.reservation_id)
  res.status(200).json({ data: reservation })
}

async function create(req, res) {
  const data = await service.create(req.body.data)
  res.status(201).json({ data })
}

async function update(req, res) {
  const updatedReservation = {
    ...req.body.data,
    reservation_id: req.params.reservation_id,
  }
  const data = await service.update(updatedReservation)
  res.status(200).json({ data: data })
}

async function destroy(req, res){
  const { reservation_id } = req.params
  await service.destroy(reservation_id)
  res.sendStatus(204)
}

async function finish(req, res){
  const { status } = req.body.data
  await service.finish(req.params.reservation_id, status)
  const data = await service.read(req.params.reservation_id)
  res.status(200).json({ data })
}

// Middleware validation

async function reservationExists(req, res, next) {
  const reservation = await service.read(res.locals.reservation_id)

  if (reservation) {
    res.locals.reservation = reservation
    return next()
  }
  next({ status: 404, message: `Reservation ${req.params.reservation_id} not found.` })
}

async function hasReservationId(req, res, next) {
  const { reservation_id } = req.params
  if (!reservation_id) {
    return next({
      status: 404,
      message: `The following 'reservation_id' could not be found: ${reservation_id}`
    })
  }
  res.locals.reservation_id = reservation_id
  next()
}

async function hasValidProperties(req, res, next) {
  const { data } = req.body
  if(!data) {
    return next({
      status: 400,
      message: `The following 'data' could not be found: ${data}`
    })
  }
  const { data: { first_name, last_name, mobile_number, reservation_date, reservation_time, people } } = req.body
  if (!first_name || !last_name || !mobile_number || !reservation_date || !reservation_time || !people) {
    return next({ status: 400, message: "Reservation must include first_name, last_name, mobile_number, reservation_date, reservation_time, and people." })
  }
  next()
}

async function hasValidDate(req, res, next) {
  const { reservation_date } = req.body.data
  if (!DateTime.fromISO(reservation_date).isValid) {
    return next ({
      status: 400,
      message: "A valid 'reservation_date' must be provided."
    })
  }
  next()
}

async function hasValidTime(req, res, next) {
  const { reservation_time } = req.body.data
  if (!DateTime.fromISO(reservation_time).isValid) {
    return next ({
      status: 400,
      message: "A valid 'reservation_time' must be provided."
    })
  }
  next()
}

async function dateIsNotOnTuesday(req, res, next) {
  const { reservation_date } = req.body.data
  if (DateTime.fromISO(reservation_date).weekday === 2) {
    return next({
      status: 400,
      message: "closed"
    })
  }
  next()
}

async function dateIsNotInThePast(req, res, next) {
  const { reservation_date, reservation_time } = req.body.data
  const reservationDateTime = DateTime.fromISO(`${reservation_date}T${reservation_time}`)
  if (reservationDateTime < DateTime.now()) {
    return next({
      status: 400,
      message: "future"
    })
  }
  next()
}

// verfies that 'people' is a number and is greater than 0

async function hasValidPeople(req, res, next) {
  const { people } = req.body.data
  if (typeof people !== "number" || people < 1) {
    return next({
      status: 400,
      message: "A valid 'people' value must be provided."
    })
  }
  next()
}

// Verifies that the `reservation_time` falls within the restaurant being open and within one hour of the restaurant closing.

async function hasValidTimeRange(req, res, next) {
  const { reservation_time } = req.body.data
  const reservationTime = DateTime.fromISO(reservation_time)
  const restaurantOpenTime = DateTime.fromISO("10:30")
  const restaurantCloseTime = DateTime.fromISO("21:30")
  if (reservationTime < restaurantOpenTime || reservationTime > restaurantCloseTime) {
    return next({
      status: 400,
      message: "Reservations must be made between 10:30 AM and 9:30 PM."
    })
  }
  next()
}

async function isNotAlreadyFinished(req, res, next) {
  const { status } = req.body.data

  const notAllowed = [
    `finished`,
    `seated`,
  ]
  if(notAllowed.includes(status)){
    return next({
      status: 400,
      message: `${status}`
    })
  }
  next()
}

async function reservationIsNotFinished(req, res, next) {
  const { status } = res.locals.reservation
  if (status === "finished") {
    return next({
      status: 400,
      message: `This reso is already ${status}`
    })
  }
  next()
}

async function statusIsNotUnknown(req, res, next) {
  const { status } = req.body.data

  const allowedStatus = [
    `booked`,
    `seated`,
    `finished`,
    `cancelled`,
  ]

  if(!allowedStatus.includes(status)){
    return next({
      status: 400,
      message: `${status} is not a valid status.`
    })
  }
  next()
}

module.exports = {
  read: [
    asyncErrorBoundary(hasReservationId), 
    asyncErrorBoundary(reservationExists), 
    asyncErrorBoundary(read)
  ],
  create: [
    asyncErrorBoundary(hasValidProperties), 
    asyncErrorBoundary(hasValidDate), 
    asyncErrorBoundary(hasValidTime), 
    asyncErrorBoundary(dateIsNotOnTuesday), 
    asyncErrorBoundary(dateIsNotInThePast), 
    asyncErrorBoundary(hasValidPeople), 
    asyncErrorBoundary(hasValidTimeRange),
    asyncErrorBoundary(isNotAlreadyFinished), 
    asyncErrorBoundary(create)
  ],
  update: [
    asyncErrorBoundary(hasReservationId), 
    asyncErrorBoundary(reservationExists), 
    asyncErrorBoundary(hasValidProperties), 
    asyncErrorBoundary(hasValidDate), 
    asyncErrorBoundary(hasValidTime), 
    asyncErrorBoundary(dateIsNotOnTuesday), 
    asyncErrorBoundary(dateIsNotInThePast), 
    asyncErrorBoundary(hasValidPeople), 
    asyncErrorBoundary(hasValidTimeRange),
    asyncErrorBoundary(isNotAlreadyFinished),
    asyncErrorBoundary(statusIsNotUnknown), 
    asyncErrorBoundary(update)
  ],
  destroy: [
    asyncErrorBoundary(hasReservationId), 
    asyncErrorBoundary(reservationExists), 
    asyncErrorBoundary(destroy)
  ],
  finish: [
    asyncErrorBoundary(hasReservationId), 
    asyncErrorBoundary(reservationExists), 
    asyncErrorBoundary(reservationIsNotFinished),
    asyncErrorBoundary(statusIsNotUnknown),
    asyncErrorBoundary(finish)
  ],
  list: [asyncErrorBoundary(list)],
}
