import * as Debug from "debug";
import * as Sequelize from "sequelize";

const debug = Debug("sequelize");

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
  created_at: {
    allowNull: false,
    type: Sequelize.DATE,
  },
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
}, {
  timestamps: true,
  updatedAt: false,
});

export const Sensor = DB.sequelize().define("Sensor", {
  created_at: {
    allowNull: false,
    defaultValue: Sequelize.NOW,
    type: Sequelize.DATE,
  },
  hash: {
    allowNull: false,
    type: Sequelize.STRING,
  },
  id: {
    allowNull: false,
    primaryKey: true,
    type: Sequelize.UUID,
  },
  name: {
    allowNull: false,
    type: Sequelize.STRING,
  },
}, {
  timestamps: true,
  updatedAt: false,
});

Sensor.hasMany(Reading, { foreignKey: "sensor_id", sourceKey: "id" });
Reading.belongsTo(Sensor, { foreignKey: "sensor_id", targetKey: "id" });

export const SensorConfig = {
  engine_temperature: {
    id: "fac28420-be3b-4554-ad34-df6264f1d8ff",
    name: "Engine Temperature",
  },
  latitude: {
    id: "dd9a1793-b889-49c5-b57c-d313e254ce5f",
    name: "Latitude",
  },
  longitude: {
    id: "9268b6f5-4a33-4a72-86c7-36289c8e2a7e",
    name: "Longitude",
  },
  speed: {
    id: "58db4fca-717f-4ba1-b57c-1197938a9c66",
    name: "Speed",
  },
};
