import * as Debug from "debug";
import * as Sequelize from "sequelize";

const debug = Debug("Sequelize");

// https://michalzalecki.com/using-sequelize-with-typescript/

export interface IMexicaliDBOptions {
  database: string;
  username: string;
  password: string;
  options: Sequelize.Options;
}

export class MexicaliDB {
  private connection: Sequelize.Sequelize;

  constructor(dbOptions: IMexicaliDBOptions) {
    this.connection = new Sequelize(dbOptions.database, dbOptions.username, dbOptions.password, dbOptions.options);
    this.authenticate();
  }

  public sequelize(): Sequelize.Sequelize {
    return this.connection;
  }

  private authenticate(): void {
    this.connection.authenticate()
      .then(() => {
        debug("Connection has been established successfully.");
      })
      .catch((err) => {
        debug("Unable to connect to the database:", err);
        throw err;
      });
  }
}

export const DB = new MexicaliDB({
  database: "intelaracing",
  options: {
    dialect: "sqlite",
    host: "localhost",
    operatorsAliases: false,
    pool: {
      acquire: 30000,
      idle: 10000,
      max: 5,
      min: 0,
    },
    storage: "./intelaracing.db",
  },
  password: "intelaracing",
  username: "intelaracing",
});

// Models below
export const Reading = DB.sequelize().define("Reading", {
  id: {
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
    type: Sequelize.UUID,
  },
  sensor_id: {
    allowNull: false,
    type: Sequelize.UUID,
  },
  value: {
    allowNull: false,
    type: Sequelize.DECIMAL(10, 2),
  },
});

export const Sensor = DB.sequelize().define("Sensor", {
  id: {
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
    type: Sequelize.UUID,
  },
  name: {
    allowNull: false,
    type: Sequelize.STRING,
  },
});

Sensor.hasMany(Reading, { foreignKey: "sensor_id", sourceKey: "id" });
Reading.belongsTo(Sensor, { foreignKey: "sensor_id", targetKey: "id" });
