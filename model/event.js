const mongoose = require('mongoose')

const EventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    phone: {
        type: String,
        validate: {
          validator: function(v) {
            return /\d{3}-\d{3}-\d{4}/.test(v);
          },
          message: props => `${props.value} is not a valid phone number!`
        },
        required: [true, 'User phone number required']
    },
    email: {
        type: String,
        validate: {
          validator: (email) => /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(email),
          message: 'Email validation failed'
        }
    },
    price: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
              return /^([01]\d|2[0-3]):?([0-5]\d)$/.test(v);
            },
            message: props => `${props.value} is not a valid time!`
        }
    },
    link: {
        type: String,
        required: true
    },
    description: {
        type: String,
    }
});

const Event = mongoose.model('Event', EventSchema, 'events')

module.exports = Event