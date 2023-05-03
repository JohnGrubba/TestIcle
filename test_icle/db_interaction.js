import sqlite from "sqlite3";
import fs, { stat } from "fs";
import * as globals from "./globals.js";

const db_descriptor = JSON.parse(
  fs.readFileSync("test_icle/db/descriptor.json", "utf-8")
);
const db = new sqlite.Database("test_icle/db/tests.sqlite", async (err) => {
  if (err) {
    console.log(err);
    return;
  }

  const content = fs.readFileSync("test_icle/db/setup.sql", "utf-8");
  let sql = content.split(";");
  sql.pop();

  for await (const entry of sql) {
    create_entry(entry).catch((err) => {
      if (err) {
        console.log(err);
      }
    });
  }
});

async function create_entry(entry) {
  return new Promise((resolve, reject) => {
    db.run(entry, [], (err) => {
      if (err) {
        reject();
      } else {
        resolve();
      }
    });
  });
}

export class DBInteraction {
  /**
   *
   * @param {*} tablename From which table to get information from
   * @returns All information to the table
   */
  GetTableInfo(tablename) {
    let query = `SELECT * FROM PRAGMA_TABLE_INFO('${tablename}')`;
    return new Promise((resolve, reject) =>
      db.all(query, [], (error, rows) => {
        if (error) {
          reject(
            new Error(
              `Error occured with query: ${query} and Error: ${error.message}`
            )
          );
        } else {
          resolve(rows);
        }
      })
    );
  }

  /**
   *
   * @param {*} pragma_result The result of a pragma table_info query
   * @returns All AttributeNames of the pragma_result
   */
  GetAttributeNames(pragma_result) {
    return pragma_result.map((entry) => entry["name"]);
  }

  /**
   *
   * @param {*} tablename The tablename from which the foreign-keys should be get
   * @returns All foreign keys of a table
   */
  GetAllForeignKeys(tablename) {
    let query = `PRAGMA FOREIGN_KEY_LIST('${tablename}')`;
    return new Promise((resolve, reject) =>
      db.all(query, [], (error, rows) => {
        if (error) {
          reject(
            new Error(
              `Error occured with query: ${query} and Error: ${error.message}`
            )
          );
        } else {
          resolve(
            rows.map((entry) => {
              return {
                tablename: entry["table"],
                fk_name: entry["from"],
                reference: entry["to"],
              };
            })
          );
        }
      })
    );
  }

  /**
   * @brief Dynamic insertion of content to a table
   * @param {*} tablename string -> the name of the table in which should be inseted
   * @param {*} content list of strings -> What should be inserted into the database
   * @param {*} returns If the id of the last inserted element should be returned
   */
  InsertIntoDB(tablename, content, returns = false) {
    return new Promise(async (resolve, reject) => {
      if (this.CheckForInjection(tablename)) {
        reject(new Error("SQL-Injection detected"));
      }
      let autoIncrements = [];

      for (let table of db_descriptor) {
        if (table["tablename"] == tablename) {
          const inc_all = table["autoincrements"];
          if (inc_all) {
            autoIncrements = inc_all.map((entry) => entry["name"]);
          }
        }
      }

      let attributes = await this.GetAttributeNames(
        await this.GetTableInfo(tablename).catch((err) => {
          console.log(
            `[-] An error occurred when inserting into the database; Error: ${err}`
          );
          reject(err);
        })
      );

      attributes = attributes.filter((attribute) => {
        return !autoIncrements.includes(attribute);
      });

      const questionMarks = new Array(attributes.length).fill("?").join(", ");
      const sql = `INSERT INTO ${tablename} (${attributes.join(
        ", "
      )}) VALUES (${questionMarks})`;
      db.run(sql, content, function (error) {
        if (error) {
          reject(error);
        } else {
          if (returns) {
            resolve(this.lastID);
          } else {
            resolve();
          }
        }
      });
    });
  }

