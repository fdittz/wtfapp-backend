const { exec } = require("child_process");
const getPort = require('get-port');
const { sendQuery } = require("../util/esutil");
var servers = "aa";

class GameInstance {
    constructor(name) {
        this.name = name
        this.gamedig = require('gamedig');
        this.hostname = "";
        this.port = 0;
        this.interval;
        this.alive = 0;
        this.gameInfo;     
    }

    toJSON() {
        return {
            name: this.name,
            port: this.port,
            gameInfo: this.gameInfo
        }
    }

    setServers(serverList) {
        servers = serverList;
    }

    run() {
        return new Promise((resolve, reject) => {
            exec(`sudo docker kill ${this.name}`, (error, stdout, stderr) => {
                resolve(this.docker());
            });
        });
    }

    clear() {
        console.log(`Killig instance ${this.name} on port ${this.port}`);
        exec(`sudo docker kill ${this.name}`, (error, stdout, stderr) => {
            if (error) {
                console.log(`Error while killing instance ${this.name} on port ${this.port}: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`Error while killing instance ${this.name} on port ${this.port}: ${stderr}`);
                return;
            }
            console.log(`Killed instance ${this.name} on port ${this.port}`);
            console.log(servers);
            delete servers[this.name];
            console.log(servers);
            clearInterval(this.interval); 
            return;    
        });
    }

    async docker() {
        var testPorts = Array.from({length:6},(v,k)=>k+27510)
        this.port = await getPort({port: testPorts})
        console.log(`Found port ${this.port}`)
        return new Promise((resolve, reject) => {
            this.execCommand(`
                sudo docker run -ti -d \
                --rm \
                --name ${this.name} \
                --network host  \
                -v docker-server_assets:/fortressonesv/fortress/assets/ \
                -v docker-server_staging_dats:/fortressonesv/fortress/dats/ \
                -v docker-server_hue-demos:/fortressonesv/fortress/demos/ \
                -v docker-server_hue-stats:/fortressonesv/fortress/data/ \
                -v docker-server_configs:/fortressonesv/fortress/configs/ \
                fortressone/fortressonesv -port ${this.port} \
                +set sv_port_tcp ${this.port} \
                +set hostname "Samson's ondemand FO" \
                +set password "test" \
                +set rcon_password "rcon" \
                +localinfo adminpwd "test" \
                +exec fo_quadmode.cfg \
                +exec configs/huetf.cfg \
                +map 2fort5r`)
            .then(async (result) => {
                console.log(result);
                this.check();
                this.gameInfo = await this.sendQuery();
                resolve(this);        
            })
            .catch(err => {
                reject({"error" : err});
            })  
        });
    }
    
    async execCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                    if (error) {
                        reject(error.message);
                        return;
                    }
                    if (stderr) {
                        reject(stderr);
                        return;
                    }    
                    resolve(stdout);
            });

        });
        
    }
    

    check() {
        this.interval = setInterval(() => { 
            this.sendQuery().then((state) => {
                this.gameInfo = state;
                console.log(state)
                if (state.players.length > 0) {
                    this.alive = 0;
                } else {
                    if (this.alive < 3 ) { 
                        this.alive++;
                    }
                    else{
                        this.clear();
                    }
                }                
            }).catch((error) => {
                console.log(error);
            });        
        }, 10000);
    }

    
    async sendQuery() {
        let tries = 0;
        return this.gamedig.query({
            type: 'quake1',
            host: 'localhost',
            port: this.port
        }).then(state => {
            return state;
        }).catch(async(err) => {
            if (tries > 3)
                return err;
            tries++;
            await this.sleep(2000);
            return this.sendQuery();
        });
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = GameInstance;