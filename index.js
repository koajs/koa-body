'use strict';

var co_body = require('co-body');


module.exports = function(opts){
  return function *(next){
    if(this.is('application/json')){
      this.request.body = yield co_body.json(this);
    }
    else if(this.is('application/x-www-form-urlencoded')){
      this.request.body = yield co_body.form(this);
    }
    yield next;
  };
};
