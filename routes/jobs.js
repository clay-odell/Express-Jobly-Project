"use strict";

/** Routes for jobs */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
} = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

router.post(
  "/",
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  async (req, res, next) => {
    try {
      const validator = jsonschema.validate(req.body, jobNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const job = await Job.create(req.body);
      return res.status(201).json({ job });
    } catch (err) {
      return next(err);
    }
  }
);

router.get("/", async (req, res, next) => {
  try {
    const jobs = await Job.findAll();
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const job = await Job.get(req.params.id);
    
    return res.status(200).json({ job });
  } catch (err) {
    return next(err);
  }
});

router.patch(
  "/:id",
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  async (req, res, next) => {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }
      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  }
);

router.delete(
  "/:id",
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  async (req, res, next) => {
    try {
      await Job.remove(req.params.id);
      return res.json({ deleted: req.params.id });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
