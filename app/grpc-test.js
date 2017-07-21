var PROTO_PATH = __dirname + '/../protos/fabcar.proto'

var grpc = require('grpc');
var fabcar_proto = grpc.load(PROTO_PATH).fabcar;

function main() {
  var fabcar = new fabcar_proto.FabcarService('172.16.5.18:50051',
                                       grpc.credentials.createInsecure());
  fabcar.queryCar({car:'CAR2'}, function(err, response) {
    console.log(response)
  }) 
}

main();
