"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
  static async create({ title, salary, equity, companyHandle }) {
    const existingJob = await db.query(
      `SELECT title
        FROM jobs
        WHERE title=$1
        AND salary=$2
        AND equity=$3
        AND company_handle=$4`,
      [title, salary, equity, companyHandle]
    );
    if (existingJob.rows.length > 0) {
      throw new BadRequestError("Duplicate job");
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

  static async findAll() {
    const jobsRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        ORDER BY id`
    );
    return jobsRes.rows;
  }
  static async get(id) {
    const result = await db.query(
      `SELECT title,
              salary,
              equity,
              company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`,
      [id]
    );
    const job = result.rows[0];
    if (!job) throw new NotFoundError(`No job: ${id}`);
    return job;
  }

  static async findByTitle(title) {
    const jobsRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE LOWER(title) LIKE $1`,
      [`%${title.toLowerCase()}%`]
    );
    if (!jobsRes.rows.length) throw new NotFoundError(`No job: ${title} found`);
    return jobsRes.rows;
  }
  static async minSalary(num) {
    if (typeof num !== "number" || num < 0) {
      throw new BadRequestError(`Invalid input: ${num}`);
    }
    const jobsRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE salary >= $1
        ORDER BY salary ASC`,
      [num]
    );
    if (!jobsRes.rows.length)
      throw new NotFoundError(`No job with minimum salary: ${num}`);
    return jobsRes.rows;
  }
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      title: "title",
      salary: "salary",
      equity: "equity",
    });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                      SET ${setCols}
                      WHERE id = ${idVarIdx}
                      RETURNING id,
                                title,
                                salary,
                                equity,
                                company_handle AS "companyHandle`;

    const result = await db.query(querySql, [...values, id]);

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }
  static async remove(id) {
    const result = await db.query(
      `DELETE FROM jobs
        WHERE id = $1
        RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
