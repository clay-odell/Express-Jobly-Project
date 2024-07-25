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
    console.log(resp.body);
    expect(resp.statusCode).toEqual(400);
  });
});

/******************************* get  */

/******************************* get/:id */

/******************************* patch */

/******************************* delete */
