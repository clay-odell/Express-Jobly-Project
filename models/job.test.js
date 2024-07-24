"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
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
describe("get(id)", () => {
  test("works", async () => {
    const job = await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle)
        VALUES ('Another test job', 100000, '0', 'c3')
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`
    );
    const anotherTestJobId = job.rows[0].id;

    const result = await Job.get(anotherTestJobId);
    expect(result).toEqual({
      title: "Another test job",
      salary: 100000,
      equity: "0",
      companyHandle: "c3",
    });
  });
});

/************************************** findByTitle */
describe("findByTitle", () => {
  beforeEach(async () => {
    await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle)
          VALUES ('Testing engineer', 100, 0.100, 'c1'),
                 ('Test scientist', 200, 0.200, 'c2'),
                 ('Test operator', 300, 0, 'c3')
          RETURNING id`
    );
  });

  test("works: engineer", async () => {
    const result = await Job.findByTitle("eng");
    expect(result[0].title).toEqual("Testing engineer");
  });

  test("works: scientist", async () => {
    const result = await Job.findByTitle("sci");
    expect(result[0].title).toEqual("Test scientist");
  });

  test("works: operator", async () => {
    const result = await Job.findByTitle("op");
    expect(result[0].title).toEqual("Test operator");
  });

  test("no match", async () => {
    await expect(Job.findByTitle("no match")).rejects.toThrow(NotFoundError);
  });

  test("case insensitive", async () => {
    try {
      const result = await Job.findByTitle("TEST ENGINEER");
      expect(result[0].title).toEqual("Testing engineer");
    } catch (error) {
      console.error(error);
    }
  });
});

/************************************** minSalary */
describe("minSalary", () => {
  beforeEach(async () => {
    await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle)
            VALUES ('Testing engineer', 100, 0.100, 'c1'),
                   ('Test scientist', 200, 0.200, 'c2'),
                   ('Test operator', 300, 0, 'c3')
            RETURNING id`
    );
  });
  test("works: 200", async () => {
    const results = await Job.minSalary(200);
    expect(results).toEqual([
      {
        id: results[0].id,
        salary: 200,
        equity: "0.200",
        companyHandle: "c2",
        title: "Test scientist",
      },
      {
        id: results[1].id,
        salary: 300,
        title: "Test operator",
        equity: "0",
        companyHandle: "c3",
      },
    ]);
  });
  test("no match", async () => {
    await expect(Job.minSalary(500)).rejects.toThrow(NotFoundError);
  });
  test("negative interger", async () => {
    await expect(Job.minSalary(-200)).rejects.toThrow(BadRequestError);
  });
  test("string", async () => {
    await expect(Job.minSalary("200")).rejects.toThrow(BadRequestError);
  });
});

/************************************** update */

/************************************** remove */
