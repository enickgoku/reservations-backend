const { PORT = 5001 } = process.env;

const app = require("./app");
const knex = require("./db/connection");

knex.migrate
  .latest()
  .then((migrations) => {
    console.log("Migrated: ", migrations);
    knex.seed
      .run()
      .then((seeds) => {
        console.log("Seeded: ", seeds);
        app.listen(PORT, listener)
      })
      .catch((error) => {
        console.error(error);
        knex.destoy();
      });
  })
  .catch((error) => {
    console.error(error);
    knex.destroy();
  });

function listener() {
  console.log(`Listening on Port ${PORT}!`);
}
