"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testEngineerId,
  testJobId,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */
describe("create", () => {
  const newJob = {
    title: "New test job",
    salary: 50000,
    equity: "0",
    companyHandle: "c1",
  };
  test("works", async () => {
    let job = await Job.create(newJob);

    expect(job).toEqual(newJob);

    const result = await db.query(
      `SELECT  title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE title = 'New test job'`
    );

    expect(result.rows).toEqual([
      {
        title: "New test job",
        salary: 50000,
        equity: "0",
        companyHandle: "c1",
      },
    ]);
  });
  test("bad request for being dupe", async () => {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      findAll();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});
/************************************** findAll */
describe("findAll", () => {
  test("works", async () => {
    const jobs = await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle)
           VALUES ('Test engineer', 100, '0.10', 'c1'),
                  ('Test job', 200, '0.20', 'c2')
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`
    );
    const testEngineerId = jobs.rows[0].id;
    const testJobId = jobs.rows[1].id;

    const result = await Job.findAll();
    expect(result).toEqual([
      {
        id: testEngineerId,
        title: "Test engineer",
        salary: 100,
        equity: "0.10",
        companyHandle: "c1",
      },
      {
        id: testJobId,
        title: "Test job",
        salary: 200,
        equity: "0.20",
        companyHandle: "c2",
      },
    ]);
  });
});
/************************************** get(id) */

/************************************** getIdByTitle */

/************************************** findByTitle */

/************************************** minSalary */

/************************************** update */

/************************************** remove */
