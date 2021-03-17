const mongoose = require('mongoose');

const Car = mongoose.model('car', {
    brand:{
        type:String,
        required:true, 
    },
    year:{
        type:Number,
        required:true,
        validate(value){
            console.log(typeof value)
            if(!(Number(value) > 2010)){
               throw new Error(`Path year ${value} cannot be less than 2010`) 
            }
        }
    },
    amount:{
        type:Number,
        default:0,
        validate(amount){
            if(!(Number(amount) > 3000)){
                throw new Error(`You will never buy a car at ${amount}!`)
            }
        }
    }
})
module.exports = Car