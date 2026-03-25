import { logfmt } from "./logfmt.utilities";

describe("logfmt Functions", () => {
  it("It should transform object to logfmt", () => {
    const result = logfmt.ObjectToLogfmt({
      context: "JestTester",
      message: "test",
    });
    expect(result).toEqual("message=test");
  });

  it("It should transform object to logfmt", () => {
    const result = logfmt.ObjectToLogfmt({
      context: "JestTester",
      message: "test",
      userId: "testUser",
    });
    expect(result).toEqual("message=test userId=testUser");
  });

  it("It should transform object to logfmt", () => {
    const result = logfmt.ObjectToLogfmt({
      message: "test",
      userId: "testUser",
      context: "JestTester",
      error: new Error("Test Error"),
    });

    expect(result).toMatch(
      /^.*message=test userId=testUser\s.*Error: Test Error/gm
    );
  });
});
