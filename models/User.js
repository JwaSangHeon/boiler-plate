const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10; // 글자 수
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    maxlength: 50
  },
  email: {
    type: String,
    trim: true,// 공백을 지워준다.(ex. whk 4051 => whk4051)
    unique: 1 // 유일한 값
  },
  password: {
    type: String,
    minlength: 5
  },
  lastname: {
    type: String,
    maxlength: 50
  },
  role: {
    type: Number,
    default: 0
  },
  image: String,
  token: {
    type: String
  },
  tokenExp: {
    type: Number
  }
})


userSchema.pre('save', function(next){
  var user = this;


  if(user.isModified('password')) {
    //비밀번호를 암호화 시킨다.
    bcrypt.genSalt(saltRounds, function(err, salt) {
    if(err) return next(err);

    bcrypt.hash(user.password, salt, function(err, hash) {
        // Store hash in your password DB.
        if(err) return next(err);
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
})

userSchema.methods.comparePassword = function(plainPassword, callback){
  //plainPassword 1234567   암호화된 비밀번호 $2b$10$/3Dpmj0i.o3Fsaxoe1UxeO.Hdi8shIej3Bron0lLs/bRHtlqbrWFi

  bcrypt.compare(plainPassword, this.password, function(err, isMatch) {
    if(err) return callback(err);
    callback(null, isMatch);
  })
}


userSchema.methods.generateToken = function(callback){
  var user = this;
  //jsonwebtoken을 이용해서 token을 생성하기
  var token = jwt.sign(user._id.toHexString(), 'secretToken')// user._id + 'secretToken' = token -> 나중에 'secretToken으로 user._id를 알아낼 수 있다. 

  user.token = token
  user.save(function(err, user) {
    if(err) return callback(err);
    callback(null, user);
  })
}

userSchema.statics.findByToken = function(token, callback){
  var user = this;

  // 토큰을 decode 한다.
  jwt.verify(token, 'secretToken', function(err, decoded){
    //유저 아이디를 이용해서 유저를 찾은 다음에
    //클라이언트에서 가져온 token과 DB에 보관된 토큰이 일치하는지 확인

    user.findOne({"_id": decoded, "token":token}, function(err, user){
      if(err) return callback(err);
      callback(null, user);
    })
  })
}

const User = mongoose.model('User', userSchema)

module.exports = {User}