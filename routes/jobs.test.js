"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/******************************* post */
describe("POST /jobs", () => {
  const newJob = {
    title: "Test",
    salary: 100000,
    equity: 0.09,
    companyHandle: "c1",
  };
  test("ok for admin", async () => {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        ...newJob,
        equity: String(newJob.equity),
      },
    });
  });

  test("fail for non-admin", async () => {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(401);
  });
  test("bad request with missing data", async () => {
    const resp = await request(app)
      .post("/jobs")
      .send({
        salary: 100000,
        companyHandle: "c2",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request with invalid data", async () => {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        equity: "fail-test",
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(400);
  });
});

/******************************* get  */
describe("GET /jobs", () => {
  test("works", async () => {
    const resp = await request(app).get("/jobs");
    const jobsId = resp.body.jobs.map((job) => job.id);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: jobsId[0],
          title: "Test engineer",
          salary: 1000,
          equity: "0.01",
          companyHandle: "c1",
        },
        {
          id: jobsId[1],
          title: "Test operator",
          salary: 2000,
          equity: "0.02",
          companyHandle: "c2",
        },
        {
          id: jobsId[2],
          title: "Test analyst",
          salary: 3000,
          equity: "0",
          companyHandle: "c3",
        },
      ],
    });
  });
});

/******************************* get/:id */
describe("GET /jobs/:id", () => {
  test("works", async () => {
    const resp = await request(app).get("/jobs");
    const jobsId = resp.body.jobs.map((job) => job.id);
    const response = await request(app).get(`/jobs/${jobsId[0]}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      job: {
        title: "Test engineer",
        salary: 1000,
        equity: "0.01",
        companyHandle: "c1",
      },
    });
  });
  test("fails non-existent id", async () => {
    const resp = await request(app).get("/jobs/0");

    expect(resp.statusCode).toEqual(404);
  });
  test("fails with invalid id format", async () => {
    const resp = await request(app).get("/jobs/invalid-id");
    expect(resp.statusCode).toEqual(500);
  });
});

/******************************* patch */
describe("PATCH /jobs/:id", () => {
  test("works", async () => {
    const response = await request(app).get("/jobs");
    const jobsId = response.body.jobs.map((job) => job.id);
    const resp = await request(app)
      .patch(`/jobs/${jobsId[0]}`)
      .send({
        title: "Test engineer update",
        salary: 5000,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      job: {
        id: jobsId[0],
        title: "Test engineer update",
        salary: 5000,
        equity: "0.01",
        companyHandle: "c1",
      },
    });
  });
  test("fails because of invalid data", async () => {
    const response = await request(app).get("/jobs");
    const jobsId = response.body.jobs.map((job) => job.id);
    const resp = await request(app)
      .patch(`/jobs/${jobsId[0]}`)
      .send({
        salary: "100",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
  test("fails because unauthorized", async () => {
    const response = await request(app).get("/jobs");
    const jobsId = response.body.jobs.map((job) => job.id);
    const resp = await request(app)
      .patch(`/jobs/${jobsId[0]}`)
      .send({
        title: "Failed test engineer update",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
  test("fails because invalid id", async () => {
    const resp = await request(app)
    .patch("/jobs/0")
    .send({
        title: "Failed update",
    })
    .set("authorization", `Bearer ${adminToken}`);
    
    expect(resp.statusCode).toEqual(404);
  });
  test("fails with non-existent field in request body", async () => {
    const response = await request(app).get("/jobs");
    const jobsId = response.body.jobs.map((job) => job.id);
    const resp = await request(app)
      .patch(`/jobs/${jobsId[0]}`)
      .send({ nonExistentField: "value" })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
  test("fails with invalid data types in request body", async () => {
    const response = await request(app).get("/jobs");
    const jobsId = response.body.jobs.map((job) => job.id);
    const resp = await request(app)
      .patch(`/jobs/${jobsId[0]}`)
      .send({ salary: "invalid" })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
  
});
/******************************* delete */
describe("DELETE /jobs/:id", () => {
    test("works for admin", async () => {
      const response = await request(app).get("/jobs");
      const jobsId = response.body.jobs.map((job) => job.id);
      const resp = await request(app)
        .delete(`/jobs/${jobsId[0]}`)
        .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ deleted: `${jobsId[0]}`});
    });
  
    test("unauth for non-admin", async () => {
      const response = await request(app).get("/jobs");
      const jobsId = response.body.jobs.map((job) => job.id);
      const resp = await request(app)
        .delete(`/jobs/${jobsId[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found for no such job", async () => {
      const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(404);
    });
  });
  