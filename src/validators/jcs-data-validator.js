module.exports = {
  validate: function (data, res) {
    console.log(data);

    if (data.products == null || data.products.length == 0) {
      res.send({ status: false, message: "No Products found" });
    }
  }
};