  /**
   * @param {*} tablename string -> Name of the table in which should be inserted
   * @param {*} select_opt list of strings -> What should be selected from the table (f.e. [example.name, example.id])
   * @param {*} conditions dictionary/json -> Conditions on what should be selected (f.e. {example.name : "myname"})
   * @param {*} ordering with what and how should be ordered -> "option": "what should be orderd" -> "ordering": "ASC or DESC"
   * @param {*} autojoin Automatically joins foreign keys inside of a table together
   * @param {*} limit The maximum number of entries returned
   * @brief Dynamically creates an SQL-SELECT statment
   * @returns The result of the statement
   */
  async SelectFromDB(
    tablename,
    select_opt = ["*"],
    condis = [],
    ordering = undefined,
    joins = {},
    autojoin = false,
    limit = 0
  ) {
    if (!tablename) {
      return Promise.reject(new Error("No Tablename was supplied!"));
    }
    if (
      [
        tablename,
        ...Object.keys(condis),
        ...Object.values(condis),
        ...Object.values(joins),
      ].some(this.CheckForInjection) ||
      typeof limit != "number"
    ) {
      return Promise.reject(new Error("SQL-Injection detected!"));
    }
    let query = `SELECT ${select_opt.join(", ")} FROM ${tablename}`;

    if (autojoin) {
      const fks = await this.GetAllForeignKeys(tablename);
      const info = await this.GetTableInfo(tablename);
      const attr_names = await this.GetAttributeNames(info);

      for (let attr of attr_names) {
        for (let fk of fks) {
          if (attr == fk["fk_name"]) {
            // Dynamically creates an INNER JOIN based on the result of the fk's method
            query = `${query} INNER JOIN ${fk["tablename"]} ON ${fk["tablename"]}.${fk["reference"]} == ${tablename}.${fk["fk_name"]}`;
          }
        }
      }
    }

    if (Object.values(joins).length) {
      for (let entry of joins["joins"]) {
        query = `${query} INNER JOIN ${entry["joinon"]} ON ${entry["eq1"]} == ${entry["eq2"]}`;
      }
    }

    if (condis.length) {
      query = `${query} WHERE ${condis
        .map((entry) => {
          let statements = [];
          for (let key in entry) {
            if (typeof entry[key] === "string") {
              statements.push(`${key} = '${entry[key]}'`);
            } else {
              statements.push(`${key} = ${entry[key]}`);
            }
          }
          return statements.join(" AND ");
        })
        .join(" OR ")}`;
    }
    if (ordering) {
      query = `${query} ORDER BY ${ordering}`;
    }

    if (limit != 0) {
      query = `${query} LIMIT ${limit}`;
    }

    return new Promise((resolve, reject) => {
      db.all(query, (error, rows) => {
        if (error) {
          reject(error);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   *
   * @param {*} tablename The name of the table from which should be selected
   * @param {*} attr_change Which attribute should be changed to what. Style -> { attributename : change}
   * @param {*} condis On which condition the entry should be changed. Style -> { attributename : valueToMatch}
   * @returns Returns Error if there was a problem with updating the entry
   */
  UpdateEntry(tablename, attr_change = {}, condis = {}) {
    /**
     * @param tablename -> string name of table
     * @param attr_change -> dictionary of; attributename: what_should_be_changed
     * @param condi -> On which condtition something should be changed -> eq: eq2
     */

    if (
      [
        tablename,
        ...Object.keys(attr_change),
        ...Object.values(attr_change),
        ...Object.keys(condis),
        ...Object.values(condis),
      ].some(this.CheckForInjection)
    ) {
      return Promise.reject("SQL-Injection detected!");
    }
    //const pk = this.GetPrimaryKeys(this.GetTableInfo(tablename))[0]
    const keys = Object.keys(attr_change)
      .map((key) => `${key} = ?`)
      .join(" AND ");
    const condi = Object.keys(condis)
      .map((key) => {
        if (typeof key === "string") {
          return `${key} = '${condis[key]}'`;
        }
        return `${key} = ${condis[key]}`;
      })
      .join(" AND ");
    const sql = `UPDATE ${tablename} SET ${keys} WHERE ${condi}`;

    return new Promise((resolve, reject) => {
      db.run(sql, Object.values(attr_change), (err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  /**
   *
   * @param {*} info Result of a table_info statement
   * @returns All Primary keys in the information given
   */
  GetPrimaryKeys(info) {
    let pks = [];
    for (let info_element in info) {
      if (info_element["pk"] == 1) {
        pks.push(info_element["name"]);
      }
    }
    return pks;
  }

  /**
   *
   * @param {*} sql The sql which should be checked for any potential injection
   * @brief A REGEX expression which check for potential injection
   * @returns **True** If the given statement is an injection
   */
  CheckForInjection(sql) {
    // Check if the input could be an sql injection
    if (!sql) {
      return true;
    }
    const sqlRegex =
      /(\b(ALTER|CREATE|DELETE|DROP|INSERT|SELECT|UPDATE|UNION|TRUE|FALSE|OR|AND)\b)|(--)|(\/\*)|(\*\/)|(;)|(')|(")/i;
    return sqlRegex.test(sql);
  }

  /**
   *
   * @param {*} tablename From which table something should be deleted
   * @param {*} identifier On which condition something should be deleted. Style -> { attributename : valueToMatch }
   * @throws **Error** If the deletion was not succesfull
   */
  DeleteEntry(tablename, identifier = {}) {
    if (!tablename) {
      return new Error("No Tablename was supplied!");
    }
    if ([tablename, ...Object.keys(identifier)].some(this.CheckForInjection)) {
      return new Error("SQL-Injection detected!");
    }
    const keys = Object.keys(identifier)
      .map((key) => `${key} = ?`)
      .join(" AND ");
    const values = Object.values(identifier);
    const sql = `DELETE FROM ${tablename} WHERE ${keys}`;
    return new Promise((resolve, reject) => {
      db.run(sql, values, (err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }
}
