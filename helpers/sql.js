const { BadRequestError } = require("../expressError");

/** Generates a SQL query for updating a subset of object properties
 * 
 * @param {Object} dataToUpdate - An object representing the properties to update and their new values.
 * @param {Object} jsToSql - An object that maps JS property names to their corresponding SQL column names.
 * @returns {Object} An object containing two properties:
 *  - setCols: A string representing the SQL query fragment for setting the column values.
 *  - values: An array of the new values to be set.
 * @throws {BadRequestError} If no data is provided to update
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
