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
    const jobs = await Job.findAll();

    const firstJobId = jobs[0].id;
    const secondJobId = jobs[1].id;
    const thirdJobId = jobs[2].id;
    expect(jobs).toEqual([
      {
        id: firstJobId,
        title: "Test job 1",
        salary: 100,
        equity: "0.09",
        companyHandle: "c1",
      },
      {
        id: secondJobId,
        title: "Test job 2",
        salary: 200,
        equity: "0.08",
        companyHandle: "c2",
      },
      {
        id: thirdJobId,
        title: "Test job 3",
        salary: 300,
        equity: "0",
        companyHandle: "c3",
      },
    ]);
  });
});
/*********************************** getJobs(filters) */
describe("getJobs", () => {
  beforeEach(async () => {
    await db.query("DELETE FROM jobs");
    await db.query(`INSERT INTO jobs (id, title, salary, equity, company_handle) 
                      VALUES (1, 'Engineer', 50000, 0.1, 'c1'),
                             (2, 'Manager', 60000, 0.2, 'c2')`);
  });

  test("gets all jobs without filters", async () => {
    const jobs = await Job.getJobs({});
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toHaveProperty("id");
    expect(jobs[0]).toHaveProperty("title");
    expect(jobs[0]).toHaveProperty("salary");
    expect(jobs[0]).toHaveProperty("equity");
    expect(jobs[0]).toHaveProperty("company_handle");
  });

  test("filters by title", async () => {
    const jobs = await Job.getJobs({ title: "Engineer" });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toEqual("Engineer");
  });

  test("filters by minSalary", async () => {
    const jobs = await Job.getJobs({ minSalary: 55000 });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toEqual("Manager");
  });

  test("filters by hasEquity", async () => {
    const jobs = await Job.getJobs({ hasEquity: true });
    expect(jobs).toHaveLength(2);
  });

  test("throws BadRequestError for invalid filter field", async () => {
    await expect(Job.getJobs({ invalidField: "invalid" })).rejects.toThrow(
      "Invalid filter field: invalidField"
    );
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

/************************************** update */
describe("update", () => {
  test("works", async () => {
    const job = await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle)
        VALUES ('Another test job', 400, 0.07, 'c1')
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`
    );
    const jobId = job.rows[0].id;
    const updateData = {
      title: "Updated test job",
      salary: 500,
      equity: 0,
    };
    const result = await Job.update(jobId, updateData);
    expect(result).toEqual({
      id: jobId,
      title: "Updated test job",
      salary: 500,
      equity: "0",
      companyHandle: "c1",
    });
  });
  test("fails for invalid key", async () => {
    const job = await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle)
        VALUES ('Another test job', 400, 0.07, 'c1')
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`
    );
    const jobId = job.rows[0].id;
    const updateData = {
      name: "Gonna fail",
    };
    try {
      await Job.update(jobId, updateData);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
      expect(err.message).toEqual(`Invalid key: name`);
    }
  });
});
/************************************** remove */
describe("remove by id", () => {
  test("ok", async () => {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id;
    const result = await Job.remove(jobId);
    expect(result).toEqual({ id: jobId });

    // Verify the job has been removed
    try {
      await Job.get(jobId);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
