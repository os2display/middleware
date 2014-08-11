/**
* @file
* Node jasmine 2.0 Configuration object tests.
*/

describe("Configuration tests", function() {

  // Test that configuration gets loaded.
  it("Get options", function() {
    var config = require('../lib/configuration');
    expect(config.get('port')).toEqual(3000);

    expect(config.get('maintenance')).toEqual({
      "username": "admin",
      "password": "password"
    });
  });
});