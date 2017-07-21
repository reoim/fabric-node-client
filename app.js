'use strict'

const PROTO_PATH = __dirname + '/protos/fabcar.proto'

const hfc = require('fabric-client')
const path = require('path')
const grpc = require('grpc')

const fabcar_proto = grpc.load(PROTO_PATH).fabcar

let userOptions = {
    wallet_path: path.join(__dirname, './creds'),
    user_id: 'PeerAdmin',
    channel_id: 'mychannel',
    chaincode_id: 'fabcar',
    network_url: 'grpc://localhost:7051'
}

let channel = {}
let client = null

function queryCar(call, callback) {
    console.log(call.request.car)
    Promise.resolve().then(() => {
        console.log("Create a client and set the wallet location")
        client = new hfc()
        return hfc.newDefaultKeyValueStore({ path: userOptions.wallet_path })
    }).then((wallet) => {
        console.log("Set wallet path, and associate user ", userOptions.user_id, " with application")
        client.setStateStore(wallet)
        return client.getUserContext(userOptions.user_id, true)
    }).then((user) => {
        console.log("Check user is enrolled, and set a query URL in the network")
        if (user === undefined || user.isEnrolled() === false) {
            console.error("User not defined, or not enrolled - error")
        }
        channel = client.newChannel(userOptions.channel_id)
        channel.addPeer(client.newPeer(userOptions.network_url))
        return
    }).then(() => {
        console.log("Make query")
        let transaction_id = client.newTransactionID();
        console.log("Assigning transaction_id: ", transaction_id._transaction_id);
        let request = {
            chaincodeId: userOptions.chaincode_id,
            txId: transaction_id,
            fcn: 'queryCar',
            args: []
        };
        request.args.push(call.request.car)
        return channel.queryByChaincode(request);
    }).then((query_responses) => {
        console.log("returned from query");
        
        if (query_responses[0] instanceof Error) {
            console.error("error from query = ", query_responses[0])
        } else if (!query_responses.length) {
            console.log("No payloads were returned from query")
        } else {
            console.log(JSON.parse(query_responses))            
            callback(null, JSON.parse(query_responses[0]))
            return query_responses[0]
        }
    }).catch((err) => {
        console.error("Caught Error", err)
    })
}

function main() {
  let server = new grpc.Server()
  server.addService(fabcar_proto.FabcarService.service, {queryCar: queryCar})
  server.bind('172.16.5.18:50051', grpc.ServerCredentials.createInsecure())
  server.start()
}

main()