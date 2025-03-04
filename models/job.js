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
    if (!job) throw new NotFoundError(`No job with id: ${id}`);
    return job;
  }

  static async update(id, data) {
    const validKeys = new Set(["title", "salary", "equity"]);
    for (let key in data) {
      if (!validKeys.has(key)) {
        throw new BadRequestError(`Invalid key: ${key}`);
      }
    }

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
                                company_handle AS "companyHandle"`;

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
    return job;
  }
  static async getJobs(filters) {
    const validFields = ["title", "minSalary", "hasEquity"];
    const selectClause = `SELECT id, title, salary, equity, company_handle`;
    let where = [];
    let values = [];

    for (let field in filters) {
      if (!validFields.includes(field))
        throw new BadRequestError(`Invalid filter field: ${field}`);
    }
    const { title, minSalary, hasEquity } = filters;
    if (title) {
      where.push("LOWER(title) LIKE $" + (where.length + 1));
      values.push("%" + title.toLowerCase() + "%");
    }
    if (minSalary) {
      where.push("salary >= $" + (where.length + 1));
      values.push(minSalary);
    }
    if (hasEquity) {
      where.push("equity > 0");
    }
    let query = `${selectClause} FROM jobs`;
    if (where.length > 0) {
      query += " WHERE " + where.join(" AND ");
    }
    const result = await db.query(query, values);
    return result.rows;
  }
  static async getJobsByCompany(companyHandle) {
    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE company_handle = $1`,
      [companyHandle]
    );
    if (result.rows.length === 0)
      throw new NotFoundError(`No jobs found for company: ${companyHandle}`);
    return result.rows;
  }
}
module.exports = Job;
