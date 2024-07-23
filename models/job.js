"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
  static async create({ title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
      `SELECT title
            FROM jobs
            WHERE title = $1`,
      [title]
    );
    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate title for: ${title}`);
    }
    const result = await db.query(
      `INSERT INTO jobs
        (title, salary, equity, company_handle)
        VALUES($1, $2, $3, $4)
        RETURNING title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];
    return job;
  }
}

module.exports = Job;
