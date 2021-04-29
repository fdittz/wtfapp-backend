var axios = require('axios');
const ESDADDRES = require('./esaddress');

var esutil = {
    sendQuery(query, index) {
        return axios.get(ESDADDRES + `/${index ? index : 'tf'}/_search`, {
            headers: {"Content-Type": "application/json"},
            data: (query),
        }).then((res) => {
            return res
        }).catch(err => {
           return Promise.reject();
        }); 
    }
}

module.exports = esutil;
