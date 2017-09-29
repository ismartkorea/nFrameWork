var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var SessionSchema = new Schema({
    _id : String,
    session : String,
    expires : Date
});

module.exports = SessionSchema;