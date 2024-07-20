const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("Tests sqlForPartialUpdate", function () {
  test("Generates correct SQL for multiple fields update", function () {
    const result = sqlForPartialUpdate(
      { firstName: "Aliya", age: "32" },
      { firstName: "first_name", age: "age" }
    );
    expect(result).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ["Aliya", "32"],
    });
  });
  test("Generates correct SQL for single field update", function () {
    const result = sqlForPartialUpdate(
      { firstName: "Bob" },
      { firstName: "first_name" }
    );
    expect(result).toEqual({
      setCols: '"first_name"=$1',
      values: ["Bob"],
    });
  });

  test("Generates BadRequestError for invalid data", function () {
    expect(() => sqlForPartialUpdate({}, {})).toThrow(BadRequestError);
  });

  test("Correctly maps JS property names to SQL column names", async function () {
    const result = sqlForPartialUpdate(
      { firstName: "Aliya", age: "32", isAdmin: true },
      { firstName: "first_name", age: "age", isAdmin: "is_admin" }
    );
    expect(result).toEqual({
      setCols: '"first_name"=$1, "age"=$2, "is_admin"=$3',
      values: ["Aliya", "32", true],
    });
  });

  test("Correctly uses JS property names when no mapping is provided", function () {
    const result = sqlForPartialUpdate(
      { firstName: "Aliya", age: "32", isAdmin: true },
      {}
    );
    expect(result).toEqual({
      setCols: '"firstName"=$1, "age"=$2, "isAdmin"=$3',
      values: ["Aliya", "32", true],
    });
  });
});
