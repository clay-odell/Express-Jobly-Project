"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`
    );
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }
  /** Get company by name */
  static async findByName(name) {
    const companies = await db.query(
      `SELECT handle,
              name,
              description,
              logo_url AS "logoUrl" 
      FROM companies
      WHERE LOWER(name) LIKE $1`,
      [`%${name.toLowerCase()}%`]
    );
    return companies.rows;
  }
  /** Get companies by minEmployees */
  static async minEmployees(num) {
    const companies = await db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
      FROM companies 
      WHERE num_employees >= $1
      ORDER BY num_employees ASC`,
      [num]
    );
    return companies.rows;
  }
  /** Get companies by maxEmployees  */
  static async maxEmployees(num) {
    const companies = await db.query(
      `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"
      FROM companies
      WHERE num_employees <= $1
      ORDER BY num_employees DESC`,
      [num]
    );
    return companies.rows;
  }
  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
/** Filters added for commpanies model to allow multiple filters to be used to search for matching user criteria */
  static async getCompanies(filters) {
    const validFields = ["name", "minEmployees", "maxEmployees"];
    let selectClause = `SELECT handle, name, description, logo_url AS "logoUrl"`;
    let where = [];
    let values = [];

    for (let field in filters) {
      if (!validFields.includes(field)) {
        throw new BadRequestError(`Invalid filter field: ${field}`);
      }
    }
    const { name, minEmployees, maxEmployees } = filters;
    if (minEmployees || maxEmployees) {
      selectClause += `, num_employees AS "numEmployees"`;
    }
    if (minEmployees > maxEmployees) {
      throw new BadRequestError("minEmployees cannont be greater than maxEmployees", 400);
    }
    if (name) {
      where.push("LOWER(name) LIKE $" + (where.length + 1));
      values.push("%" + name.toLowerCase() + "%");
    }
    if (minEmployees) {
      where.push("num_employees >= $" + (where.length + 1));
      values.push(minEmployees);
    }
    if (maxEmployees) {
      where.push("num_employees <= $" + (where.length + 1));
      values.push(maxEmployees);
    }
    let query = `${selectClause} FROM companies`
    if (where.length > 0) {
      query += " WHERE " + where.join(" AND ");
    }
    const result = await db.query(query, values);
    return result.rows;
  }
}

module.exports = Company;
