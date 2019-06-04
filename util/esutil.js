var axios = require('axios');
const ESDADDRES = require('./esaddress');

var esutil = {
    sendQuery(query) {
        return axios.get(ESDADDRES + '/tf/_search', {
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
