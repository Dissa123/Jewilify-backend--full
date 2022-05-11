var InventoryData = require('../connectors/mongo-jcs-connector');

module.exports = {
  save: function (item) {
    var data = new InventoryData(item);
    return data.save().catch((error) => {
      //console.log(error.response.data);
    });
  },

  fetch: function () {
    var data = new InventoryData();
    return data.find({}).catch((error) => {
      //console.log(error.response.data);
    });
  }
};